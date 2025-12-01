// ============================================
// Shared Constants
// ============================================

// React Query cache times
export const QUERY_STALE_TIME = 2 * 60 * 1000; // 2 minutes
export const QUERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Match configuration
export const MAX_BACKDATE_DAYS = 30;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const RANKING_LIMIT = 100;

// K-Factor for ELO calculation (matches frontend display)
export const ELO_K_FACTOR_NEW_PLAYER = 64; // First 10 matches
export const ELO_K_FACTOR_ESTABLISHED = 32; // After 10 matches
export const NEW_PLAYER_THRESHOLD = 10; // Matches to be considered "established"

// Minimum ELO score
export const MIN_ELO_SCORE = 100;
