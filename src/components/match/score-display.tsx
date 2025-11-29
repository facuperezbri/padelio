import { cn } from '@/lib/utils'
import type { SetScore } from '@/types/database'

interface ScoreDisplayProps {
  sets: SetScore[]
  winnerTeam: 1 | 2
  compact?: boolean
  className?: string
}

export function ScoreDisplay({ sets, winnerTeam, compact = false, className }: ScoreDisplayProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 font-mono', className)}>
        {sets.map((set, index) => (
          <span key={index} className="flex items-center">
            <span className={cn(winnerTeam === 1 && 'font-semibold text-primary')}>
              {set.team1}
            </span>
            <span className="mx-0.5 text-muted-foreground">-</span>
            <span className={cn(winnerTeam === 2 && 'font-semibold text-primary')}>
              {set.team2}
            </span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-sm">
        <span className={cn('font-medium', winnerTeam === 1 && 'text-primary')}>
          Equipo 1
          {winnerTeam === 1 && <span className="ml-1 text-xs">🏆</span>}
        </span>
        {sets.map((set, index) => (
          <span
            key={`t1-${index}`}
            className={cn(
              'w-8 text-center font-mono font-semibold',
              set.team1 > set.team2 ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {set.team1}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-sm">
        <span className={cn('font-medium', winnerTeam === 2 && 'text-primary')}>
          Equipo 2
          {winnerTeam === 2 && <span className="ml-1 text-xs">🏆</span>}
        </span>
        {sets.map((set, index) => (
          <span
            key={`t2-${index}`}
            className={cn(
              'w-8 text-center font-mono font-semibold',
              set.team2 > set.team1 ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {set.team2}
          </span>
        ))}
      </div>
    </div>
  )
}

