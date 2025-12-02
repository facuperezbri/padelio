"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { useClubInvitations } from "@/lib/react-query/hooks/use-club-invitations";
import { CLUB_ROLE_LABELS, type ClubRole } from "@/types/database";
import {
  CheckCircle,
  Clock,
  Mail,
  UserPlus,
  XCircle,
} from "lucide-react";
// Simple date formatting function (can be replaced with date-fns if needed)
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "hace unos segundos";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `hace ${days} día${days > 1 ? "s" : ""}`;
}

interface InvitationsHistoryProps {
  clubId: string;
}

const STATUS_COLORS = {
  pending: "bg-yellow-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-gray-500",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const STATUS_ICONS = {
  pending: Clock,
  accepted: CheckCircle,
  rejected: XCircle,
  expired: XCircle,
};

export function InvitationsHistory({ clubId }: InvitationsHistoryProps) {
  const { data: invitations, isLoading } = useClubInvitations(clubId);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <PadelBallLoader size="lg" />
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <UserPlus className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No hay invitaciones enviadas</p>
        </CardContent>
      </Card>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");
  const otherInvitations = invitations.filter((inv) => inv.status !== "pending");

  return (
    <div className="space-y-6">
      {pendingInvitations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Invitaciones Pendientes
          </h3>
          {pendingInvitations.map((invitation) => (
            <InvitationCard key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}

      {otherInvitations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Historial
          </h3>
          {otherInvitations.map((invitation) => (
            <InvitationCard key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationCard({ invitation }: { invitation: any }) {
  const StatusIcon = STATUS_ICONS[invitation.status as keyof typeof STATUS_ICONS];
  const isExpired =
    invitation.status === "pending" &&
    new Date(invitation.expires_at) < new Date();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{invitation.email}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className={`${STATUS_COLORS[invitation.status as keyof typeof STATUS_COLORS]} text-white`}
              >
                <StatusIcon className="mr-1 h-3 w-3" />
                {STATUS_LABELS[invitation.status as keyof typeof STATUS_LABELS]}
              </Badge>

              <Badge variant="outline">
                {CLUB_ROLE_LABELS[invitation.role as ClubRole]}
              </Badge>

              {invitation.status === "pending" && (
                <span className="text-xs">
                  {isExpired
                    ? "Expirada"
                    : `Expira ${formatDistanceToNow(new Date(invitation.expires_at))}`}
                </span>
              )}

              {invitation.responded_at && (
                <span className="text-xs">
                  Respondida {formatDistanceToNow(new Date(invitation.responded_at))}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Invitado por {invitation.invited_by_name} •{" "}
              {formatDistanceToNow(new Date(invitation.created_at))}
            </p>
          </div>

          {invitation.status === "pending" && !isExpired && (
            <div className="text-right">
              <a
                href={`${typeof window !== "undefined" ? window.location.origin : ""}/invite-staff/${invitation.invite_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Ver link
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

