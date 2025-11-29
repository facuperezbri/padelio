import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ProfileForm } from '@/components/profile/profile-form'
import { ProfileEditButtonWrapper, ProfileEditModeProvider } from '@/components/profile/profile-edit-button-wrapper'
import type { Profile, Player } from '@/types/database'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Load profile data on server
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, elo_score, category_label')
    .eq('id', user.id)
    .single()

  if (!profileData) {
    redirect('/login')
  }

  // Get ghost players created by this user
  const { data: ghosts } = await supabase
    .from('players')
    .select('id, display_name, elo_score, category_label, matches_played')
    .eq('created_by_user_id', user.id)
    .eq('is_ghost', true)
    .order('display_name')

  return (
    <ProfileEditModeProvider>
      <Header
        title="Perfil"
        rightAction={<ProfileEditButtonWrapper />}
      />
      <ProfileForm 
        initialProfile={profileData as Profile}
        initialGhostPlayers={(ghosts || []) as Player[]}
      />
    </ProfileEditModeProvider>
  )
}

