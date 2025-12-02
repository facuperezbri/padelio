"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { useTournaments } from "@/lib/react-query/hooks/use-tournaments";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
} from "@/types/database";
import { Calendar, Plus, Trophy, Users } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  open: "bg-green-500",
  in_progress: "bg-yellow-500",
  finished: "bg-blue-500",
  cancelled: "bg-red-500",
};

export function TournamentsList() {
  const { data: tournaments, isLoading, error } = useTournaments();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <PadelBallLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive">Error al cargar los torneos</p>
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Sin torneos aún</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Los torneos aparecerán aquí cuando estén disponibles
        </p>
        <Button asChild>
          <Link href="/tournaments/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear Torneo
          </Link>
        </Button>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Torneos</h2>
        <Button size="sm" asChild>
          <Link href="/tournaments/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {tournaments.map((tournament) => (
          <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold line-clamp-1">
                    {tournament.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`${STATUS_COLORS[tournament.status]} text-white shrink-0`}
                  >
                    {TOURNAMENT_STATUS_LABELS[tournament.status]}
                  </Badge>
                </div>

                {tournament.club_name && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {tournament.club_name}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tournament.start_date)}
                    {tournament.end_date &&
                      ` - ${formatDate(tournament.end_date)}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tournament.registration_count} inscriptos
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {TOURNAMENT_FORMAT_LABELS[tournament.format]}
                  </Badge>
                  {tournament.category_label && (
                    <Badge variant="outline" className="text-xs">
                      {tournament.category_label}
                    </Badge>
                  )}
                  {tournament.gender && (
                    <Badge variant="outline" className="text-xs">
                      {tournament.gender}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

