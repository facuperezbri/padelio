import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import type { GlobalRanking } from '@/types/database'
import { RankingContent } from './ranking-content'
import { RankingSkeleton } from './ranking-content'

async function RankingDataFetcher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: rankings } = await supabase
    .from('global_ranking')
    .select('*')
    .order('elo_score', { ascending: false })
    .limit(100)

  const globalRankings = (rankings || []) as GlobalRanking[]

  return <RankingContent rankings={globalRankings} currentUserId={user.id} />
}

export function RankingContentWrapper() {
  return (
    <Suspense fallback={<RankingSkeleton />}>
      <RankingDataFetcher />
    </Suspense>
  )
}

