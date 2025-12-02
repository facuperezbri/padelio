import { Header } from "@/components/layout/header";
import { ClubDashboard } from "@/components/clubs/club-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ClubDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is a club type
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "club") {
    redirect("/");
  }

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-4">
        <ClubDashboard />
      </div>
    </>
  );
}

