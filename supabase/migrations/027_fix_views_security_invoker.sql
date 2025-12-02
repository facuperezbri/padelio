-- ============================================
-- FIX: Add security_invoker to views
-- ============================================
-- Views were executing with owner privileges (bypassing RLS).
-- Adding security_invoker = true makes them respect the querying user's RLS policies.
-- Requires PostgreSQL 15+ (Supabase default).
--
-- Note: Must DROP and recreate because CREATE OR REPLACE cannot change view options.

-- Drop existing views
DROP VIEW IF EXISTS global_ranking;
DROP VIEW IF EXISTS player_stats;

-- Recreate global_ranking view with security_invoker
CREATE VIEW global_ranking
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.elo_score,
  p.category_label,
  p.matches_played,
  p.matches_won,
  CASE WHEN p.matches_played > 0 
    THEN ROUND((p.matches_won::numeric / p.matches_played::numeric) * 100, 1)
    ELSE 0 
  END as win_rate,
  RANK() OVER (ORDER BY p.elo_score DESC) as rank
FROM profiles p
WHERE p.matches_played > 0
ORDER BY p.elo_score DESC;

-- Recreate player_stats view with security_invoker
CREATE VIEW player_stats
WITH (security_invoker = true)
AS
SELECT 
  pl.id,
  pl.display_name,
  pl.is_ghost,
  pl.profile_id,
  pl.created_by_user_id,
  pl.elo_score,
  pl.category_label,
  pl.matches_played,
  pl.matches_won,
  CASE WHEN pl.matches_played > 0 
    THEN ROUND((pl.matches_won::numeric / pl.matches_played::numeric) * 100, 1)
    ELSE 0 
  END as win_rate
FROM players pl;

-- Grant permissions
GRANT SELECT ON global_ranking TO authenticated;
GRANT SELECT ON player_stats TO authenticated;
