'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, TrendingUp } from 'lucide-react'
import { usePlayerStats } from '@/lib/react-query/hooks'
import { Skeleton } from '@/components/ui/skeleton'

interface PlayerStatsProps {
  playerId: string
}

export function PlayerStats({ playerId }: PlayerStatsProps) {
  const { data: stats, isLoading } = usePlayerStats(playerId)

  // Only show skeleton if we don't have data yet (first load)
  const loading = isLoading && !stats

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Estadísticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Partidos</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.matches_played}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Victorias</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.matches_won}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.win_rate}% winrate
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

