"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { WhatsAppShareDialog } from "@/components/match/whatsapp-share-dialog";
import { Share2 } from "lucide-react";
import type { Player, MatchInvitation } from "@/types/database";

type PlayerWithAvatar = Pick<
  Player,
  | "id"
  | "display_name"
  | "is_ghost"
  | "elo_score"
  | "category_label"
  | "profile_id"
> & {
  avatar_url?: string | null;
};

interface ShareButtonProps {
  matchId: string;
  matchDate: string;
  venue: string | null;
  players: PlayerWithAvatar[];
}

export function ShareButton({
  matchId,
  matchDate,
  venue,
  players,
}: ShareButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [invitations, setInvitations] = useState<MatchInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (showDialog) {
      loadInvitations();
    }
  }, [showDialog, matchId]);

  async function loadInvitations() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("match_invitations")
        .select("*")
        .eq("match_id", matchId);

      if (data) {
        setInvitations(data);
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDialog(true)}
        title="Compartir partido"
      >
        <Share2 className="h-5 w-5" />
      </Button>
      <WhatsAppShareDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        matchId={matchId}
        players={players}
        invitations={invitations}
        matchDate={matchDate}
        venue={venue || ""}
        onComplete={() => setShowDialog(false)}
        redirectOnClose={false}
      />
    </>
  );
}

