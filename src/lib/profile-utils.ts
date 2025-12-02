import type { User } from '@supabase/supabase-js'

interface ProfileForValidation {
  user_type?: string | null
  category_label?: string | null
  country?: string | null
  province?: string | null
  email?: string | null
  phone?: string | null
  gender?: string | null
}

/**
 * Verifica si el perfil de un jugador está completo con todos los campos requeridos
 * @param profile - Perfil del usuario desde la base de datos
 * @param user - Usuario autenticado de Supabase (para obtener email si no está en profile)
 * @returns true si el perfil está completo, false en caso contrario
 */
export function isPlayerProfileComplete(
  profile: ProfileForValidation | null,
  user: User | null
): boolean {
  if (!profile || !user) {
    return false
  }

  // Verificar que user_type esté definido y sea 'player'
  if (profile.user_type !== 'player') {
    return false
  }

  // Verificar todos los campos requeridos
  const hasCategory = !!profile.category_label
  const hasCountry = !!profile.country
  const hasProvince = !!profile.province
  const hasEmail = !!(profile.email || user.email)
  const hasPhone = !!profile.phone
  const hasGender = !!profile.gender

  return hasCategory && hasCountry && hasProvince && hasEmail && hasPhone && hasGender
}

/**
 * Verifica si el perfil de un club está completo con todos los campos requeridos
 * @param profile - Perfil del usuario desde la base de datos
 * @param user - Usuario autenticado de Supabase (para obtener email si no está en profile)
 * @returns true si el perfil está completo, false en caso contrario
 */
export function isClubProfileComplete(
  profile: ProfileForValidation | null,
  user: User | null
): boolean {
  if (!profile || !user) {
    return false
  }

  // Verificar que user_type esté definido y sea 'club'
  if (profile.user_type !== 'club') {
    return false
  }

  // Verificar todos los campos requeridos para club
  const hasCountry = !!profile.country
  const hasProvince = !!profile.province
  const hasEmail = !!(profile.email || user.email)
  const hasPhone = !!profile.phone

  return hasCountry && hasProvince && hasEmail && hasPhone
}

