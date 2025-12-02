// ============================================
// Vibo - Database Types
// ============================================

// ============================================
// ENUMS (from PostgreSQL)
// ============================================

export type PlayerCategory =
  | "8va"
  | "7ma"
  | "6ta"
  | "5ta"
  | "4ta"
  | "3ra"
  | "2da"
  | "1ra";

export type ClubRole = "owner" | "admin" | "staff" | "member";

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

export type UserType = "player" | "club";

// ============================================
// CONSTANTS
// ============================================

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

export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  staff: "Staff",
  member: "Miembro",
};

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Borrador",
  open: "Inscripciones Abiertas",
  in_progress: "En Curso",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "Eliminación Simple",
  double_elimination: "Eliminación Doble",
  round_robin: "Todos contra Todos",
  groups_knockout: "Fase de Grupos + Eliminatorias",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  waitlist: "Lista de Espera",
  cancelled: "Cancelada",
};

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

// ============================================
// MATCH CONFIG TYPES
// ============================================

export interface MatchConfig {
  goldenPoint: boolean;
  superTiebreak: boolean;
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  goldenPoint: true,
  superTiebreak: false,
};

// ============================================
// TABLE TYPES
// ============================================

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  elo_score: number;
  category_label: PlayerCategory;
  matches_played: number;
  matches_won: number;
  email: string | null;
  phone: string | null;
  country: string | null;
  province: string | null;
  gender: string | null;
  playing_side: string | null;
  user_type?: UserType; // Optional for backward compatibility
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  profile_id: string | null;
  created_by_user_id: string | null;
  display_name: string;
  is_ghost: boolean;
  elo_score: number;
  category_label: PlayerCategory;
  matches_played: number;
  matches_won: number;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
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
  notes: string | null;
  club_id: string | null;
  tournament_id: string | null;
  tournament_round: string | null;
  tournament_match_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface Club {
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
}

export interface ClubMembership {
  id: string;
  club_id: string;
  profile_id: string;
  role: ClubRole;
  nickname: string | null;
  jersey_number: number | null;
  is_active: boolean;
  joined_at: string;
}

export interface Tournament {
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
}

export interface TournamentRegistration {
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
}

export interface ClubStaffInvitation {
  id: string;
  club_id: string;
  email: string;
  role: ClubRole;
  invited_by: string;
  invite_token: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  profile_id: string | null;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
}

export interface MatchInvitation {
  id: string;
  match_id: string;
  invited_player_id: string;
  invited_profile_id: string | null;
  status: "pending" | "accepted" | "rejected";
  responded_at: string | null;
  created_at: string;
}

// ============================================
// INSERT/UPDATE TYPES
// ============================================

export interface TournamentInsert {
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
}

export interface TournamentUpdate {
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
}

// ============================================
// VIEW TYPES
// ============================================

export interface GlobalRanking {
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
}

export interface ClubSummary extends Club {
  member_count: number;
  tournament_count: number;
}

export interface TournamentSummary extends Tournament {
  club_name: string | null;
  club_slug: string | null;
  registration_count: number;
}

// ============================================
// COMPOSITE/HELPER TYPES
// ============================================

export interface SetScore {
  team1: number;
  team2: number;
  isTiebreak?: boolean;
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
  status: "pending" | "accepted" | "rejected";
  match_date: string | null;
  venue: string | null;
  created_by_name: string;
  player_names: string[];
}

export interface TournamentRegistrationWithPlayers
  extends TournamentRegistration {
  player_1: Player;
  player_2: Player;
}

export interface ClubMemberWithProfile extends ClubMembership {
  profile: Profile;
}

// ============================================
// STATS TYPES (from database functions)
// ============================================

export interface HeadToHeadStats {
  total_matches: number;
  player_a_wins: number;
  player_b_wins: number;
  last_match_date: string | null;
  first_match_date: string | null;
  current_streak: number;
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

// ============================================
// SUPABASE DATABASE TYPE
// ============================================
// This is a placeholder type for Supabase client typing
// In production, you would generate this using: npx supabase gen types typescript
export type Database = Record<string, any>;
