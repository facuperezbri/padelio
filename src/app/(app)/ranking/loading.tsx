import { Header } from '@/components/layout/header'
import { RankingSkeleton } from '@/components/skeletons/ranking-skeleton'

export default function Loading() {
  return (
    <>
      <Header title="Ranking" />
      <RankingSkeleton />
    </>
  )
}

