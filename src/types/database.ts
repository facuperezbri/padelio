export type PlayerCategory =
  | "8va"
  | "7ma"
  | "6ta"
  | "5ta"
  | "4ta"
  | "3ra"
  | "2da"
  | "1ra";

export type ClubRole = "owner" | "admin" | "member";

export type TournamentStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "finished"
  | "cancelled";

export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "round_robin"
  | "groups_knockout";

export type RegistrationStatus =
  | "pending"
  | "confirmed"
  | "waitlist"
  | "cancelled";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          elo_score: number;
          initial_elo: number | null;
          category_label: PlayerCategory;
          matches_played: number;
          matches_won: number;
          country: string | null;
          province: string | null;
          phone: string | null;
          email: string | null;
          gender: string | null;
          playing_side: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          elo_score?: number;
          initial_elo?: number | null;
          category_label?: PlayerCategory;
          matches_played?: number;
          matches_won?: number;
          country?: string | null;
          province?: string | null;
          phone?: string | null;
          email?: string | null;
          gender?: string | null;
          playing_side?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          elo_score?: number;
          initial_elo?: number | null;
          category_label?: PlayerCategory;
          matches_played?: number;
          matches_won?: number;
          country?: string | null;
          province?: string | null;
          phone?: string | null;
          email?: string | null;
          gender?: string | null;
          playing_side?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          profile_id: string | null;
          created_by_user_id: string | null;
          claimed_by_profile_id: string | null;
          display_name: string;
          is_ghost: boolean;
          elo_score: number;
          initial_elo: number | null;
          category_label: PlayerCategory;
          matches_played: number;
          matches_won: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          created_by_user_id?: string | null;
          claimed_by_profile_id?: string | null;
          display_name: string;
          is_ghost?: boolean;
          elo_score?: number;
          initial_elo?: number | null;
          category_label?: PlayerCategory;
          matches_played?: number;
          matches_won?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          created_by_user_id?: string | null;
          claimed_by_profile_id?: string | null;
          display_name?: string;
          is_ghost?: boolean;
          elo_score?: number;
          initial_elo?: number | null;
          category_label?: PlayerCategory;
          matches_played?: number;
          matches_won?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          created_by: string;
          match_date: string;
          venue: string | null;
          player_1_id: string;
          player_2_id: string;
          player_3_id: string;
          player_4_id: string;
          score_sets: SetScore[];
          winner_team: 1 | 2;
          elo_changes: EloChanges | null;
          match_config: MatchConfig;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          match_date?: string;
          venue?: string | null;
          player_1_id: string;
          player_2_id: string;
          player_3_id: string;
          player_4_id: string;
          score_sets: SetScore[];
          winner_team: 1 | 2;
          elo_changes?: EloChanges | null;
          match_config?: MatchConfig;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          match_date?: string;
          venue?: string | null;
          player_1_id?: string;
          player_2_id?: string;
          player_3_id?: string;
          player_4_id?: string;
          score_sets?: SetScore[];
          winner_team?: 1 | 2;
          elo_changes?: EloChanges | null;
          match_config?: MatchConfig;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      match_invitations: {
        Row: {
          id: string;
          match_id: string;
          invited_player_id: string;
          invited_profile_id: string | null;
          status: "pending" | "accepted" | "rejected";
          invite_token: string;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          invited_player_id: string;
          invited_profile_id?: string | null;
          status?: "pending" | "accepted" | "rejected";
          invite_token?: string;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          invited_player_id?: string;
          invited_profile_id?: string | null;
          status?: "pending" | "accepted" | "rejected";
          invite_token?: string;
          responded_at?: string | null;
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "match_invite" | "match_confirmed" | "elo_change";
          title: string;
          body: string;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "match_invite" | "match_confirmed" | "elo_change";
          title: string;
          body: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "match_invite" | "match_confirmed" | "elo_change";
          title?: string;
          body?: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          address: string | null;
          city: string | null;
          province: string | null;
          country: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          instagram: string | null;
          is_public: boolean;
          requires_approval: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          country?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          instagram?: string | null;
          is_public?: boolean;
          requires_approval?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          country?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          instagram?: string | null;
          is_public?: boolean;
          requires_approval?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      club_memberships: {
        Row: {
          id: string;
          club_id: string;
          profile_id: string;
          role: ClubRole;
          nickname: string | null;
          jersey_number: number | null;
          is_active: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          profile_id: string;
          role?: ClubRole;
          nickname?: string | null;
          jersey_number?: number | null;
          is_active?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          profile_id?: string;
          role?: ClubRole;
          nickname?: string | null;
          jersey_number?: number | null;
          is_active?: boolean;
          joined_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          club_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          rules: string | null;
          start_date: string;
          end_date: string | null;
          registration_deadline: string | null;
          format: TournamentFormat;
          max_teams: number | null;
          min_teams: number;
          category_label: PlayerCategory | null;
          gender: "Masculino" | "Femenino" | "Mixto" | null;
          entry_fee: number | null;
          prize_pool: string | null;
          status: TournamentStatus;
          banner_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          rules?: string | null;
          start_date: string;
          end_date?: string | null;
          registration_deadline?: string | null;
          format?: TournamentFormat;
          max_teams?: number | null;
          min_teams?: number;
          category_label?: PlayerCategory | null;
          gender?: "Masculino" | "Femenino" | "Mixto" | null;
          entry_fee?: number | null;
          prize_pool?: string | null;
          status?: TournamentStatus;
          banner_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          rules?: string | null;
          start_date?: string;
          end_date?: string | null;
          registration_deadline?: string | null;
          format?: TournamentFormat;
          max_teams?: number | null;
          min_teams?: number;
          category_label?: PlayerCategory | null;
          gender?: "Masculino" | "Femenino" | "Mixto" | null;
          entry_fee?: number | null;
          prize_pool?: string | null;
          status?: TournamentStatus;
          banner_url?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tournament_registrations: {
        Row: {
          id: string;
          tournament_id: string;
          player_1_id: string;
          player_2_id: string;
          team_name: string | null;
          seed: number | null;
          status: RegistrationStatus;
          paid: boolean;
          paid_at: string | null;
          registered_by: string;
          registered_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          player_1_id: string;
          player_2_id: string;
          team_name?: string | null;
          seed?: number | null;
          status?: RegistrationStatus;
          paid?: boolean;
          paid_at?: string | null;
          registered_by: string;
          registered_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          player_1_id?: string;
          player_2_id?: string;
          team_name?: string | null;
          seed?: number | null;
          status?: RegistrationStatus;
          paid?: boolean;
          paid_at?: string | null;
          registered_by?: string;
          registered_at?: string;
        };
      };
    };
    Views: {
      global_ranking: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          elo_score: number;
          category_label: PlayerCategory;
          matches_played: number;
          matches_won: number;
          gender: string | null;
          win_rate: number;
          rank: number;
        };
      };
      player_stats: {
        Row: {
          id: string;
          display_name: string;
          is_ghost: boolean;
          profile_id: string | null;
          created_by_user_id: string | null;
          elo_score: number;
          category_label: PlayerCategory;
          matches_played: number;
          matches_won: number;
          win_rate: number;
        };
      };
      club_summary: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          city: string | null;
          province: string | null;
          country: string;
          is_public: boolean;
          member_count: number;
          tournament_count: number;
          created_at: string;
        };
      };
      tournament_summary: {
        Row: {
          id: string;
          club_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          start_date: string;
          end_date: string | null;
          format: TournamentFormat;
          category_label: PlayerCategory | null;
          gender: "Masculino" | "Femenino" | "Mixto" | null;
          status: TournamentStatus;
          banner_url: string | null;
          club_name: string | null;
          club_slug: string | null;
          registration_count: number;
        };
      };
    };
    Functions: {
      get_initial_elo: {
        Args: { category: PlayerCategory };
        Returns: number;
      };
      get_category_from_elo: {
        Args: { elo: number };
        Returns: PlayerCategory;
      };
      calculate_new_elo: {
        Args: {
          current_elo: number;
          opponent_avg_elo: number;
          won: boolean;
          total_matches_played: number;
        };
        Returns: number;
      };
      update_match_elos: {
        Args: { match_id: string };
        Returns: EloChanges;
      };
      get_invitation_by_token: {
        Args: { token: string };
        Returns: InvitationDetails[];
      };
      respond_to_invitation: {
        Args: {
          p_token: string;
          p_response: string;
          p_user_id?: string;
        };
        Returns: Json;
      };
      get_player_partner_stats: {
        Args: { target_player_id: string };
        Returns: PartnerStats[];
      };
      get_head_to_head_stats: {
        Args: {
          player_a_id: string;
          player_b_id: string;
        };
        Returns: HeadToHeadStats;
      };
      link_ghost_player_to_user: {
        Args: {
          p_ghost_player_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      recalculate_all_elos: {
        Args: Record<string, never>;
        Returns: Json;
      };
      recalculate_elos_from_date: {
        Args: {
          p_from_date: string;
        };
        Returns: Json;
      };
      create_club_with_owner: {
        Args: {
          p_name: string;
          p_slug: string;
          p_description?: string;
          p_city?: string;
          p_province?: string;
          p_is_public?: boolean;
        };
        Returns: string;
      };
    };
    Enums: {
      player_category: PlayerCategory;
      club_role: ClubRole;
      tournament_status: TournamentStatus;
      tournament_format: TournamentFormat;
      registration_status: RegistrationStatus;
    };
  };
}

