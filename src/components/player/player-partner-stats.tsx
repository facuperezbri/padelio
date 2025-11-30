'use client'

import { PartnerStatsComponent } from '@/components/profile/partner-stats'

interface PlayerPartnerStatsProps {
  targetPlayerId: string
  currentUserPlayerId: string
}

export function PlayerPartnerStats({ 
  targetPlayerId, 
  currentUserPlayerId 
}: PlayerPartnerStatsProps) {
  // This component shows the chemistry between the target player and current user
  // We filter to show only stats with current user as partner
  
  return (
    <PartnerStatsComponent 
      playerId={targetPlayerId}
      filterPartnerId={currentUserPlayerId}
    />
  )
}

