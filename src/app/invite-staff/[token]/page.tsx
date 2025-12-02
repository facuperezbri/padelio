"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PadelBallLoader } from "@/components/ui/padel-ball-loader";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  CheckCircle,
  Loader2,
  LogIn,
  UserPlus,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface InviteStaffPageProps {
  params: Promise<{ token: string }>;
}

export default function InviteStaffPage({ params }: InviteStaffPageProps) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<"accepted" | "rejected" | null>(
    null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadInvitation() {
    setLoading(true);
    setError(null);

    try {
      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setUserId(user?.id || null);

      // Get invitation details using the RPC function
      const { data, error: rpcError } = await supabase.rpc(
        "get_club_staff_invitation_by_token",
        { p_token: token }
      );

      if (rpcError) {
        setError("Error al cargar la invitación");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("Invitación no encontrada o expirada");
        setLoading(false);
        return;
      }

      setInvitation(data[0]);
    } catch {
      setError("Error al cargar la invitación");
    }

    setLoading(false);
  }

  async function handleResponse(responseType: "accepted" | "rejected") {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      router.push(`/login?next=/invite-staff/${token}`);
      return;
    }

    setResponding(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "accept_club_staff_invitation",
        {
          p_token: token,
          p_user_id: userId,
        }
      );

      if (rpcError || !data?.success) {
        setError(data?.error || "Error al responder");
        setResponding(false);
        return;
      }

      setResponse(responseType);

      // Send push notification if accepted
      if (responseType === "accepted" && userId) {
        try {
          await fetch("/api/send-push-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              title: "Invitación Aceptada",
              body: `Ahora sos miembro de ${invitation.club_name}`,
              url: `/clubs/${invitation.club_id}`,
              data: {
                type: "club_staff_invitation_accepted",
                club_id: invitation.club_id,
              },
            }),
          });
        } catch (pushError) {
          console.error("Error sending push notification:", pushError);
          // Don't fail if push notification fails
        }
      }

      // Redirect to club page after a delay
      setTimeout(() => {
        if (invitation?.club_id) {
          router.push(`/clubs/${invitation.club_id}`);
        } else {
          router.push("/");
        }
      }, 2000);
    } catch {
      setError("Error al responder");
    }

    setResponding(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <PadelBallLoader size="lg" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <XCircle className="mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold">
              {error || "Invitación no encontrada"}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              El link puede haber expirado o ya fue utilizado.
            </p>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Ir a Vibo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already responded
  if (invitation.status !== "pending") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
            <h2 className="mb-2 text-xl font-semibold">
              {invitation.status === "accepted"
                ? "Invitación Aceptada"
                : invitation.status === "rejected"
                ? "Invitación Rechazada"
                : "Invitación Expirada"}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {invitation.status === "accepted"
                ? "Ya sos miembro del club."
                : invitation.status === "rejected"
                ? "Esta invitación fue rechazada."
                : "Esta invitación ha expirado."}
            </p>
            <Button asChild>
              <Link href="/">
                <Building2 className="mr-2 h-4 w-4" />
                Ir al inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if expired
  const isExpired = new Date(invitation.expires_at) < new Date();
  if (isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <XCircle className="mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold">Invitación Expirada</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Esta invitación ha expirado. Contactá al club para una nueva
              invitación.
            </p>
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Ir a Vibo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Invitación al Club</CardTitle>
          <CardDescription>
            Te invitaron a formar parte del staff de un club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response === "accepted" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ¡Invitación aceptada! Redirigiendo...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Club</h3>
              <p className="text-muted-foreground">{invitation.club_name}</p>
            </div>

            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">{invitation.email}</p>
            </div>

            <div>
              <h3 className="font-semibold">Rol</h3>
              <p className="text-muted-foreground capitalize">
                {invitation.role === "owner"
                  ? "Propietario"
                  : invitation.role === "admin"
                  ? "Administrador"
                  : "Miembro"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Invitado por</h3>
              <p className="text-muted-foreground">
                {invitation.invited_by_name}
              </p>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="space-y-2">
              <Alert>
                <AlertDescription>
                  Necesitás iniciar sesión para aceptar esta invitación
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href={`/login?next=/invite-staff/${token}`}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleResponse("rejected")}
                disabled={responding || response !== null}
              >
                {responding && response === "rejected" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Rechazar
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleResponse("accepted")}
                disabled={responding || response !== null}
              >
                {responding && response === "accepted" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aceptando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aceptar
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

