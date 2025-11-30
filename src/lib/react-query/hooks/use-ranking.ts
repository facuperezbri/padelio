import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { GlobalRanking } from '@/types/database'

interface RankingData {
  rankings: GlobalRanking[]
  currentUserId: string | null
}

export function useRanking() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['ranking'],
    queryFn: async (): Promise<RankingData> => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: rankings } = await supabase
        .from('global_ranking')
        .select('*')
        .order('elo_score', { ascending: false })
        .limit(100)

      return {
        rankings: (rankings || []) as GlobalRanking[],
        currentUserId: user?.id || null
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

