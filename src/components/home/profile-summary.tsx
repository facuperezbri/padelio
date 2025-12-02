"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EloBadge } from "@/components/ui/elo-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { useProfile } from "@/lib/react-query/hooks";
import type { PlayerCategory } from "@/types/database";

export function ProfileSummary() {
  const { data: profileData, isLoading } = useProfile();

  // Only show skeleton if we don't have data yet (first load)
  if (isLoading && !profileData) {
    return (
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profile = profileData?.profile;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <PlayerAvatar
            name={
              profile?.full_name || profile?.username || "Usuario"
            }
            avatarUrl={profile?.avatar_url}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {profile?.full_name || profile?.username || "Usuario"}
            </h2>
            <p className="text-sm text-muted-foreground">
              @{profile?.username || "sin_username"}
            </p>
            <div className="mt-2">
              <EloBadge
                elo={profile?.elo_score || 1400}
                category={(profile?.category_label as PlayerCategory) || undefined}
                size="lg"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
