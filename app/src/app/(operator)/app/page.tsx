import { redirect } from "next/navigation";
import { CommandCenter } from "@/components/command-center/command-center";
import { CommandCenterBrandSync } from "@/components/command-center/command-center-brand-sync";
import { fetchCommandCenterKpis } from "@/lib/command-center/queries";
import {
  DEV_APPROVAL_PREVIEW_COMMAND_CENTER_DATA,
  DEV_PREVIEW_COMMAND_CENTER_DATA,
  EMPTY_COMMAND_CENTER_DATA,
} from "@/lib/command-center/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// IPI-11 / IPI-945 / IPI-1089: first-time users (0 org memberships + 0 brands)
// go to standalone /onboarding (v2).
// IPI-17: returning users see portfolio-first Command Center with live KPI reads.
const CommandCenterPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string | string[] }>;
}) => {
  const params = await searchParams;
  const skip = Array.isArray(params.skip) ? params.skip[0] : params.skip;
  const devFixturesEnabled = process.env.NODE_ENV !== "production";

  if (devFixturesEnabled && skip === "1") {
    return (
      <>
        <CommandCenterBrandSync heroBrandId={DEV_PREVIEW_COMMAND_CENTER_DATA.heroBrand?.id ?? null} />
        <CommandCenter {...DEV_PREVIEW_COMMAND_CENTER_DATA} devPreview />
      </>
    );
  }

  if (devFixturesEnabled && skip === "approval") {
    return (
      <>
        <CommandCenterBrandSync
          heroBrandId={DEV_APPROVAL_PREVIEW_COMMAND_CENTER_DATA.heroBrand?.id ?? null}
        />
        <CommandCenter
          {...DEV_APPROVAL_PREVIEW_COMMAND_CENTER_DATA}
          devPreviewApproval
        />
      </>
    );
  }

  let needsOnboarding = false;
  let kpiData = EMPTY_COMMAND_CENTER_DATA;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // IPI-1089 · ONBOARD-001: org_members is the tenancy authority (AUTH-002).
      // Zero memberships + zero brands → first-user onboarding. One+ memberships
      // → workspace (multi-org org-selection is a later slice). Lookup failure
      // fails closed to a stale dashboard — never route a member to onboarding
      // on a transient error, and never guess an organization.
      const { count: membershipCount, error: membershipError } = await supabase
        .from("org_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { count: brandCount, error: brandCountError } = await supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (membershipError || brandCountError) {
        kpiData = {
          ...EMPTY_COMMAND_CENTER_DATA,
          fetchError: "Unable to load dashboard data",
          realtimeStatus: "stale",
        };
      } else if (membershipCount === 0 && brandCount === 0) {
        needsOnboarding = true;
      } else {
        kpiData = await fetchCommandCenterKpis(supabase, user.id);
      }
    }
  } catch {
    kpiData = {
      ...EMPTY_COMMAND_CENTER_DATA,
      fetchError: "Unable to load dashboard data",
      realtimeStatus: "stale",
    };
  }

  if (needsOnboarding) redirect("/onboarding");

  return (
    <>
      <CommandCenterBrandSync heroBrandId={kpiData.heroBrand?.id ?? null} />
      <CommandCenter {...kpiData} />
    </>
  );
};

export default CommandCenterPage;
