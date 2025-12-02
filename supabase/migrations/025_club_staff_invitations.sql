-- ============================================
-- Vibo - Club Staff Invitations
-- ============================================
-- This migration adds:
-- 1. club_staff_invitations table
-- 2. Functions to invite staff and accept invitations
-- ============================================

-- ============================================
-- STEP 1: Create club_staff_invitations table
-- ============================================

CREATE TABLE IF NOT EXISTS club_staff_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role club_role DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Invitation token for shareable links
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  
  -- Profile ID once accepted (if user exists or creates account)
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  responded_at TIMESTAMPTZ
);

-- ============================================
-- STEP 2: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_club_staff_invitations_token ON club_staff_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_club_staff_invitations_club ON club_staff_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_club_staff_invitations_email ON club_staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_club_staff_invitations_profile ON club_staff_invitations(profile_id);

-- Unique partial index: One pending invitation per email per club
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_staff_invitations_unique_pending 
ON club_staff_invitations(club_id, email) 
WHERE status = 'pending';

-- ============================================
-- STEP 3: Enable RLS
-- ============================================

ALTER TABLE club_staff_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Club owners/admins can view invitations" ON club_staff_invitations;
DROP POLICY IF EXISTS "Club owners/admins can create invitations" ON club_staff_invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON club_staff_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON club_staff_invitations;

-- Club owners/admins can view all invitations for their clubs
CREATE POLICY "Club owners/admins can view invitations"
  ON club_staff_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_staff_invitations.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

-- Club owners/admins can create invitations
CREATE POLICY "Club owners/admins can create invitations"
  ON club_staff_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships cm
      WHERE cm.club_id = club_staff_invitations.club_id
      AND cm.profile_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
      AND cm.is_active = TRUE
    )
  );

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
  ON club_staff_invitations FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR profile_id = auth.uid()
  );

-- Users can update invitations sent to their email (to accept/reject)
CREATE POLICY "Users can update their own invitations"
  ON club_staff_invitations FOR UPDATE
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR profile_id = auth.uid()
  )
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR profile_id = auth.uid()
  );

-- ============================================
-- STEP 4: Function to invite staff
-- ============================================

CREATE OR REPLACE FUNCTION invite_club_staff(
  p_club_id UUID,
  p_email TEXT,
  p_role club_role DEFAULT 'member'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_invitation_id UUID;
  v_existing_membership UUID;
  v_existing_profile UUID;
  v_token TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if inviter is owner/admin of the club
  IF NOT EXISTS (
    SELECT 1 FROM club_memberships cm
    WHERE cm.club_id = p_club_id
    AND cm.profile_id = v_user_id
    AND cm.role IN ('owner', 'admin')
    AND cm.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Only club owners and admins can invite staff';
  END IF;
  
  -- Check if user is already a member
  SELECT cm.id INTO v_existing_membership
  FROM club_memberships cm
  JOIN profiles p ON p.id = cm.profile_id
  WHERE cm.club_id = p_club_id
  AND p.email = p_email
  AND cm.is_active = TRUE;
  
  IF v_existing_membership IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este usuario ya es miembro del club'
    );
  END IF;
  
  -- Check if there's a pending invitation
  IF EXISTS (
    SELECT 1 FROM club_staff_invitations
    WHERE club_id = p_club_id
    AND email = p_email
    AND status = 'pending'
    AND expires_at > NOW()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ya existe una invitación pendiente para este email'
    );
  END IF;
  
  -- Check if user exists with this email
  SELECT id INTO v_existing_profile
  FROM profiles
  WHERE email = p_email;
  
  -- Generate token
  v_token := encode(gen_random_bytes(16), 'hex');
  
  -- Create invitation
  INSERT INTO club_staff_invitations (
    club_id,
    email,
    role,
    invited_by,
    invite_token,
    profile_id
  )
  VALUES (
    p_club_id,
    p_email,
    p_role,
    v_user_id,
    v_token,
    v_existing_profile
  )
  RETURNING id INTO v_invitation_id;
  
  -- If user exists, automatically add them (optional - you might want to require acceptance)
  -- For now, we'll require acceptance via the invitation link
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'user_exists', v_existing_profile IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Function to accept staff invitation
-- ============================================

CREATE OR REPLACE FUNCTION accept_club_staff_invitation(
  p_token TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_invitation club_staff_invitations%ROWTYPE;
  v_user_id UUID;
  v_profile_email TEXT;
BEGIN
  -- Get user ID from parameter or auth context
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no autenticado'
    );
  END IF;
  
  -- Get invitation
  SELECT * INTO v_invitation
  FROM club_staff_invitations
  WHERE invite_token = p_token;
  
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitación no encontrada'
    );
  END IF;
  
  -- Check if already responded
  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Esta invitación ya fue respondida'
    );
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at < NOW() THEN
    UPDATE club_staff_invitations
    SET status = 'expired'
    WHERE id = v_invitation.id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Esta invitación ha expirado'
    );
  END IF;
  
  -- Verify email matches (if user is logged in)
  SELECT email INTO v_profile_email
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_profile_email IS NOT NULL AND v_profile_email != v_invitation.email THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El email de tu cuenta no coincide con la invitación'
    );
  END IF;
  
  -- Add user to club membership
  INSERT INTO club_memberships (
    club_id,
    profile_id,
    role,
    is_active
  )
  VALUES (
    v_invitation.club_id,
    v_user_id,
    v_invitation.role,
    TRUE
  )
  ON CONFLICT (club_id, profile_id) DO UPDATE
  SET 
    role = v_invitation.role,
    is_active = TRUE,
    joined_at = NOW();
  
  -- Update invitation status
  UPDATE club_staff_invitations
  SET 
    status = 'accepted',
    profile_id = v_user_id,
    responded_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'club_id', v_invitation.club_id,
    'role', v_invitation.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Function to get invitation by token
-- ============================================

CREATE OR REPLACE FUNCTION get_club_staff_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  club_id UUID,
  club_name TEXT,
  email TEXT,
  role club_role,
  status TEXT,
  invite_token TEXT,
  expires_at TIMESTAMPTZ,
  invited_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csi.id,
    csi.club_id,
    c.name as club_name,
    csi.email,
    csi.role,
    csi.status,
    csi.invite_token,
    csi.expires_at,
    COALESCE(p.full_name, p.username, 'Usuario') as invited_by_name
  FROM club_staff_invitations csi
  JOIN clubs c ON c.id = csi.club_id
  JOIN profiles p ON p.id = csi.invited_by
  WHERE csi.invite_token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION invite_club_staff TO authenticated;
GRANT EXECUTE ON FUNCTION accept_club_staff_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION accept_club_staff_invitation TO anon;
GRANT EXECUTE ON FUNCTION get_club_staff_invitation_by_token TO authenticated;
GRANT EXECUTE ON FUNCTION get_club_staff_invitation_by_token TO anon;

