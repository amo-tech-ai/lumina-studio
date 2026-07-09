import { notFound } from "next/navigation";

import { BookingWizardWorkspace } from "@/components/booking/booking-wizard-workspace";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TalentResultSchema } from "@/lib/talent/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BookingWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) notFound();

  // check_talent_availability doubles as the point lookup for a talent
  // profile — called with no date range it just returns the profile row
  // (is_available defaults true when both dates are null, per the RPC's own
  // guard). Re-called with real dates client-side once the operator picks
  // them (booking-wizard-workspace.tsx) for an honest availability check.
  const { data, error } = await supabase.rpc("check_talent_availability", {
    p_talent_profile_id: id,
  });

  if (error) {
    if (error.message?.includes("talent profile not found")) notFound();
    console.error(`[matching/talent/${id}/book] check_talent_availability failed for org ${orgId}:`, error);
    return (
      <BookingWizardWorkspace
        talent={null}
        talentId={id}
        orgId={null}
        fetchError="Unable to load this talent profile. Try again in a moment."
      />
    );
  }

  const parsed = TalentResultSchema.safeParse(data);
  if (!parsed.success) {
    console.error(`[matching/talent/${id}/book] unexpected talent shape for org ${orgId}:`, parsed.error);
    return (
      <BookingWizardWorkspace
        talent={null}
        talentId={id}
        orgId={null}
        fetchError="Unable to load this talent profile. Try again in a moment."
      />
    );
  }

  return <BookingWizardWorkspace key={id} talent={parsed.data} talentId={id} orgId={orgId} fetchError={null} />;
}
