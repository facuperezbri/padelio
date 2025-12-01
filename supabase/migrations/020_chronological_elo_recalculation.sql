-- ============================================
-- Vibo - Chronological ELO Recalculation (Scalable)
-- ============================================
-- This migration:
-- 1. Adds initial_elo field to players and profiles
-- 2. Creates incremental recalculation (from a date forward) for scalability
-- 3. Creates full recalculation for maintenance/corrections
-- 4. Updates triggers for automatic recalculation on INSERT/UPDATE/DELETE
-- ============================================

-- ============================================
-- STEP 1: Add initial_elo columns
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS initial_elo FLOAT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS initial_elo FLOAT;

-- ============================================
-- STEP 2: Calculate TRUE initial_elo for existing players
-- by reversing all elo_changes from their matches
-- ============================================

CREATE OR REPLACE FUNCTION calculate_true_initial_elo(p_player_id UUID)
RETURNS FLOAT AS $$
DECLARE
  v_current_elo FLOAT;
  v_total_change FLOAT := 0;
  match_record RECORD;
BEGIN
  SELECT elo_score INTO v_current_elo FROM players WHERE id = p_player_id;
  
  FOR match_record IN 
    SELECT elo_changes, player_1_id, player_2_id, player_3_id, player_4_id
    FROM matches 
    WHERE player_1_id = p_player_id 
       OR player_2_id = p_player_id 
       OR player_3_id = p_player_id 
       OR player_4_id = p_player_id
  LOOP
    IF match_record.player_1_id = p_player_id THEN
      v_total_change := v_total_change + COALESCE((match_record.elo_changes->'player_1'->>'change')::FLOAT, 0);
    ELSIF match_record.player_2_id = p_player_id THEN
      v_total_change := v_total_change + COALESCE((match_record.elo_changes->'player_2'->>'change')::FLOAT, 0);
    ELSIF match_record.player_3_id = p_player_id THEN
      v_total_change := v_total_change + COALESCE((match_record.elo_changes->'player_3'->>'change')::FLOAT, 0);
    ELSIF match_record.player_4_id = p_player_id THEN
      v_total_change := v_total_change + COALESCE((match_record.elo_changes->'player_4'->>'change')::FLOAT, 0);
    END IF;
  END LOOP;
  
  RETURN GREATEST(COALESCE(v_current_elo, 1000) - v_total_change, 100);
END;
$$ LANGUAGE plpgsql;

-- Populate initial_elo for existing players
UPDATE players 
SET initial_elo = calculate_true_initial_elo(id)
WHERE initial_elo IS NULL;

UPDATE profiles pr
SET initial_elo = pl.initial_elo
FROM players pl
WHERE pr.id = pl.profile_id AND pr.initial_elo IS NULL;

-- Keep the function for future use but mark it
COMMENT ON FUNCTION calculate_true_initial_elo IS 'Calculates true initial ELO by reversing all match changes. Used for data recovery.';

-- ============================================
-- STEP 3: Update handle_new_profile to save initial_elo
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_initial_elo FLOAT;
BEGIN
  v_initial_elo := COALESCE(NEW.elo_score, get_initial_elo(COALESCE(NEW.category_label, '8va')));
  
  INSERT INTO players (profile_id, display_name, is_ghost, elo_score, category_label, initial_elo)
  VALUES (
    NEW.id,
    COALESCE(NEW.full_name, NEW.username, 'Player'),
    FALSE,
    v_initial_elo,
    COALESCE(NEW.category_label, '8va'),
    v_initial_elo
  )
  ON CONFLICT (profile_id) DO NOTHING;
  
  IF NEW.initial_elo IS NULL THEN
    UPDATE profiles SET initial_elo = v_initial_elo WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating player for profile %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: Create FULL recalculation function (for maintenance)
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_all_elos()
RETURNS JSONB AS $$
DECLARE
  match_record RECORD;
  v_player1_elo FLOAT;
  v_player2_elo FLOAT;
  v_player3_elo FLOAT;
  v_player4_elo FLOAT;
  v_player1_matches INT;
  v_player2_matches INT;
  v_player3_matches INT;
  v_player4_matches INT;
  v_team1_avg FLOAT;
  v_team2_avg FLOAT;
  v_team1_won BOOLEAN;
  v_new_elo1 FLOAT;
  v_new_elo2 FLOAT;
  v_new_elo3 FLOAT;
  v_new_elo4 FLOAT;
  v_elo_changes JSONB;
  v_matches_processed INT := 0;
  v_players_reset INT := 0;