// Custom types for JSON fields
export interface SetScore {
  team1: number;
  team2: number;
  // For super tie-break (third set only)
  isTiebreak?: boolean;
}

export interface MatchConfig {
  goldenPoint: boolean;
  superTiebreak: boolean;
}

export interface EloChange {
  before: number;
  after: number;
  change: number;
}

export interface EloChanges {
  player_1: EloChange;
  player_2: EloChange;
  player_3: EloChange;
  player_4: EloChange;
}

export interface InvitationDetails {
  id: string;
  match_id: string;
  invited_player_id: string;
  invited_profile_id: string | null;
  status: string;
  invite_token: string;
  match_date: string;
  venue: string | null;
  created_by_name: string;
  player_names: string[];
}

export interface PartnerStats {
  partner_id: string;
  partner_name: string;
  partner_avatar_url: string | null;
  total_matches: number;
  won_matches: number;
  lost_matches: number;
  win_rate: number;
  last_match_date: string | null;
  current_streak: number;
}

export interface HeadToHeadStats {
  total_matches: number;
  player_a_wins: number;
  player_b_wins: number;
  last_match_date: string | null;
  first_match_date: string | null;
  current_streak: number; // Positive = Player A winning streak, Negative = Player B winning streak
  error?: string;
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Player = Database["public"]["Tables"]["players"]["Row"];
export type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
export type PlayerUpdate = Database["public"]["Tables"]["players"]["Update"];

export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
export type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

export type MatchInvitation =
  Database["public"]["Tables"]["match_invitations"]["Row"];
export type MatchInvitationInsert =
  Database["public"]["Tables"]["match_invitations"]["Insert"];

export type PushSubscription =
  Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type PushSubscriptionInsert =
  Database["public"]["Tables"]["push_subscriptions"]["Insert"];

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

export type GlobalRanking =
  Database["public"]["Views"]["global_ranking"]["Row"];
export type PlayerStats = Database["public"]["Views"]["player_stats"]["Row"];

// Club types
export type Club = Database["public"]["Tables"]["clubs"]["Row"];
export type ClubInsert = Database["public"]["Tables"]["clubs"]["Insert"];
export type ClubUpdate = Database["public"]["Tables"]["clubs"]["Update"];

export type ClubMembership =
  Database["public"]["Tables"]["club_memberships"]["Row"];
export type ClubMembershipInsert =
  Database["public"]["Tables"]["club_memberships"]["Insert"];
export type ClubMembershipUpdate =
  Database["public"]["Tables"]["club_memberships"]["Update"];

export type ClubSummary = Database["public"]["Views"]["club_summary"]["Row"];

// Tournament types
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentInsert =
  Database["public"]["Tables"]["tournaments"]["Insert"];
export type TournamentUpdate =
  Database["public"]["Tables"]["tournaments"]["Update"];

export type TournamentRegistration =
  Database["public"]["Tables"]["tournament_registrations"]["Row"];
export type TournamentRegistrationInsert =
  Database["public"]["Tables"]["tournament_registrations"]["Insert"];
export type TournamentRegistrationUpdate =
  Database["public"]["Tables"]["tournament_registrations"]["Update"];

export type TournamentSummary =
  Database["public"]["Views"]["tournament_summary"]["Row"];

// Match with player details (for display)
export interface MatchWithPlayers extends Match {
  player_1: Player;
  player_2: Player;
  player_3: Player;
  player_4: Player;
}

// Category to ELO mapping
export const CATEGORY_ELO_MAP: Record<PlayerCategory, number> = {
  "8va": 1000,
  "7ma": 1200,
  "6ta": 1400,
  "5ta": 1600,
  "4ta": 1800,
  "3ra": 2000,
  "2da": 2200,
  "1ra": 2400,
};

export const CATEGORY_LABELS: Record<PlayerCategory, string> = {
  "8va": "8va Categoría",
  "7ma": "7ma Categoría",
  "6ta": "6ta Categoría",
  "5ta": "5ta Categoría",
  "4ta": "4ta Categoría",
  "3ra": "3ra Categoría",
  "2da": "2da Categoría",
  "1ra": "1ra Categoría",
};

export const CATEGORIES: PlayerCategory[] = [
  "8va",
  "7ma",
  "6ta",
  "5ta",
  "4ta",
  "3ra",
  "2da",
  "1ra",
];

// Default match config
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  goldenPoint: true,
  superTiebreak: false,
};

// Tournament status labels
export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Borrador",
  open: "Inscripciones Abiertas",
  in_progress: "En Curso",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

// Tournament format labels
export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "Eliminación Simple",
  double_elimination: "Eliminación Doble",
  round_robin: "Todos contra Todos",
  groups_knockout: "Grupos + Eliminatorias",
};

// Club role labels
export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  member: "Miembro",
};

// Registration status labels
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  waitlist: "Lista de Espera",
  cancelled: "Cancelada",
};
