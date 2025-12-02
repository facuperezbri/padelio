-- ============================================
-- Vibo - Clubs and Tournaments Schema
-- ============================================
-- This migration adds:
-- 1. Clubs table and memberships
-- 2. Tournaments table and registrations
-- 3. Links matches to clubs/tournaments
-- 4. RLS policies for all new tables
-- ============================================

-- ============================================
-- STEP 1: Create club_role enum
-- ============================================

DO $$ BEGIN
  CREATE TYPE club_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tournament_status AS ENUM ('draft', 'open', 'in_progress', 'finished', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'groups_knockout');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'waitlist', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 2: Clubs table
-- ============================================

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Argentina',
  
  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  
  -- Settings
  is_public BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Club memberships
-- ============================================

CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role club_role DEFAULT 'member',
  
  -- Membership details
  nickname TEXT, -- Optional nickname within the club
  jersey_number INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(club_id, profile_id)
);

-- ============================================
-- STEP 4: Tournaments table
-- ============================================

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL, -- Can be independent
  
  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  registration_deadline DATE,
  
  -- Format
  format tournament_format DEFAULT 'single_elimination',
  max_teams INTEGER,
  min_teams INTEGER DEFAULT 4,
  
  -- Categories
  category_label player_category, -- Optional category restriction
  gender TEXT CHECK (gender IN ('Masculino', 'Femenino', 'Mixto')),
  
  -- Pricing
  entry_fee DECIMAL(10, 2),
  prize_pool TEXT,
  
  -- Status
  status tournament_status DEFAULT 'draft',
  
  -- Images
  banner_url TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(club_id, slug)
);

-- ============================================
-- STEP 5: Tournament registrations (teams)
-- ============================================

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  
  -- Team (pair of players)
  player_1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Team info
  team_name TEXT,
  seed INTEGER, -- For seeded tournaments
  
  -- Status
  status registration_status DEFAULT 'pending',
  
  -- Payment
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  registered_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure player1 and player2 are different
  CONSTRAINT different_players CHECK (player_1_id != player_2_id),
  
  -- Unique registration per pair per tournament (order independent)
  UNIQUE(tournament_id, player_1_id, player_2_id)
);

-- ============================================
-- STEP 6: Link matches to clubs and tournaments
-- ============================================

ALTER TABLE matches ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_round TEXT; -- e.g., 'Cuartos', 'Semifinal', 'Final'
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_match_number INTEGER; -- Match order in bracket

-- ============================================
-- STEP 7: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clubs_slug ON clubs(slug);
CREATE INDEX IF NOT EXISTS idx_clubs_city ON clubs(city);
CREATE INDEX IF NOT EXISTS idx_clubs_province ON clubs(province);
CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON clubs(created_by);

CREATE INDEX IF NOT EXISTS idx_club_memberships_club ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_profile ON club_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_role ON club_memberships(role);

CREATE INDEX IF NOT EXISTS idx_tournaments_club ON tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player1 ON tournament_registrations(player_1_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player2 ON tournament_registrations(player_2_id);

CREATE INDEX IF NOT EXISTS idx_matches_club ON matches(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);

-- ============================================
-- STEP 8: Triggers for updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STEP 9: Row Level Security
-- ============================================

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- CLUBS Policies

-- Anyone can view public clubs
CREATE POLICY "Public clubs are viewable by everyone"
  ON clubs FOR SELECT
  USING (is_public = TRUE);

-- Members can view their private clubs
CREATE POLICY "Members can view their private clubs"
  ON clubs FOR SELECT
  USING (
    is_public = FALSE AND
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.profile_id = auth.uid()
      AND club_memberships.is_active = TRUE
    )
  );

-- Authenticated users can create clubs
CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Owners and admins can update their clubs
CREATE POLICY "Owners and admins can update clubs"
  ON clubs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.profile_id = auth.uid()
      AND club_memberships.role IN ('owner', 'admin')
      AND club_memberships.is_active = TRUE
    )
  );

-- Only owners can delete clubs
CREATE POLICY "Owners can delete clubs"
  ON clubs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.profile_id = auth.uid()
      AND club_memberships.role = 'owner'
      AND club_memberships.is_active = TRUE
    )
  );

-- CLUB MEMBERSHIPS Policies

-- Members can view memberships of clubs they belong to
CREATE POLICY "Members can view club memberships"
  ON club_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = auth.uid()
      AND cm.is_active = TRUE
    )
    OR
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_memberships.club_id
      AND clubs.is_public = TRUE
    )
  );

-- Owners and admins can manage memberships
CREATE POLICY "Owners and admins can insert memberships"
  ON club_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
    OR
    -- Allow self-join for public clubs that don't require approval
    (
      profile_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_memberships.club_id
        AND clubs.is_public = TRUE
        AND clubs.requires_approval = FALSE
      )
    )
  );

CREATE POLICY "Owners and admins can update memberships"
  ON club_memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
    OR
    -- Users can update their own membership (e.g., leave)
    profile_id = auth.uid()
  );

