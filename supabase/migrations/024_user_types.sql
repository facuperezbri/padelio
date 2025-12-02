-- ============================================
-- Vibo - User Types (Player vs Club)
-- ============================================
-- This migration adds:
-- 1. user_type enum and column to profiles
-- 2. Function to create club account with club record
-- 3. Update existing profiles to 'player' by default
-- ============================================

-- ============================================
-- STEP 1: Create user_type enum
-- ============================================

DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('player', 'club');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: Add user_type column to profiles
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'player';

-- ============================================
-- STEP 3: Update existing profiles to 'player'
-- ============================================

UPDATE profiles 
SET user_type = 'player' 
WHERE user_type IS NULL;

-- ============================================
-- STEP 4: Make user_type NOT NULL
-- ============================================

ALTER TABLE profiles 
ALTER COLUMN user_type SET NOT NULL;

-- ============================================
-- STEP 5: Function to create club account
-- ============================================
-- When a user creates a club account, this function:
-- 1. Updates their profile with user_type = 'club'
-- 2. Creates a club record
-- 3. Adds them as owner in club_memberships

CREATE OR REPLACE FUNCTION create_club_account(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'Argentina',
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_instagram TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_club_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Update profile to club type
  UPDATE profiles
  SET user_type = 'club'
  WHERE id = v_user_id;
  
  -- Create club
  INSERT INTO clubs (
    name, 
    slug, 
    description, 
    city, 
    province, 
    country,
    phone,
    email,
    website,
    instagram,
    is_public, 
    created_by
  )
  VALUES (
    p_name, 
    p_slug, 
    p_description, 
    p_city, 
    p_province, 
    p_country,
    p_phone,
    p_email,
    p_website,
    p_instagram,
    p_is_public, 
    v_user_id
  )
  RETURNING id INTO v_club_id;
  
  -- Add creator as owner
  INSERT INTO club_memberships (club_id, profile_id, role)
  VALUES (v_club_id, v_user_id, 'owner')
  ON CONFLICT (club_id, profile_id) DO NOTHING;
  
  RETURN v_club_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_club_account TO authenticated;

-- ============================================
-- STEP 6: Grant permissions on enum
-- ============================================

GRANT USAGE ON TYPE user_type TO authenticated;
GRANT USAGE ON TYPE user_type TO anon;

-- ============================================
-- STEP 7: Add index for user_type
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

