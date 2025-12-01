-- ============================================
-- Vibo - Add Ghost Player Link on Signup
-- ============================================
-- Allows linking ghost players to new users when they sign up via invite link
-- ============================================

-- Function to link a ghost player to a user account
CREATE OR REPLACE FUNCTION link_ghost_player_to_user(
  p_ghost_player_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_ghost_player players%ROWTYPE;
  v_user_profile profiles%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Verify user exists
  SELECT * INTO v_user_profile
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_user_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;
  
  -- Get ghost player
  SELECT * INTO v_ghost_player
  FROM players
  WHERE id = p_ghost_player_id;
  
  IF v_ghost_player IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Jugador invitado no encontrado'
    );
  END IF;
  
  -- Verify it's actually a ghost player
  IF v_ghost_player.is_ghost = FALSE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este jugador ya tiene una cuenta vinculada'
    );
  END IF;
  
  -- Verify ghost player is not already linked
  IF v_ghost_player.profile_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este jugador invitado ya está vinculado a otra cuenta'
    );
  END IF;
  
  -- Delete any existing player record for this user (created by trigger)
  -- We'll use the ghost player as the main player record
  DELETE FROM players
  WHERE profile_id = p_user_id
    AND id != p_ghost_player_id;
  
  -- Link the ghost player to the user
  -- Keep the ghost player's ELO and stats, but update display_name with user's name
  UPDATE players
  SET 
    profile_id = p_user_id,
    display_name = COALESCE(v_user_profile.full_name, v_user_profile.username, 'Usuario'),
    is_ghost = FALSE,
    updated_at = NOW()
  WHERE id = p_ghost_player_id;
  
  -- Update user's profile to match ghost player stats
  UPDATE profiles
  SET
    elo_score = v_ghost_player.elo_score,
    category_label = v_ghost_player.category_label,
    matches_played = v_ghost_player.matches_played,
    matches_won = v_ghost_player.matches_won,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'ghost_player_id', p_ghost_player_id,
    'user_id', p_user_id,
    'message', 'Jugador invitado vinculado exitosamente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION link_ghost_player_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION link_ghost_player_to_user TO anon;

-- Add comment
COMMENT ON FUNCTION link_ghost_player_to_user IS 'Links a ghost player to a user account, transferring ELO and stats to the new user';

