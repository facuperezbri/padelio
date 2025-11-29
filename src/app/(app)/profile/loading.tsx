import { Header } from '@/components/layout/header'
import { ProfileSkeleton } from '@/components/skeletons/profile-skeleton'

export default function Loading() {
  return (
    <>
      <Header title="Perfil" />
      <ProfileSkeleton />
    </>
  )
}

