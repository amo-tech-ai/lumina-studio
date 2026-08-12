-- IPI-639 P2: atomic moderation update + audit (provider moderation, not business approval)
-- Business approval remains separate via asset_approvals or asset_events with actorId (UI), not this webhook

create or replace function public.handle_moderation_event(
  p_cloudinary_asset_id text,
  p_version bigint,
  p_moderation_status text,
  p_request_id text,
  p_moderation_kind text,
  p_public_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asset_id uuid;
  v_version bigint;
  v_kind text;
  v_current_status text;
begin
  -- Same-status retry no-op: if already in desired status for that version, skip (idempotent, no new audit)
  if p_version is not null then
    select moderation_status into v_current_status from public.cloudinary_assets where cloudinary_asset_id = p_cloudinary_asset_id and version = p_version limit 1;
  else
    select moderation_status into v_current_status from public.cloudinary_assets where cloudinary_asset_id = p_cloudinary_asset_id limit 1;
  end if;
  if v_current_status = p_moderation_status then
    return;
  end if;

  -- Provider moderation audit is always kind moderated (business approved is separate)
  v_kind := 'moderated';

  -- Update exact version if version present, else per-asset
  if p_version is not null then
    update public.cloudinary_assets
      set moderation_status = p_moderation_status
      where cloudinary_asset_id = p_cloudinary_asset_id and version = p_version;
  else
    update public.cloudinary_assets
      set moderation_status = p_moderation_status
      where cloudinary_asset_id = p_cloudinary_asset_id;
  end if;

  if not found then
    -- Phantom asset — no mirror, skip audit (do not create false history)
    return;
  end if;

  -- Lookup canonical asset_id/version for audit — version-bound when version present
  if p_version is not null then
    select asset_id, version into v_asset_id, v_version
      from public.cloudinary_assets
      where cloudinary_asset_id = p_cloudinary_asset_id and version = p_version
      limit 1;
  else
    select asset_id, version into v_asset_id, v_version
      from public.cloudinary_assets
      where cloudinary_asset_id = p_cloudinary_asset_id
      limit 1;
  end if;

  if v_asset_id is null then
    return;
  end if;

  -- Deterministic request_id for idempotency: use provided Cloudinary request_id when present.
  -- Same-status retries (same request_id) are no-ops via ON CONFLICT; repeated transitions must have new request_id from Cloudinary to be recorded.
  -- Fallback distinguishes provider status: assetId:version:moderated:moderationStatus (no timestamp per 914 fix)
  if p_request_id is null then
    p_request_id := p_cloudinary_asset_id || ':' || coalesce(p_version::text, '0') || ':' || v_kind || ':' || p_moderation_status;
  end if;

  insert into public.asset_events (asset_id, cloudinary_asset_id, version, kind, request_id, reason, metadata)
    values (v_asset_id, p_cloudinary_asset_id, coalesce(v_version, p_version), v_kind, p_request_id, p_moderation_kind, jsonb_build_object('public_id', p_public_id))
    on conflict (request_id, asset_id) do nothing;
end;
$$;

revoke all on function public.handle_moderation_event(text, bigint, text, text, text, text) from public, anon, authenticated;
grant execute on function public.handle_moderation_event(text, bigint, text, text, text, text) to service_role;

comment on function public.handle_moderation_event is 'IPI-639 atomic: moderation_status update + asset_events moderated (provider, not business approval). Business approval uses separate asset_approvals with actorId.';
