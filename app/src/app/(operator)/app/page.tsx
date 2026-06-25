import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CommandCenter } from "@/components/command-center/command-center";

// IPI-11: first-time users (0 brands) are guided to /app/onboarding.
// Returning users land on the Command Center as before.
const CommandCenterPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const { skip } = await searchParams;
  if (skip === "1") return <CommandCenter />;

  let zeroBrands = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count === 0) zeroBrands = true;
    }
  } catch {
    // Auth unavailable (dev/edge) — fall through to Command Center
  }

  if (zeroBrands) redirect("/app/onboarding");
  return <CommandCenter />;
};

export default CommandCenterPage;