BEGIN
  -- PHASE 1: Create temp table and reset all players
  CREATE TEMP TABLE IF NOT EXISTS player_state (
    player_id UUID PRIMARY KEY,
    profile_id UUID,
    current_elo FLOAT,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0
  ) ON COMMIT DROP;
  
  TRUNCATE player_state;
  
  INSERT INTO player_state (player_id, profile_id, current_elo, matches_played, matches_won)
  SELECT 
    id,
    profile_id,
    COALESCE(initial_elo, get_initial_elo(category_label), 1000),
    0,
    0
  FROM players;
  
  GET DIAGNOSTICS v_players_reset = ROW_COUNT;
  
  -- PHASE 2: Process matches chronologically
  FOR match_record IN 
    SELECT * FROM matches ORDER BY match_date ASC, created_at ASC
  LOOP
    SELECT current_elo, matches_played INTO v_player1_elo, v_player1_matches
    FROM player_state WHERE player_id = match_record.player_1_id;
    
    SELECT current_elo, matches_played INTO v_player2_elo, v_player2_matches
    FROM player_state WHERE player_id = match_record.player_2_id;
    
    SELECT current_elo, matches_played INTO v_player3_elo, v_player3_matches
    FROM player_state WHERE player_id = match_record.player_3_id;
    
    SELECT current_elo, matches_played INTO v_player4_elo, v_player4_matches
    FROM player_state WHERE player_id = match_record.player_4_id;
    
    v_player1_elo := COALESCE(v_player1_elo, 1000);
    v_player2_elo := COALESCE(v_player2_elo, 1000);
    v_player3_elo := COALESCE(v_player3_elo, 1000);
    v_player4_elo := COALESCE(v_player4_elo, 1000);
    v_player1_matches := COALESCE(v_player1_matches, 0);
    v_player2_matches := COALESCE(v_player2_matches, 0);
    v_player3_matches := COALESCE(v_player3_matches, 0);
    v_player4_matches := COALESCE(v_player4_matches, 0);
    
    v_team1_avg := (v_player1_elo + v_player2_elo) / 2;
    v_team2_avg := (v_player3_elo + v_player4_elo) / 2;
    v_team1_won := match_record.winner_team = 1;
    
    v_new_elo1 := calculate_new_elo(v_player1_elo, v_team2_avg, v_team1_won, v_player1_matches);
    v_new_elo2 := calculate_new_elo(v_player2_elo, v_team2_avg, v_team1_won, v_player2_matches);
    v_new_elo3 := calculate_new_elo(v_player3_elo, v_team1_avg, NOT v_team1_won, v_player3_matches);
    v_new_elo4 := calculate_new_elo(v_player4_elo, v_team1_avg, NOT v_team1_won, v_player4_matches);
    
    UPDATE player_state SET 
      current_elo = v_new_elo1,
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN v_team1_won THEN 1 ELSE 0 END
    WHERE player_id = match_record.player_1_id;
    
    UPDATE player_state SET 
      current_elo = v_new_elo2,
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN v_team1_won THEN 1 ELSE 0 END
    WHERE player_id = match_record.player_2_id;
    
    UPDATE player_state SET 
      current_elo = v_new_elo3,
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END
    WHERE player_id = match_record.player_3_id;
    
    UPDATE player_state SET 
      current_elo = v_new_elo4,
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END
    WHERE player_id = match_record.player_4_id;
    
    v_elo_changes := jsonb_build_object(
      'player_1', jsonb_build_object('before', v_player1_elo, 'after', v_new_elo1, 'change', v_new_elo1 - v_player1_elo),
      'player_2', jsonb_build_object('before', v_player2_elo, 'after', v_new_elo2, 'change', v_new_elo2 - v_player2_elo),
      'player_3', jsonb_build_object('before', v_player3_elo, 'after', v_new_elo3, 'change', v_new_elo3 - v_player3_elo),
      'player_4', jsonb_build_object('before', v_player4_elo, 'after', v_new_elo4, 'change', v_new_elo4 - v_player4_elo)
    );
    
    UPDATE matches SET elo_changes = v_elo_changes WHERE id = match_record.id;
    
    v_matches_processed := v_matches_processed + 1;
  END LOOP;
  
  -- PHASE 3: Apply final states
  UPDATE players p SET
    elo_score = ps.current_elo,
    category_label = get_category_from_elo(ps.current_elo),
    matches_played = ps.matches_played,
    matches_won = ps.matches_won
  FROM player_state ps
  WHERE p.id = ps.player_id;
  
  UPDATE profiles pr SET
    elo_score = ps.current_elo,
    category_label = get_category_from_elo(ps.current_elo),
    matches_played = ps.matches_played,
    matches_won = ps.matches_won
  FROM player_state ps
  WHERE pr.id = ps.profile_id AND ps.profile_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'players_reset', v_players_reset,
    'matches_processed', v_matches_processed
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION recalculate_all_elos TO authenticated;

