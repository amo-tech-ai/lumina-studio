import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TalentOnboardingWizard } from "@/components/talent/talent-onboarding-wizard";
import { canAccessTalentOnboarding } from "@/lib/talent/onboarding-access";

export const dynamic = "force-dynamic";

export default async function TalentOnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("org_members").select("role").eq("user_id", user.id),
  ]);

  if (
    !canAccessTalentOnboarding({
      profileRole: profile?.role ?? null,
      orgRoles: (memberships ?? []).map((row) => row.role),
    })
  ) {
    redirect("/app");
  }

  return <TalentOnboardingWizard />;
}
