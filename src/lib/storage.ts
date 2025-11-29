import { createClient } from '@/lib/supabase/client'

const AVATAR_BUCKET = 'avatars'

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const supabase = createClient()
  
  // Create unique filename with user folder
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`
  
  // Delete existing avatar first (ignore errors)
  await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([`${userId}/avatar.jpg`, `${userId}/avatar.jpeg`, `${userId}/avatar.png`, `${userId}/avatar.webp`])
  
  // Upload new avatar
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    })
  
  if (error) {
    console.error('Error uploading avatar:', error)
    return null
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(data.path)
  
  // Add cache busting query param
  return `${publicUrl}?t=${Date.now()}`
}

export async function deleteAvatar(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  // Try to delete all possible avatar extensions
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([
      `${userId}/avatar.jpg`,
      `${userId}/avatar.jpeg`, 
      `${userId}/avatar.png`,
      `${userId}/avatar.webp`
    ])
  
  if (error) {
    console.error('Error deleting avatar:', error)
    return false
  }
  
  return true
}

export function getAvatarUrl(path: string | null): string | null {
  if (!path) return null
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path
  
  const supabase = createClient()
  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path)
  
  return publicUrl
}

