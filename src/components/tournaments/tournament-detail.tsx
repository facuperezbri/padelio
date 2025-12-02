"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { useTournament } from "@/lib/react-query/hooks/use-tournaments";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_STATUS_LABELS,
} from "@/types/database";
import {
  Building2,
  Calendar,
  DollarSign,
  ScrollText,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

interface TournamentDetailProps {
  tournamentId: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  open: "bg-green-500",
  in_progress: "bg-yellow-500",
  finished: "bg-blue-500",
  cancelled: "bg-red-500",
};

export function TournamentDetail({ tournamentId }: TournamentDetailProps) {
  const { data: tournament, isLoading, error } = useTournament(tournamentId);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <PadelBallLoader size="lg" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Torneo no encontrado</h2>
        <p className="text-sm text-muted-foreground">
          El torneo que buscás no existe o no tenés acceso
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isRegistrationOpen =
    tournament.status === "open" &&
    (!tournament.registration_deadline ||
      new Date(tournament.registration_deadline) > new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge
            className={`${STATUS_COLORS[tournament.status]} text-white`}
          >
            {TOURNAMENT_STATUS_LABELS[tournament.status]}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        {tournament.club_name && (
          <Link
            href={`/clubs/${tournament.club_slug}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground mt-1"
          >
            <Building2 className="h-4 w-4" />
            {tournament.club_name}
          </Link>
        )}
      </div>

      {/* Description */}
      {tournament.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {tournament.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Fecha</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(tournament.start_date)}
                {tournament.end_date &&
                  tournament.end_date !== tournament.start_date && (
                    <> al {formatDate(tournament.end_date)}</>
                  )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Formato</p>
              <p className="text-sm text-muted-foreground">
                {TOURNAMENT_FORMAT_LABELS[tournament.format]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Inscriptos</p>
              <p className="text-sm text-muted-foreground">
                {tournament.registration_count} equipos
              </p>
            </div>
          </div>

          {tournament.entry_fee && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Inscripción</p>
                <p className="text-sm text-muted-foreground">
                  ${tournament.entry_fee}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {tournament.category_label && (
          <Badge variant="outline">{tournament.category_label}</Badge>
        )}
        {tournament.gender && (
          <Badge variant="outline">{tournament.gender}</Badge>
        )}
      </div>

      {/* Rules */}
      {tournament.rules && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-4 w-4" />
              Reglamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {tournament.rules}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Prize */}
      {tournament.prize_pool && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              Premios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {tournament.prize_pool}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {isRegistrationOpen && (
        <Button className="w-full" size="lg">
          <Users className="mr-2 h-4 w-4" />
          Inscribirse
        </Button>
      )}
    </div>
  );
}

