import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Match, Player } from '@/types/database'

export interface MatchWithPlayers extends Match {
  player_1: Player & { avatar_url?: string | null }
  player_2: Player & { avatar_url?: string | null }
  player_3: Player & { avatar_url?: string | null }
  player_4: Player & { avatar_url?: string | null }
}

export function usePlayerMatches(playerId: string | null, limit?: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['player-matches', playerId, limit],
    queryFn: async (): Promise<MatchWithPlayers[]> => {
      if (!playerId) {
        return []
      }

      // Get matches where player participated
      const orConditions = `player_1_id.eq.${playerId},player_2_id.eq.${playerId},player_3_id.eq.${playerId},player_4_id.eq.${playerId}`
      
      const query = supabase
        .from('matches')
        .select(`
          *,
          player_1:players!matches_player_1_id_fkey(*),
          player_2:players!matches_player_2_id_fkey(*),
          player_3:players!matches_player_3_id_fkey(*),
          player_4:players!matches_player_4_id_fkey(*)
        `)
        .or(orConditions)
        .order('match_date', { ascending: false })

      if (limit) {
        query.limit(limit)
      }

      const { data: matchesData } = await query

      if (!matchesData) {
        return []
      }

      // Get avatars for all players
      const profileIds = new Set<string>()
      matchesData.forEach(match => {
        const players = [match.player_1, match.player_2, match.player_3, match.player_4] as any[]
        players.forEach(player => {
          if (player?.profile_id && !player.is_ghost) {
            profileIds.add(player.profile_id)
          }
        })
      })

      let avatarsMap: Record<string, string | null> = {}
      if (profileIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', Array.from(profileIds))

        if (profiles) {
          profiles.forEach(profile => {
            avatarsMap[profile.id] = profile.avatar_url
          })
        }
      }

      const getAvatarUrl = (player: any): string | null => {
        if (player.is_ghost || !player.profile_id) return null
        return avatarsMap[player.profile_id] || null
      }

      return matchesData.map(match => ({
        ...match,
        player_1: { ...match.player_1, avatar_url: getAvatarUrl(match.player_1) },
        player_2: { ...match.player_2, avatar_url: getAvatarUrl(match.player_2) },
        player_3: { ...match.player_3, avatar_url: getAvatarUrl(match.player_3) },
        player_4: { ...match.player_4, avatar_url: getAvatarUrl(match.player_4) },
      })) as MatchWithPlayers[]
    },
    enabled: !!playerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

