"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { useClubs } from "@/lib/react-query/hooks/use-clubs";
import { Building2, MapPin, Plus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ClubsList() {
  const { data: clubs, isLoading, error } = useClubs();

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
        <p className="text-destructive">Error al cargar los clubes</p>
      </div>
    );
  }

  if (!clubs || clubs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Sin clubes aún</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Sé el primero en crear un club
        </p>
        <Button asChild>
          <Link href="/clubs/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear Club
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Clubes Disponibles</h2>
        <Button size="sm" asChild>
          <Link href="/clubs/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {clubs.map((club) => (
          <Link key={club.id} href={`/clubs/${club.slug}`}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                {club.logo_url ? (
                  <Image
                    src={club.logo_url}
                    alt={club.name}
                    width={56}
                    height={56}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{club.name}</h3>
                  {(club.city || club.province) && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[club.city, club.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {club.member_count} miembros
                    </span>
                    {club.tournament_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {club.tournament_count} torneos
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

