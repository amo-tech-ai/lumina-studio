-- IPI-685 · SB-EDGE-002 — transactional capture-lead write (service_role only)
-- One RPC for conversation + message + event + lead draft upsert.

create or replace function public.capture_lead_write(
  p_anon_id text,
  p_conversation_id uuid,
  p_message_summary text,
  p_service_interest text,
  p_answers jsonb,
  p_claim_token text,
  p_claim_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid := p_conversation_id;
  v_draft_id uuid;
  v_count int;
begin
  if p_anon_id is null or length(trim(p_anon_id)) = 0 then
    raise exception 'anon_id required' using errcode = '22023';
  end if;
  if p_message_summary is null or length(trim(p_message_summary)) = 0 then
    raise exception 'message_summary required' using errcode = '22023';
  end if;
  if p_claim_token is null or length(trim(p_claim_token)) = 0 then
    raise exception 'claim_token required' using errcode = '22023';
  end if;

  if v_conversation_id is not null then
    select count(*)::int into v_count
      from public.chatbot_conversations c
     where c.id = v_conversation_id
       and c.anon_id = p_anon_id;
    if v_count = 0 then
      v_conversation_id := null;
    end if;
  end if;

  if v_conversation_id is null then
    insert into public.chatbot_conversations (anon_id)
    values (p_anon_id)
    returning id into v_conversation_id;
  end if;

  insert into public.chatbot_messages (conversation_id, role, content)
  values (v_conversation_id, 'user', p_message_summary);

  insert into public.chatbot_events (conversation_id, type, payload)
  values (
    v_conversation_id,
    'lead_captured',
    jsonb_build_object('service_interest', p_service_interest)
  );

  select d.id into v_draft_id
    from public.lead_intake_drafts d
   where d.conversation_id = v_conversation_id
   limit 1;

  if v_draft_id is not null then
    update public.lead_intake_drafts
       set status = 'ready',
           answers = coalesce(p_answers, '{}'::jsonb),
           claim_token = p_claim_token,
           claim_token_expires_at = p_claim_expires_at,
           updated_at = now()
     where id = v_draft_id;
  else
    insert into public.lead_intake_drafts (
      conversation_id,
      status,
      answers,
      claim_token,
      claim_token_expires_at
    )
    values (
      v_conversation_id,
      'ready',
      coalesce(p_answers, '{}'::jsonb),
      p_claim_token,
      p_claim_expires_at
    )
    returning id into v_draft_id;
  end if;

  return jsonb_build_object(
    'conversation_id', v_conversation_id,
    'draft_id', v_draft_id
  );
end;
$$;

revoke all on function public.capture_lead_write(
  text, uuid, text, text, jsonb, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.capture_lead_write(
  text, uuid, text, text, jsonb, text, timestamptz
) to service_role;

comment on function public.capture_lead_write(
  text, uuid, text, text, jsonb, text, timestamptz
) is
  'IPI-685 · SB-EDGE-002 — Atomic lead capture write for Edge capture-lead (service_role only).';
