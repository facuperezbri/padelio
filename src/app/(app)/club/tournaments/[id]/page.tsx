import { Header } from "@/components/layout/header";
import { TournamentDetail } from "@/components/tournaments/tournament-detail";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ClubTournamentPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClubTournamentPage({ params }: ClubTournamentPageProps) {
  const { id } = await params;
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
      <Header title="Torneo" showBack />
      <div className="p-4">
        <TournamentDetail tournamentId={id} />
      </div>
    </>
  );
}


