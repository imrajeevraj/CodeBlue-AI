import { TrendingDown, TrendingUp, Zap } from 'lucide-react'
import type { DriverDetail } from '../types'
import ProgressBar from './ui/ProgressBar'
import { cn, formatFeatureName } from '../lib/ui'

interface DriverListProps {
  drivers: DriverDetail[]
  title?: string
}

export default function DriverList({ drivers, title = 'Top Risk Drivers' }: DriverListProps) {
  if (!drivers.length) return null

  const maxImpact = Math.max(...drivers.map((driver) => driver.impact))

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <Zap className="h-4 w-4 text-sky-300" />
        {title}
      </h4>
      {drivers.map((driver) => {
        const pct = maxImpact > 0 ? (driver.impact / maxImpact) * 100 : 0
        const isUp = driver.direction === 'up'

        return (
          <div
            key={driver.feature}
            className="animate-rise space-y-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-200">
                {isUp ? (
                  <TrendingUp className="h-3.5 w-3.5 text-rose-300" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-300" />
                )}
                {formatFeatureName(driver.feature)}
              </span>
              <span className="text-xs text-slate-500">{driver.value.toFixed(2)}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_64px] sm:items-center">
              <ProgressBar value={pct} tone={isUp ? 'rose' : 'emerald'} height="sm" />
              <div
                className={cn(
                  'rounded-full border px-2.5 py-1 text-center text-xs font-medium',
                  isUp
                    ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
                    : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
                )}
              >
                {isUp ? '+' : '-'}
                {driver.impact.toFixed(2)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
