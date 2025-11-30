'use client'

import { PartnerStatsComponent } from '@/components/profile/partner-stats'
import { useCurrentPlayer } from '@/lib/react-query/hooks'

export function PartnerChemistry() {
  const { data: playerId, isLoading: loading } = useCurrentPlayer()

  // Only pass initialLoading if we don't have playerId yet (first load)
  return <PartnerStatsComponent playerId={playerId} limit={3} showViewAllLink={true} initialLoading={loading && !playerId} />
}

