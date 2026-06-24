import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CommandCenter } from "@/components/command-center/command-center";

// IPI-11: first-time users (0 brands) are guided to /app/onboarding.
// Returning users land on the Command Center as before.
export default async function CommandCenterPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { count } = await supabase
        .from("brands")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count === 0) redirect("/app/onboarding");
    }
  } catch {
    // Auth unavailable (dev/edge) — fall through to Command Center
  }

  return <CommandCenter />;
}
