-- ============================================
-- Fix RLS Performance Issues
-- ============================================
-- This migration fixes Row Level Security policies that use auth.uid() directly,
-- which causes suboptimal query performance at scale. We replace auth.uid() with
-- (select auth.uid()) so it's evaluated once per query instead of once per row.
-- ============================================

-- ============================================
-- CLUBS Policies
-- ============================================

-- Drop and recreate "Members can view their private clubs" policy
DROP POLICY IF EXISTS "Members can view their private clubs" ON clubs;
CREATE POLICY "Members can view their private clubs"
  ON clubs FOR SELECT
  USING (
    is_public = FALSE AND
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.profile_id = (select auth.uid())
      AND club_memberships.is_active = TRUE
    )
  );

-- Drop and recreate "Authenticated users can create clubs" policy
DROP POLICY IF EXISTS "Authenticated users can create clubs" ON clubs;
CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  WITH CHECK ((select auth.uid()) = created_by);

-- Drop and recreate "Owners and admins can update clubs" policy
DROP POLICY IF EXISTS "Owners and admins can update clubs" ON clubs;
CREATE POLICY "Owners and admins can update clubs"
  ON clubs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.profile_id = (select auth.uid())
      AND club_memberships.role IN ('owner', 'admin')
      AND club_memberships.is_active = TRUE
    )
  );

-- Drop and recreate "Owners can delete clubs" policy
DROP POLICY IF EXISTS "Owners can delete clubs" ON clubs;
CREATE POLICY "Owners can delete clubs"
  ON clubs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.profile_id = (select auth.uid())
      AND club_memberships.role = 'owner'
      AND club_memberships.is_active = TRUE
    )
  );

-- ============================================
-- CLUB MEMBERSHIPS Policies
-- ============================================

-- Drop and recreate "Members can view club memberships" policy
DROP POLICY IF EXISTS "Members can view club memberships" ON club_memberships;
CREATE POLICY "Members can view club memberships"
  ON club_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.is_active = TRUE
    )
    OR
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_memberships.club_id
      AND clubs.is_public = TRUE
    )
  );

-- Drop and recreate "Owners and admins can insert memberships" policy
DROP POLICY IF EXISTS "Owners and admins can insert memberships" ON club_memberships;
CREATE POLICY "Owners and admins can insert memberships"
  ON club_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
    OR
    -- Allow self-join for public clubs that don't require approval
    (
      profile_id = (select auth.uid()) AND
      EXISTS (
        SELECT 1 FROM clubs
        WHERE clubs.id = club_memberships.club_id
        AND clubs.is_public = TRUE
        AND clubs.requires_approval = FALSE
      )
    )
  );

-- Drop and recreate "Owners and admins can update memberships" policy
DROP POLICY IF EXISTS "Owners and admins can update memberships" ON club_memberships;
CREATE POLICY "Owners and admins can update memberships"
  ON club_memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
    OR
    -- Users can update their own membership (e.g., leave)
    profile_id = (select auth.uid())
  );

-- Drop and recreate "Owners can delete memberships" policy
DROP POLICY IF EXISTS "Owners can delete memberships" ON club_memberships;
CREATE POLICY "Owners can delete memberships"
  ON club_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_memberships.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role = 'owner'
      AND cm.is_active = TRUE
    )
    OR
    -- Users can delete their own membership
    profile_id = (select auth.uid())
  );

-- ============================================
-- TOURNAMENTS Policies
-- ============================================

-- Drop and recreate "Tournaments are viewable by everyone" policy
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON tournaments;
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (
    status != 'draft'
    OR created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = tournaments.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

-- Drop and recreate "Users can create tournaments" policy
DROP POLICY IF EXISTS "Users can create tournaments" ON tournaments;
CREATE POLICY "Users can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (
    (select auth.uid()) = created_by
    AND (
      club_id IS NULL -- Independent tournament
      OR EXISTS (
        SELECT 1 FROM club_memberships cm
        WHERE cm.club_id = tournaments.club_id
        AND cm.profile_id = (select auth.uid())
        AND cm.role IN ('owner', 'admin')
        AND cm.is_active = TRUE
      )
    )
  );

