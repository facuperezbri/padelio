import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (profileData: {
      full_name?: string
      username?: string
      email?: string | null
      phone?: string | null
      country?: string | null
      province?: string | null
      gender?: string | null
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)

      if (error) throw error

      // Also update player record if display_name changed
      if (profileData.full_name || profileData.username) {
        await supabase
          .from('players')
          .update({
            display_name: profileData.full_name || profileData.username || undefined,
          })
          .eq('profile_id', user.id)
      }

      return { success: true }
    },
    onSuccess: () => {
      // Invalidate profile and player queries
      queryClient.invalidateQueries({ queryKey: ['current-player'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

