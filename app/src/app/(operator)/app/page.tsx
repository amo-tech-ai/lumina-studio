import { redirect } from "next/navigation";
import { CommandCenter } from "@/components/command-center/command-center";
import { fetchCommandCenterKpis } from "@/lib/command-center/queries";
import {
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
  if (skip === "1") return <CommandCenter {...DEV_PREVIEW_COMMAND_CENTER_DATA} devPreview />;

  let zeroBrands = false;
  let kpiData = EMPTY_COMMAND_CENTER_DATA;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { count } = await supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count === 0) zeroBrands = true;
      else kpiData = await fetchCommandCenterKpis(supabase, user.id);
    }
  } catch {
    kpiData = {
      ...EMPTY_COMMAND_CENTER_DATA,
      fetchError: "Unable to load dashboard data",
      realtimeStatus: "stale",
    };
  }

  if (zeroBrands) redirect("/app/onboarding");

  return <CommandCenter {...kpiData} />;
};

export default CommandCenterPage;
