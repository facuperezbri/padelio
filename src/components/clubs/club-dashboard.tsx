"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { useMyClubAsOwner } from "@/lib/react-query/hooks/use-clubs";
import { useTournamentsByClub } from "@/lib/react-query/hooks/use-tournaments";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";

export function ClubDashboard() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { data: club, isLoading: clubLoading } = useMyClubAsOwner(userId);
  const { data: tournaments, isLoading: tournamentsLoading } =
    useTournamentsByClub(club?.id);

  useEffect(() => {
    async function getUserId() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUserId();
  }, []);

  if (clubLoading || tournamentsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <PadelBallLoader size="lg" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive">No se encontró tu club</p>
      </div>
    );
  }

  const activeTournaments =
    tournaments?.filter((t) => t.status === "open" || t.status === "in_progress") || [];
  const draftTournaments =
    tournaments?.filter((t) => t.status === "draft") || [];
  const finishedTournaments =
    tournaments?.filter((t) => t.status === "finished") || [];

  const totalRegistrations = tournaments?.reduce(
    (sum, t) => sum + t.registration_count,
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{club.name}</h1>
        {club.city && club.province && (
          <p className="text-muted-foreground">
            {club.city}, {club.province}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Trophy className="mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{tournaments?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Torneos Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Users className="mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{totalRegistrations}</p>
            <p className="text-xs text-muted-foreground">Inscripciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Torneos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeTournaments.slice(0, 3).map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{tournament.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tournament.registration_count} inscriptos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft Tournaments */}
      {draftTournaments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Borradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {draftTournaments.slice(0, 3).map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{tournament.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Sin publicar
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

