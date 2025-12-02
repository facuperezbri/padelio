-- ============================================
-- Vibo - Remove Match Update ELO Trigger
-- ============================================
-- This migration removes the automatic ELO recalculation on match edit
-- because it has bugs that cause incorrect calculations.
-- 
-- Matches can still be edited, but ELO won't be recalculated automatically.
-- Admin can run recalculate_all_elos() manually from Supabase dashboard if needed.
-- ============================================

-- Drop the UPDATE trigger
DROP TRIGGER IF EXISTS on_match_updated ON matches;
DROP FUNCTION IF EXISTS handle_match_update();

-- Revoke public access to incremental recalculation (buggy function)
REVOKE EXECUTE ON FUNCTION recalculate_elos_from_date(TIMESTAMPTZ) FROM authenticated;

-- Keep recalculate_all_elos for admin use (full recalculation is safe)
-- It's already restricted, but let's add a clear comment
COMMENT ON FUNCTION recalculate_all_elos IS 
'ADMIN ONLY - Recalculates ALL player ELOs from scratch in chronological order.
Run this manually from Supabase SQL Editor when data integrity is questionable.
This is the safe recalculation method that processes ALL matches.';

COMMENT ON FUNCTION recalculate_elos_from_date IS 
'DEPRECATED - DO NOT USE. This function has bugs with partial recalculation.
Use recalculate_all_elos() instead for any ELO corrections.';

