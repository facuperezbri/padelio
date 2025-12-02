"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME } from "@/lib/constants";

export interface ClubInvitation {
  id: string;
  club_id: string;
  club_name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "rejected" | "expired";
  invite_token: string;
  invited_by: string;
  invited_by_name: string;
  profile_id: string | null;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
}

export const clubInvitationsKeys = {
  all: ["club-invitations"] as const,
  byClub: (clubId: string) =>
    [...clubInvitationsKeys.all, "by-club", clubId] as const,
};

async function fetchClubInvitations(
  clubId: string
): Promise<ClubInvitation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("club_staff_invitations")
    .select(
      `
      id,
      club_id,
      email,
      role,
      status,
      invite_token,
      invited_by,
      profile_id,
      created_at,
      expires_at,
      responded_at,
      club:clubs!club_staff_invitations_club_id_fkey(name),
      inviter:profiles!club_staff_invitations_invited_by_fkey(full_name, username)
    `
    )
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((inv) => ({
    id: inv.id,
    club_id: inv.club_id,
    club_name: (inv.club as any)?.name || "",
    email: inv.email,
    role: inv.role,
    status: inv.status,
    invite_token: inv.invite_token,
    invited_by: inv.invited_by,
    invited_by_name:
      (inv.inviter as any)?.full_name ||
      (inv.inviter as any)?.username ||
      "Usuario",
    profile_id: inv.profile_id,
    created_at: inv.created_at,
    expires_at: inv.expires_at,
    responded_at: inv.responded_at,
  }));
}

export function useClubInvitations(clubId: string | undefined) {
  return useQuery({
    queryKey: clubInvitationsKeys.byClub(clubId || ""),
    queryFn: () => fetchClubInvitations(clubId!),
    staleTime: QUERY_STALE_TIME,
    enabled: Boolean(clubId),
  });
}

