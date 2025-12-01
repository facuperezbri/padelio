import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useCreateMatch() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (matchData: {
      match_date: string
      venue?: string | null
      player_1_id: string
      player_2_id: string
      player_3_id: string
      player_4_id: string
      score_sets: any[]
      winner_team: number
      match_config: any
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          created_by: user.id,
          ...matchData,
        })
        .select('id')
        .single()

      if (error) throw error
      return match
    },
    onSuccess: () => {
      // Invalidate all queries that depend on matches
      queryClient.invalidateQueries({ queryKey: ['player-matches'] })
      queryClient.invalidateQueries({ queryKey: ['most-frequent-opponent'] })
      queryClient.invalidateQueries({ queryKey: ['head-to-head-stats'] })
      queryClient.invalidateQueries({ queryKey: ['partner-stats'] })
      queryClient.invalidateQueries({ queryKey: ['player-stats'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['ranking'] })
    },
  })
}

