import { Header } from '@/components/layout/header'
import { MatchesSkeleton } from '@/components/skeletons/matches-skeleton'

export default function Loading() {
  return (
    <>
      <Header title="Partidos" showBack />
      <MatchesSkeleton />
    </>
  )
}

