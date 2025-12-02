"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

interface ShareProfileButtonProps {
  playerId: string;
  playerName: string;
}

export function ShareProfileButton({
  playerId,
  playerName,
}: ShareProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const profileLink = `${baseUrl}/player/${playerId}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsAppShare() {
    const message = `¡Mirá mi perfil en Vibo! 🏓\n\n${playerName}\n\n${profileLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="touch-target"
      >
        <Share2 className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Compartir Perfil
            </DialogTitle>
            <DialogDescription>
              Compartí tu perfil con otros jugadores
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Link de tu perfil:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                  {profileLink}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copiar link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
                Copiar Link
              </Button>
              <Button
                className="flex-1 gap-2 text-green-600 hover:text-green-700"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

