import { Header } from "@/components/layout/header";
import { TournamentDetail } from "@/components/tournaments/tournament-detail";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface TournamentPageProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

