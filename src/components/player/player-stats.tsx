'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface PlayerStatsProps {
  playerId: string
}

interface Stats {
  matches_played: number
  matches_won: number
  win_rate: number
}

export function PlayerStats({ playerId }: PlayerStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      
      const { data: player } = await supabase
        .from('players')
        .select('matches_played, matches_won')
        .eq('id', playerId)
        .single()

      if (player) {
        const winRate = player.matches_played > 0
          ? Math.round((player.matches_won / player.matches_played) * 100 * 10) / 10
          : 0

        setStats({
          matches_played: player.matches_played || 0,
          matches_won: player.matches_won || 0,
          win_rate: winRate
        })
      }
      
      setLoading(false)
    }

    loadStats()
  }, [playerId, supabase])

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

