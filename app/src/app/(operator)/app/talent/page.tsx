import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TalentIndexPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: own } = await supabase.rpc("get_own_talent_profile");
  const id = own && typeof own === "object" && "id" in own ? String((own as { id: string }).id) : null;

  if (!id) redirect("/app/talent/onboarding");
  redirect(`/app/talent/profile?talentId=${id}`);
}
