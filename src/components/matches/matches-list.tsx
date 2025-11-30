import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { ScoreDisplay } from '@/components/match/score-display'
import { TrendingUp, TrendingDown, MapPin, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { SetScore, EloChanges, Player } from '@/types/database'

type PlayerWithAvatar = Player & { avatar_url?: string | null }

interface MatchWithPlayers {
  id: string
  match_date: string
  venue: string | null
  score_sets: SetScore[]
  winner_team: 1 | 2
  elo_changes: EloChanges | null
  player_1: PlayerWithAvatar
  player_2: PlayerWithAvatar
  player_3: PlayerWithAvatar
  player_4: PlayerWithAvatar
}

async function MatchesListContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: playerRecord } = await supabase
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  let matches: MatchWithPlayers[] = []

  // Solo buscar partidos donde el jugador registrado haya participado
  // Usar exactamente la misma sintaxis que funciona en data-context.tsx
  if (playerRecord?.id) {
    const orConditions = `player_1_id.eq.${playerRecord.id},player_2_id.eq.${playerRecord.id},player_3_id.eq.${playerRecord.id},player_4_id.eq.${playerRecord.id}`

    // Primero obtener los partidos sin joins complejos (como en data-context.tsx)
    const { data: matchesData, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        venue,
        score_sets,
        winner_team,
        elo_changes,
        player_1:players!matches_player_1_id_fkey(id, display_name, is_ghost, elo_score, category_label, profile_id),
        player_2:players!matches_player_2_id_fkey(id, display_name, is_ghost, elo_score, category_label, profile_id),
        player_3:players!matches_player_3_id_fkey(id, display_name, is_ghost, elo_score, category_label, profile_id),
        player_4:players!matches_player_4_id_fkey(id, display_name, is_ghost, elo_score, category_label, profile_id)
      `)
      .or(orConditions)
      .order('match_date', { ascending: false })

    if (!error && matchesData) {
      // Obtener los profile_ids únicos para buscar avatares
      const profileIds = new Set<string>()
      matchesData.forEach(match => {
        const p1 = match.player_1 as any
        const p2 = match.player_2 as any
        const p3 = match.player_3 as any
        const p4 = match.player_4 as any
        
        if (p1?.profile_id && !p1.is_ghost) profileIds.add(p1.profile_id)
        if (p2?.profile_id && !p2.is_ghost) profileIds.add(p2.profile_id)
        if (p3?.profile_id && !p3.is_ghost) profileIds.add(p3.profile_id)
        if (p4?.profile_id && !p4.is_ghost) profileIds.add(p4.profile_id)
      })

      // Obtener avatares de los perfiles
      let avatarsMap: Record<string, string | null> = {}
      if (profileIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', Array.from(profileIds))

        if (profiles) {
          profiles.forEach(profile => {
            avatarsMap[profile.id] = profile.avatar_url
          })
        }
      }

      // Helper function to get avatar_url
      const getAvatarUrl = (player: any): string | null => {
        if (player.is_ghost || !player.profile_id) return null
        return avatarsMap[player.profile_id] || null
      }

      const createPlayerWithAvatar = (player: any): PlayerWithAvatar => {
        const basePlayer = player as unknown as Player
        return {
          ...basePlayer,
          avatar_url: getAvatarUrl(player),
        }
      }

      matches = matchesData.map(m => {
        const p1 = m.player_1 as any
        const p2 = m.player_2 as any
        const p3 = m.player_3 as any
        const p4 = m.player_4 as any
        
        return {
          ...m,
          score_sets: m.score_sets as SetScore[],
          elo_changes: m.elo_changes as EloChanges | null,
          player_1: createPlayerWithAvatar(p1),
          player_2: createPlayerWithAvatar(p2),
          player_3: createPlayerWithAvatar(p3),
          player_4: createPlayerWithAvatar(p4),
        }
      })
    }
  }

  // Group matches by month
  const groupedMatches = matches.reduce((groups, match) => {
    const date = new Date(match.match_date)
    const monthKey = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(match)
    return groups
  }, {} as Record<string, MatchWithPlayers[]>)

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Sin partidos aún</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Registrá tu primer partido para empezar a trackear tu ELO
        </p>
        <Link
          href="/new-match"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Registrar Partido
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedMatches).map(([month, monthMatches]) => (
        <div key={month}>
          <h2 className="mb-3 text-sm font-medium capitalize text-muted-foreground">
            {month}
          </h2>
          <div className="space-y-3">
            {monthMatches.map((match) => {
              // Buscar la posición del jugador registrado en el partido
              let userPosition = 0
              if (playerRecord && match.player_1.id === playerRecord.id) userPosition = 1
              else if (playerRecord && match.player_2.id === playerRecord.id) userPosition = 2
              else if (playerRecord && match.player_3.id === playerRecord.id) userPosition = 3
              else if (playerRecord && match.player_4.id === playerRecord.id) userPosition = 4
              
              const isTeam1 = userPosition <= 2
              const won = (isTeam1 && match.winner_team === 1) || (!isTeam1 && match.winner_team === 2)
              
              const eloKey = `player_${userPosition}` as keyof EloChanges
              const eloChange = match.elo_changes?.[eloKey]?.change || 0

              return (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {won ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : (
                            <TrendingDown className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                <PlayerAvatar
                                  name={match.player_1.display_name}
                                  avatarUrl={match.player_1.avatar_url}
                                  isGhost={match.player_1.is_ghost}
                                  size="sm"
                                  className="ring-2 ring-background"
                                />
                                <PlayerAvatar
                                  name={match.player_2.display_name}
                                  avatarUrl={match.player_2.avatar_url}
                                  isGhost={match.player_2.is_ghost}
                                  size="sm"
                                  className="ring-2 ring-background"
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">vs</span>
                              <div className="flex -space-x-2">
                                <PlayerAvatar
                                  name={match.player_3.display_name}
                                  avatarUrl={match.player_3.avatar_url}
                                  isGhost={match.player_3.is_ghost}
                                  size="sm"
                                  className="ring-2 ring-background"
                                />
                                <PlayerAvatar
                                  name={match.player_4.display_name}
                                  avatarUrl={match.player_4.avatar_url}
                                  isGhost={match.player_4.is_ghost}
                                  size="sm"
                                  className="ring-2 ring-background"
                                />
                              </div>
                            </div>
                          </div>

                          <ScoreDisplay
                            sets={match.score_sets}
                            winnerTeam={match.winner_team}
                            compact
                          />

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {new Date(match.match_date).toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              {new Date(match.match_date).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </span>
                            {match.venue && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.venue}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div
                          className={`text-right font-mono text-sm font-semibold ${
                            eloChange >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {eloChange >= 0 ? '+' : ''}{Math.round(eloChange)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function MatchesListSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((month) => (
        <div key={month} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          {[1, 2].map((match) => (
            <Card key={match}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

export function MatchesList() {
  return (
    <Suspense fallback={<MatchesListSkeleton />}>
      <MatchesListContent />
    </Suspense>
  )
}

