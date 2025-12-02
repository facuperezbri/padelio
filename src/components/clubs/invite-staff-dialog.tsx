"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLUB_ROLE_LABELS, type ClubRole } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { clubStaffKeys } from "@/lib/react-query/hooks/use-club-staff";
import { clubInvitationsKeys } from "@/lib/react-query/hooks/use-club-invitations";
import { useMyClubAsOwner } from "@/lib/react-query/hooks/use-clubs";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

interface InviteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
}

export function InviteStaffDialog({
  open,
  onOpenChange,
  clubId,
}: InviteStaffDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClubRole>("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { data: club } = useMyClubAsOwner(userId);

  useEffect(() => {
    async function getUserId() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUserId();
  }, [supabase]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!clubId) {
        setError("ID del club no válido");
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Por favor ingresá un email válido");
        setLoading(false);
        return;
      }

      // Call the RPC function to invite staff
      const { data, error: inviteError } = await supabase.rpc(
        "invite_club_staff",
        {
          p_club_id: clubId,
          p_email: email.toLowerCase().trim(),
          p_role: role,
        }
      );

      if (inviteError) {
        // Parse error message from JSONB response if available
        if (inviteError.message) {
          setError(inviteError.message);
        } else {
          setError("Error al enviar la invitación");
        }
        setLoading(false);
        return;
      }

      if (!data?.success) {
        setError(data?.error || "Error al enviar la invitación");
        setLoading(false);
        return;
      }

      // Store token for email sending
      setInvitationToken(data.token);

      // Send email invitation
      try {
        const invitationUrl = `${window.location.origin}/invite-staff/${data.token}`;
        const clubName = club?.name || "el club";
        
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email.toLowerCase().trim(),
            subject: `Invitación a ${clubName} en Vibo`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">¡Te invitaron a ${clubName}!</h2>
                <p>Te invitaron a formar parte del staff de <strong>${clubName}</strong> en Vibo con el rol de <strong>${CLUB_ROLE_LABELS[role]}</strong>.</p>
                <p>Hacé clic en el siguiente botón para aceptar la invitación:</p>
                <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Aceptar Invitación</a>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">O copiá y pegá este link en tu navegador:</p>
                <p style="color: #666; font-size: 12px; word-break: break-all;">${invitationUrl}</p>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">Esta invitación expira en 30 días.</p>
              </div>
            `,
            text: `Te invitaron a ${clubName} en Vibo con el rol de ${CLUB_ROLE_LABELS[role]}. Aceptá la invitación aquí: ${invitationUrl}`,
          }),
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the invitation if email fails
      }

      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: clubStaffKeys.byClub(clubId) });
      queryClient.invalidateQueries({ 
        queryKey: clubInvitationsKeys.byClub(clubId) 
      });

      // Reset form
      setEmail("");
      setRole("member");
      setSuccess(true);

      // Close dialog after a moment
      setTimeout(() => {
        setSuccess(false);
        setInvitationToken(null);
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al enviar la invitación");
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setEmail("");
      setRole("member");
      setError(null);
      setSuccess(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitar Staff
          </DialogTitle>
          <DialogDescription>
            Enviá una invitación por email para agregar miembros al club
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p>Invitación enviada exitosamente</p>
                  {invitationToken && (
                    <p className="text-xs break-all">
                      Link de invitación:{" "}
                      <span className="font-mono">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/invite-staff/${invitationToken}`
                          : invitationToken}
                      </span>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="staff@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Si el usuario ya tiene cuenta en Vibo, se agregará directamente.
              Si no, recibirá un email para crear su cuenta.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as ClubRole)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  {CLUB_ROLE_LABELS.member}
                </SelectItem>
                <SelectItem value="admin">
                  {CLUB_ROLE_LABELS.admin}
                </SelectItem>
                <SelectItem value="owner">
                  {CLUB_ROLE_LABELS.owner}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              El rol determina los permisos del miembro en el club
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Invitación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

