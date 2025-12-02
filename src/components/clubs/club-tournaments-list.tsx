"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { useMyClubAsOwner } from "@/lib/react-query/hooks/use-clubs";
import { useTournamentsByClub } from "@/lib/react-query/hooks/use-tournaments";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Plus, Edit } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  open: "bg-green-500",
  in_progress: "bg-yellow-500",
  finished: "bg-blue-500",
  cancelled: "bg-red-500",
};

export function ClubTournamentsList() {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const groupedTournaments = {
    active: tournaments?.filter(
      (t) => t.status === "open" || t.status === "in_progress"
    ) || [],
    draft: tournaments?.filter((t) => t.status === "draft") || [],
    finished: tournaments?.filter((t) => t.status === "finished") || [],
    cancelled: tournaments?.filter((t) => t.status === "cancelled") || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Torneos</h2>
        <Button size="sm" asChild>
          <Link href="/club/tournaments/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear
          </Link>
        </Button>
      </div>

      {/* Active Tournaments */}
      {groupedTournaments.active.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Activos
          </h3>
          {groupedTournaments.active.map((tournament) => (
            <Card key={tournament.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/club/tournaments/${tournament.id}`} className="flex-1">
                    <h3 className="font-semibold line-clamp-1">
                      {tournament.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`${STATUS_COLORS[tournament.status]} text-white shrink-0`}
                    >
                      {TOURNAMENT_STATUS_LABELS[tournament.status]}
                    </Badge>
                    <Link href={`/club/tournaments/${tournament.id}/edit`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tournament.start_date)}
                  </span>
                  <span>{tournament.registration_count} inscriptos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Draft Tournaments */}
      {groupedTournaments.draft.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Borradores
          </h3>
          {groupedTournaments.draft.map((tournament) => (
            <Card key={tournament.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/club/tournaments/${tournament.id}`} className="flex-1">
                    <h3 className="font-semibold line-clamp-1">
                      {tournament.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Borrador</Badge>
                    <Link href={`/club/tournaments/${tournament.id}/edit`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tournament.start_date)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Finished Tournaments */}
      {groupedTournaments.finished.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Finalizados
          </h3>
          {groupedTournaments.finished.map((tournament) => (
            <Card key={tournament.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/club/tournaments/${tournament.id}`} className="flex-1">
                    <h3 className="font-semibold line-clamp-1">
                      {tournament.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-500 text-white">
                      Finalizado
                    </Badge>
                    <Link href={`/club/tournaments/${tournament.id}/edit`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tournament.start_date)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tournaments?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Aún no tenés torneos creados
          </p>
          <Button asChild>
            <Link href="/club/tournaments/new">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Torneo
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

