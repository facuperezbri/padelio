"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { useClub } from "@/lib/react-query/hooks/use-clubs";
import {
  Building2,
  Calendar,
  ExternalLink,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import Image from "next/image";

interface ClubDetailProps {
  slug: string;
}

export function ClubDetail({ slug }: ClubDetailProps) {
  const { data: club, isLoading, error } = useClub(slug);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <PadelBallLoader size="lg" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Club no encontrado</h2>
        <p className="text-sm text-muted-foreground">
          El club que buscás no existe o no tenés acceso
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {club.logo_url ? (
          <Image
            src={club.logo_url}
            alt={club.name}
            width={80}
            height={80}
            className="rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{club.name}</h1>
          {(club.city || club.province) && (
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[club.city, club.province].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {club.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{club.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Users className="mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{club.member_count}</p>
            <p className="text-xs text-muted-foreground">Miembros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Calendar className="mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{club.tournament_count}</p>
            <p className="text-xs text-muted-foreground">Torneos</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      {(club.phone || club.email || club.website || club.instagram) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {club.phone && (
              <a
                href={`tel:${club.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                {club.phone}
              </a>
            )}
            {club.email && (
              <a
                href={`mailto:${club.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                {club.email}
              </a>
            )}
            {club.website && (
              <a
                href={club.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Sitio web
              </a>
            )}
            {club.instagram && (
              <a
                href={`https://instagram.com/${club.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
                {club.instagram}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full" variant="secondary">
          <Users className="mr-2 h-4 w-4" />
          Unirse al Club
        </Button>
      </div>
    </div>
  );
}