-- Drop and recreate "Creators and admins can update tournaments" policy
DROP POLICY IF EXISTS "Creators and admins can update tournaments" ON tournaments;
CREATE POLICY "Creators and admins can update tournaments"
  ON tournaments FOR UPDATE
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = tournaments.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

-- Drop and recreate "Creators and admins can delete tournaments" policy
DROP POLICY IF EXISTS "Creators and admins can delete tournaments" ON tournaments;
CREATE POLICY "Creators and admins can delete tournaments"
  ON tournaments FOR DELETE
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = tournaments.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role = 'owner'
      AND cm.is_active = TRUE
    )
  );

-- ============================================
-- TOURNAMENT REGISTRATIONS Policies
-- ============================================

-- Drop and recreate "Registrations are viewable" policy
DROP POLICY IF EXISTS "Registrations are viewable" ON tournament_registrations;
CREATE POLICY "Registrations are viewable"
  ON tournament_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_registrations.tournament_id
      AND (t.status != 'draft' OR t.created_by = (select auth.uid()))
    )
  );

-- Drop and recreate "Users can register for tournaments" policy
DROP POLICY IF EXISTS "Users can register for tournaments" ON tournament_registrations;
CREATE POLICY "Users can register for tournaments"
  ON tournament_registrations FOR INSERT
  WITH CHECK (
    (select auth.uid()) = registered_by
    AND EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_registrations.tournament_id
      AND t.status = 'open'
    )
  );

-- Drop and recreate "Users can update their registrations" policy
DROP POLICY IF EXISTS "Users can update their registrations" ON tournament_registrations;
CREATE POLICY "Users can update their registrations"
  ON tournament_registrations FOR UPDATE
  USING (
    registered_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM tournaments t
      LEFT JOIN club_memberships cm ON cm.club_id = t.club_id
      WHERE t.id = tournament_registrations.tournament_id
      AND (
        t.created_by = (select auth.uid())
        OR (cm.profile_id = (select auth.uid()) AND cm.role IN ('owner', 'admin') AND cm.is_active = TRUE)
      )
    )
  );

-- Drop and recreate "Users can delete their registrations" policy
DROP POLICY IF EXISTS "Users can delete their registrations" ON tournament_registrations;
CREATE POLICY "Users can delete their registrations"
  ON tournament_registrations FOR DELETE
  USING (
    registered_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM tournaments t
      LEFT JOIN club_memberships cm ON cm.club_id = t.club_id
      WHERE t.id = tournament_registrations.tournament_id
      AND (
        t.created_by = (select auth.uid())
        OR (cm.profile_id = (select auth.uid()) AND cm.role IN ('owner', 'admin') AND cm.is_active = TRUE)
      )
    )
  );

-- ============================================
-- CLUB STAFF INVITATIONS Policies
-- ============================================

-- Drop and recreate "Club owners/admins can view invitations" policy
DROP POLICY IF EXISTS "Club owners/admins can view invitations" ON club_staff_invitations;
CREATE POLICY "Club owners/admins can view invitations"
  ON club_staff_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_staff_invitations.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

-- Drop and recreate "Club owners/admins can create invitations" policy
DROP POLICY IF EXISTS "Club owners/admins can create invitations" ON club_staff_invitations;
CREATE POLICY "Club owners/admins can create invitations"
  ON club_staff_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_staff_invitations.club_id
      AND cm.profile_id = (select auth.uid())
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

-- Drop and recreate "Users can view their own invitations" policy
DROP POLICY IF EXISTS "Users can view their own invitations" ON club_staff_invitations;
CREATE POLICY "Users can view their own invitations"
  ON club_staff_invitations FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = (select auth.uid()))
    OR profile_id = (select auth.uid())
  );

-- Drop and recreate "Users can update their own invitations" policy
DROP POLICY IF EXISTS "Users can update their own invitations" ON club_staff_invitations;
CREATE POLICY "Users can update their own invitations"
  ON club_staff_invitations FOR UPDATE
  USING (
    email = (SELECT email FROM profiles WHERE id = (select auth.uid()))
    OR profile_id = (select auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = (select auth.uid()))
    OR profile_id = (select auth.uid())
  );

