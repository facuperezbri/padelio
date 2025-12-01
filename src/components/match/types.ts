import type { Player, PlayerCategory } from "@/types/database";

// Selected player type used in match creation
export type SelectedPlayer = Pick<
  Player,
  | "id"
  | "display_name"
  | "is_ghost"
  | "elo_score"
  | "category_label"
  | "profile_id"
  | "matches_played"
> & {
  avatar_url?: string | null;
};

// Type for player with joined profiles data from Supabase
export type PlayerWithProfiles = SelectedPlayer & {
  profiles?:
    | { avatar_url: string | null }
    | { avatar_url: string | null }[]
    | null;
};

// Player position in team selection
export type PlayerPosition = "team1-2" | "team2-1" | "team2-2";

// Ghost player form data
export interface GhostPlayerFormData {
  name: string;
  category: PlayerCategory;
}

// Ghost player form errors
export interface GhostPlayerFormErrors {
  name?: string;
  category?: string;
}

// Helper to extract avatar_url from joined profiles data
export function extractAvatarUrl(player: PlayerWithProfiles): string | null {
  if (!player.profiles) return null;
  if (Array.isArray(player.profiles)) {
    return player.profiles[0]?.avatar_url ?? null;
  }
  return player.profiles.avatar_url ?? null;
}

// Helper to convert player with profiles to SelectedPlayer
export function toSelectedPlayer(player: PlayerWithProfiles): SelectedPlayer {
  const { profiles, ...rest } = player;
  return {
    ...rest,
    avatar_url: player.is_ghost ? null : extractAvatarUrl(player),
  };
}

