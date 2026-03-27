import { cn } from '../../lib/ui'

interface ProgressBarProps {
  value: number
  tone?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose'
  height?: 'sm' | 'md'
  className?: string
}

const TONE_MAP: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  blue: 'from-sky-300 via-sky-400 to-blue-500',
  cyan: 'from-cyan-200 via-cyan-300 to-cyan-500',
  emerald: 'from-emerald-200 via-emerald-300 to-emerald-500',
  amber: 'from-amber-200 via-amber-300 to-orange-400',
  rose: 'from-rose-200 via-rose-300 to-red-500',
}

export default function ProgressBar({
  value,
  tone = 'blue',
  height = 'md',
  className,
}: ProgressBarProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.05]',
        height === 'sm' ? 'h-2' : 'h-3',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out',
          TONE_MAP[tone],
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