COMMENT ON FUNCTION recalculate_all_elos IS 
'Recalculates ALL player ELOs from scratch in chronological order.
Use for maintenance or when data integrity is questionable.';

-- ============================================
-- STEP 5: Create INCREMENTAL recalculation (from a date forward)
-- This is the scalable version - only recalculates affected matches
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_elos_from_date(p_from_date TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
  match_record RECORD;
  v_player1_elo FLOAT;
  v_player2_elo FLOAT;
  v_player3_elo FLOAT;
  v_player4_elo FLOAT;
  v_player1_matches INT;
  v_player2_matches INT;
  v_player3_matches INT;
  v_player4_matches INT;
  v_team1_avg FLOAT;
  v_team2_avg FLOAT;
  v_team1_won BOOLEAN;
  v_new_elo1 FLOAT;
  v_new_elo2 FLOAT;
  v_new_elo3 FLOAT;
  v_new_elo4 FLOAT;
  v_elo_changes JSONB;
  v_matches_processed INT := 0;
  v_affected_players UUID[];
BEGIN
  -- Collect all players affected by matches from this date forward
  SELECT ARRAY_AGG(DISTINCT player_id) INTO v_affected_players
  FROM (
    SELECT player_1_id AS player_id FROM matches WHERE match_date >= p_from_date
    UNION SELECT player_2_id FROM matches WHERE match_date >= p_from_date
    UNION SELECT player_3_id FROM matches WHERE match_date >= p_from_date
    UNION SELECT player_4_id FROM matches WHERE match_date >= p_from_date
  ) affected;
  
  -- If no matches affected, return early
  IF v_affected_players IS NULL OR array_length(v_affected_players, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'matches_processed', 0,
      'message', 'No matches to recalculate'
    );
  END IF;
  
  -- Create temp table to track player states
  CREATE TEMP TABLE IF NOT EXISTS player_state_incremental (
    player_id UUID PRIMARY KEY,
    profile_id UUID,
    current_elo FLOAT,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0
  ) ON COMMIT DROP;
  
  TRUNCATE player_state_incremental;
  
  -- Initialize affected players with their state BEFORE the from_date
  -- We need to calculate their ELO up to (but not including) p_from_date
  INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
  SELECT 
    p.id,
    p.profile_id,
    COALESCE(p.initial_elo, get_initial_elo(p.category_label), 1000),
    0,
    0
  FROM players p
  WHERE p.id = ANY(v_affected_players);
  
  -- Process all matches BEFORE from_date to build correct state
  -- (only for affected players to save time)
  FOR match_record IN 
    SELECT * FROM matches 
    WHERE match_date < p_from_date
    AND (
      player_1_id = ANY(v_affected_players) OR
      player_2_id = ANY(v_affected_players) OR
      player_3_id = ANY(v_affected_players) OR
      player_4_id = ANY(v_affected_players)
    )
    ORDER BY match_date ASC, created_at ASC
  LOOP
    -- Get current states (or initial if not in temp table)
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0) 
    INTO v_player1_elo, v_player1_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_1_id;
    
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0)
    INTO v_player2_elo, v_player2_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_2_id;
    
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0)
    INTO v_player3_elo, v_player3_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_3_id;
    
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0)
    INTO v_player4_elo, v_player4_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_4_id;
    
    v_team1_avg := (v_player1_elo + v_player2_elo) / 2;
    v_team2_avg := (v_player3_elo + v_player4_elo) / 2;
    v_team1_won := match_record.winner_team = 1;
    
    v_new_elo1 := calculate_new_elo(v_player1_elo, v_team2_avg, v_team1_won, v_player1_matches);
    v_new_elo2 := calculate_new_elo(v_player2_elo, v_team2_avg, v_team1_won, v_player2_matches);
    v_new_elo3 := calculate_new_elo(v_player3_elo, v_team1_avg, NOT v_team1_won, v_player3_matches);
    v_new_elo4 := calculate_new_elo(v_player4_elo, v_team1_avg, NOT v_team1_won, v_player4_matches);
    
    -- Upsert player states
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_1_id, profile_id, v_new_elo1, 1, CASE WHEN v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_1_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo1,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN v_team1_won THEN 1 ELSE 0 END;
    
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_2_id, profile_id, v_new_elo2, 1, CASE WHEN v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_2_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo2,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN v_team1_won THEN 1 ELSE 0 END;
    
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_3_id, profile_id, v_new_elo3, 1, CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_3_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo3,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END;
    
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_4_id, profile_id, v_new_elo4, 1, CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_4_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo4,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END;
  END LOOP;
  
  -- Now process matches FROM the date forward and update their elo_changes
  FOR match_record IN 
    SELECT * FROM matches 
    WHERE match_date >= p_from_date
    ORDER BY match_date ASC, created_at ASC
  LOOP
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0)
    INTO v_player1_elo, v_player1_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_1_id;
    
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0)
    INTO v_player2_elo, v_player2_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_2_id;
    
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0)
    INTO v_player3_elo, v_player3_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_3_id;
    
    SELECT COALESCE(psi.current_elo, p.initial_elo, 1000), COALESCE(psi.matches_played, 0)
    INTO v_player4_elo, v_player4_matches
    FROM players p
    LEFT JOIN player_state_incremental psi ON psi.player_id = p.id
    WHERE p.id = match_record.player_4_id;
    
    v_team1_avg := (v_player1_elo + v_player2_elo) / 2;
    v_team2_avg := (v_player3_elo + v_player4_elo) / 2;
    v_team1_won := match_record.winner_team = 1;
    
    v_new_elo1 := calculate_new_elo(v_player1_elo, v_team2_avg, v_team1_won, v_player1_matches);
    v_new_elo2 := calculate_new_elo(v_player2_elo, v_team2_avg, v_team1_won, v_player2_matches);
    v_new_elo3 := calculate_new_elo(v_player3_elo, v_team1_avg, NOT v_team1_won, v_player3_matches);
    v_new_elo4 := calculate_new_elo(v_player4_elo, v_team1_avg, NOT v_team1_won, v_player4_matches);
    
    -- Upsert player states
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_1_id, profile_id, v_new_elo1, 1, CASE WHEN v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_1_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo1,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN v_team1_won THEN 1 ELSE 0 END;
    
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_2_id, profile_id, v_new_elo2, 1, CASE WHEN v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_2_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo2,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN v_team1_won THEN 1 ELSE 0 END;
    
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_3_id, profile_id, v_new_elo3, 1, CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_3_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo3,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END;
    
    INSERT INTO player_state_incremental (player_id, profile_id, current_elo, matches_played, matches_won)
    SELECT match_record.player_4_id, profile_id, v_new_elo4, 1, CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END
    FROM players WHERE id = match_record.player_4_id
    ON CONFLICT (player_id) DO UPDATE SET
      current_elo = v_new_elo4,
      matches_played = player_state_incremental.matches_played + 1,
      matches_won = player_state_incremental.matches_won + CASE WHEN NOT v_team1_won THEN 1 ELSE 0 END;
    
    -- Update match elo_changes
    v_elo_changes := jsonb_build_object(
      'player_1', jsonb_build_object('before', v_player1_elo, 'after', v_new_elo1, 'change', v_new_elo1 - v_player1_elo),
      'player_2', jsonb_build_object('before', v_player2_elo, 'after', v_new_elo2, 'change', v_new_elo2 - v_player2_elo),
      'player_3', jsonb_build_object('before', v_player3_elo, 'after', v_new_elo3, 'change', v_new_elo3 - v_player3_elo),
      'player_4', jsonb_build_object('before', v_player4_elo, 'after', v_new_elo4, 'change', v_new_elo4 - v_player4_elo)
    );
    
    UPDATE matches SET elo_changes = v_elo_changes WHERE id = match_record.id;
    
    v_matches_processed := v_matches_processed + 1;
  END LOOP;
  
  -- Apply final states to players and profiles
  UPDATE players p SET
    elo_score = psi.current_elo,
    category_label = get_category_from_elo(psi.current_elo),
    matches_played = psi.matches_played,
    matches_won = psi.matches_won
  FROM player_state_incremental psi
  WHERE p.id = psi.player_id;
  
  UPDATE profiles pr SET
    elo_score = psi.current_elo,
    category_label = get_category_from_elo(psi.current_elo),
    matches_played = psi.matches_played,
    matches_won = psi.matches_won
  FROM player_state_incremental psi
  WHERE pr.id = psi.profile_id AND psi.profile_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'matches_processed', v_matches_processed,
    'affected_players', array_length(v_affected_players, 1)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION recalculate_elos_from_date TO authenticated;