CREATE POLICY "Owners can delete memberships"
  ON club_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role = 'owner'
      AND cm.is_active = TRUE
    )
    OR
    -- Users can delete their own membership
    profile_id = auth.uid()
  );

-- TOURNAMENTS Policies

-- Anyone can view public tournaments
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (
    status != 'draft'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = tournaments.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

-- Club admins or independent users can create tournaments
CREATE POLICY "Users can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      club_id IS NULL -- Independent tournament
      OR EXISTS (
        SELECT 1 FROM club_memberships cm
        WHERE cm.club_id = tournaments.club_id
        AND cm.profile_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.is_active = TRUE
      )
    )
  );

-- Creators and club admins can update
CREATE POLICY "Creators and admins can update tournaments"
  ON tournaments FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = tournaments.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

CREATE POLICY "Creators and admins can delete tournaments"
  ON tournaments FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = tournaments.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role = 'owner'
      AND cm.is_active = TRUE
    )
  );

-- TOURNAMENT REGISTRATIONS Policies

-- Anyone can view registrations for visible tournaments
CREATE POLICY "Registrations are viewable"
  ON tournament_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_registrations.tournament_id
      AND (t.status != 'draft' OR t.created_by = auth.uid())
    )
  );

-- Users can register for open tournaments
CREATE POLICY "Users can register for tournaments"
  ON tournament_registrations FOR INSERT
  WITH CHECK (
    auth.uid() = registered_by
    AND EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_registrations.tournament_id
      AND t.status = 'open'
    )
  );

-- Users can update their own registrations or admins can update any
CREATE POLICY "Users can update their registrations"
  ON tournament_registrations FOR UPDATE
  USING (
    registered_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tournaments t
      LEFT JOIN club_memberships cm ON cm.club_id = t.club_id
      WHERE t.id = tournament_registrations.tournament_id
      AND (
        t.created_by = auth.uid()
        OR (cm.profile_id = auth.uid() AND cm.role IN ('owner', 'admin') AND cm.is_active = TRUE)
      )
    )
  );

CREATE POLICY "Users can delete their registrations"
  ON tournament_registrations FOR DELETE
  USING (
    registered_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tournaments t
      LEFT JOIN club_memberships cm ON cm.club_id = t.club_id
      WHERE t.id = tournament_registrations.tournament_id
      AND (
        t.created_by = auth.uid()
        OR (cm.profile_id = auth.uid() AND cm.role IN ('owner', 'admin') AND cm.is_active = TRUE)
      )
    )
  );

-- ============================================
-- STEP 10: Helper function to create club with owner
-- ============================================

CREATE OR REPLACE FUNCTION create_club_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_club_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Create club
  INSERT INTO clubs (name, slug, description, city, province, is_public, created_by)
  VALUES (p_name, p_slug, p_description, p_city, p_province, p_is_public, v_user_id)
  RETURNING id INTO v_club_id;
  
  -- Add creator as owner
  INSERT INTO club_memberships (club_id, profile_id, role)
  VALUES (v_club_id, v_user_id, 'owner');
  
  RETURN v_club_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_club_with_owner TO authenticated;

-- ============================================
-- STEP 11: Grant permissions on enums
-- ============================================

GRANT USAGE ON TYPE club_role TO authenticated;
GRANT USAGE ON TYPE club_role TO anon;
GRANT USAGE ON TYPE tournament_status TO authenticated;
GRANT USAGE ON TYPE tournament_status TO anon;
GRANT USAGE ON TYPE tournament_format TO authenticated;
GRANT USAGE ON TYPE tournament_format TO anon;
GRANT USAGE ON TYPE registration_status TO authenticated;
GRANT USAGE ON TYPE registration_status TO anon;

-- ============================================
-- STEP 12: Views for easier querying
-- ============================================

-- Club with member count
CREATE OR REPLACE VIEW club_summary AS
SELECT 
  c.*,
  COUNT(DISTINCT cm.profile_id) FILTER (WHERE cm.is_active = TRUE) as member_count,
  COUNT(DISTINCT t.id) as tournament_count
FROM clubs c
LEFT JOIN club_memberships cm ON cm.club_id = c.id
LEFT JOIN tournaments t ON t.club_id = c.id
GROUP BY c.id;

-- Tournament with registration count
CREATE OR REPLACE VIEW tournament_summary AS
SELECT 
  t.*,
  c.name as club_name,
  c.slug as club_slug,
  COUNT(DISTINCT tr.id) FILTER (WHERE tr.status IN ('pending', 'confirmed')) as registration_count
FROM tournaments t
LEFT JOIN clubs c ON c.id = t.club_id
LEFT JOIN tournament_registrations tr ON tr.tournament_id = t.id
GROUP BY t.id, c.id;

GRANT SELECT ON club_summary TO authenticated;
GRANT SELECT ON tournament_summary TO authenticated;

