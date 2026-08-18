import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function TalentIndexPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has a talent profile
  const { data: profile } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  // If no profile exists, redirect to onboarding
  if (!profile) {
    redirect("/app/talent/onboarding");
  }

  // Otherwise redirect to profile view
  redirect(`/app/talent/profile?talentId=${profile.id}`);
}
