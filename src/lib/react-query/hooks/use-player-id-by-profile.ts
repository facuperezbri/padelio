import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function usePlayerIdByProfile(profileId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['player-id-by-profile', profileId],
    queryFn: async (): Promise<string | null> => {
      if (!profileId) {
        return null
      }

      const { data } = await supabase
        .from('players')
        .select('id')
        .eq('profile_id', profileId)
        .eq('is_ghost', false)
        .maybeSingle()
      
      return data?.id || null
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

