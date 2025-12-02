-- ============================================
-- Vibo - Restore Match Update Trigger
-- ============================================
-- This migration:
-- 1. Restores the UPDATE trigger for matches (removed in migration 021)
-- 2. Recalculates ELOs chronologically when a match is edited
-- 3. Ensures partner stats, head-to-head stats, and streaks update correctly
-- ============================================

-- Grant execute permission on recalculation function (was revoked in migration 021)
GRANT EXECUTE ON FUNCTION recalculate_elos_from_date(TIMESTAMPTZ) TO authenticated;

-- ============================================
-- STEP 1: Create UPDATE trigger function
-- ============================================

CREATE OR REPLACE FUNCTION handle_match_update()
RETURNS TRIGGER AS $$
DECLARE
  v_min_date TIMESTAMPTZ;
BEGIN
  -- Only recalculate if something important changed
  IF OLD.match_date != NEW.match_date 
     OR OLD.winner_team != NEW.winner_team 
     OR OLD.score_sets != NEW.score_sets
     OR OLD.player_1_id != NEW.player_1_id
     OR OLD.player_2_id != NEW.player_2_id
     OR OLD.player_3_id != NEW.player_3_id
     OR OLD.player_4_id != NEW.player_4_id
  THEN
    -- Recalculate from the earlier of the two dates
    -- This ensures all matches from that point forward are recalculated correctly
    v_min_date := LEAST(OLD.match_date, NEW.match_date);
    PERFORM recalculate_elos_from_date(v_min_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Create UPDATE trigger
-- ============================================

DROP TRIGGER IF EXISTS on_match_updated ON matches;
CREATE TRIGGER on_match_updated
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION handle_match_update();

-- ============================================
-- STEP 3: Add comment explaining the trigger
-- ============================================

COMMENT ON FUNCTION handle_match_update IS 
'Trigger function that recalculates ELOs chronologically when a match is updated.
Recalculates from the earlier date (between OLD and NEW match_date) forward to ensure
all subsequent matches have correct ELO calculations. This also ensures partner stats,
head-to-head stats, and streaks are recalculated correctly since they depend on match data.';

