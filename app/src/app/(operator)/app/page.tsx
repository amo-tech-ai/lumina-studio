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

// IPI-11: first-time users (0 brands) are guided to /app/onboarding.
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

  let zeroBrands = false;
  let kpiData = EMPTY_COMMAND_CENTER_DATA;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { count, error: brandCountError } = await supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (brandCountError) {
        kpiData = {
          ...EMPTY_COMMAND_CENTER_DATA,
          fetchError: "Unable to load dashboard data",
          realtimeStatus: "stale",
        };
      } else if (count === 0) {
        zeroBrands = true;
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

  if (zeroBrands) redirect("/app/onboarding");

  return (
    <>
      <CommandCenterBrandSync heroBrandId={kpiData.heroBrand?.id ?? null} />
      <CommandCenter {...kpiData} />
    </>
  );
};

export default CommandCenterPage;
