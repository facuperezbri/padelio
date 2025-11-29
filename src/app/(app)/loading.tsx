import { Header } from '@/components/layout/header'
import { HomeSkeleton } from '@/components/skeletons/home-skeleton'

export default function Loading() {
  return (
    <>
      <Header title="PadelTracker" />
      <HomeSkeleton />
    </>
  )
}

