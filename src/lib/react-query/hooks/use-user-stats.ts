import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { QUERY_STALE_TIME } from '@/lib/constants'
import type { Profile } from '@/types/database'

interface UserStats {
  profile: Profile | null
  ranking: number | null
}

export function useUserStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async (): Promise<UserStats> => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw authError
      }
      
      if (!user) {
        return { profile: null, ranking: null }
      }

      // Load profile and ranking in parallel
      const [profileResult, rankingResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        supabase
          .from('global_ranking')
          .select('rank')
          .eq('id', user.id)
          .maybeSingle()
      ])

      if (profileResult.error) {
        throw profileResult.error
      }

      return {
        profile: profileResult.data as Profile | null,
        ranking: rankingResult.data?.rank || null
      }
    },
    staleTime: QUERY_STALE_TIME,
  })
}

