import { Header } from "@/components/layout/header";
import { CreateTournamentForm } from "@/components/clubs/create-tournament-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CreateTournamentPage() {
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
      <Header title="Crear Torneo" showBack />
      <div className="p-4">
        <CreateTournamentForm />
      </div>
    </>
  );
}

