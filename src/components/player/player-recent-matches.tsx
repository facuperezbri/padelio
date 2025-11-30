'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlayerMatches } from '@/lib/react-query/hooks'
import { Trophy, Calendar, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface PlayerRecentMatchesProps {
  playerId: string
}

export function PlayerRecentMatches({ playerId }: PlayerRecentMatchesProps) {
  const { data: matches = [], isLoading: loading } = usePlayerMatches(playerId, 10)

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimos Partidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimos Partidos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no hay partidos registrados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimos Partidos</CardTitle>
          <Link
            href={`/player/${playerId}/matches`}
            className="text-sm text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {matches.map((match) => {
          // Determine player's team and if they won
          const playerPosition = 
            match.player_1_id === playerId ? 1 :
            match.player_2_id === playerId ? 2 :
            match.player_3_id === playerId ? 3 : 4
          
          const playerTeam = playerPosition <= 2 ? 1 : 2
          const won = match.winner_team === playerTeam

          // Get teammate
          const teammate = playerPosition === 1 ? match.player_2 :
                          playerPosition === 2 ? match.player_1 :
                          playerPosition === 3 ? match.player_4 : match.player_3

          // Get opponents
          const opponents = playerTeam === 1 
            ? [match.player_3, match.player_4]
            : [match.player_1, match.player_2]

          return (
            <Link key={match.id} href={`/matches/${match.id}`} className="block">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {won ? (
                    <Trophy className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {won ? 'Victoria' : 'Derrota'}
                    </span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <div className="flex items-center gap-1">
                      {opponents.map((opponent, idx) => (
                        <span key={opponent.id} className="text-xs text-muted-foreground">
                          {opponent.display_name}
                          {idx < opponents.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(match.match_date).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: new Date(match.match_date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      Con {teammate.display_name}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