COMMENT ON FUNCTION recalculate_elos_from_date IS 
'Recalculates ELOs incrementally from a specific date forward.
More efficient than full recalculation for large datasets.';

-- ============================================
-- STEP 6: Create smart trigger functions
-- ============================================

-- Trigger for INSERT - checks if backdated
CREATE OR REPLACE FUNCTION handle_new_match()
RETURNS TRIGGER AS $$
DECLARE
  v_latest_match_date TIMESTAMPTZ;
BEGIN
  -- Get the latest match date (excluding the new one)
  SELECT MAX(match_date) INTO v_latest_match_date
  FROM matches 
  WHERE id != NEW.id;
  
  IF v_latest_match_date IS NULL OR NEW.match_date >= v_latest_match_date THEN
    -- This is the latest match - just calculate normally (fast path)
    PERFORM update_match_elos(NEW.id);
  ELSE
    -- This is a backdated match - recalculate from this date forward
    PERFORM recalculate_elos_from_date(NEW.match_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for UPDATE - checks what changed
CREATE OR REPLACE FUNCTION handle_match_update()
RETURNS TRIGGER AS $$
DECLARE
  v_min_date TIMESTAMPTZ;
BEGIN
  -- Only recalculate if something important changed
  IF OLD.match_date != NEW.match_date 
     OR OLD.winner_team != NEW.winner_team 
     OR OLD.player_1_id != NEW.player_1_id
     OR OLD.player_2_id != NEW.player_2_id
     OR OLD.player_3_id != NEW.player_3_id
     OR OLD.player_4_id != NEW.player_4_id
  THEN
    -- Recalculate from the earlier of the two dates
    v_min_date := LEAST(OLD.match_date, NEW.match_date);
    PERFORM recalculate_elos_from_date(v_min_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for DELETE
CREATE OR REPLACE FUNCTION handle_match_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate from the deleted match's date forward
  PERFORM recalculate_elos_from_date(OLD.match_date);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: Install triggers
-- ============================================

-- The INSERT trigger already exists, but we recreate it to use the new function
DROP TRIGGER IF EXISTS on_match_created ON matches;
CREATE TRIGGER on_match_created
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION handle_new_match();

-- New UPDATE trigger
DROP TRIGGER IF EXISTS on_match_updated ON matches;
CREATE TRIGGER on_match_updated
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION handle_match_update();

-- New DELETE trigger
DROP TRIGGER IF EXISTS on_match_deleted ON matches;
CREATE TRIGGER on_match_deleted
  AFTER DELETE ON matches
  FOR EACH ROW EXECUTE FUNCTION handle_match_delete();

-- ============================================
-- STEP 8: Run initial recalculation to ensure data integrity
-- ============================================

SELECT recalculate_all_elos();

