import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface PlayerStats {
  matches_played: number
  matches_won: number
  win_rate: number
}

export function usePlayerStats(playerId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['player-stats', playerId],
    queryFn: async (): Promise<PlayerStats | null> => {
      if (!playerId) {
        return null
      }

      const { data: player } = await supabase
        .from('players')
        .select('matches_played, matches_won')
        .eq('id', playerId)
        .single()

      if (!player) {
        return null
      }

      const winRate = player.matches_played > 0
        ? Math.round((player.matches_won / player.matches_played) * 100 * 10) / 10
        : 0

      return {
        matches_played: player.matches_played || 0,
        matches_won: player.matches_won || 0,
        win_rate: winRate
      }
    },
    enabled: !!playerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

