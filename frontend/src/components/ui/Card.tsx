import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/ui'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'none'
  interactive?: boolean
  children: ReactNode
}

const ACCENT_MAP: Record<NonNullable<CardProps['accent']>, string> = {
  blue: 'before:from-sky-400/[0.18] before:to-blue-500/0',
  cyan: 'before:from-cyan-300/[0.18] before:to-cyan-500/0',
  emerald: 'before:from-emerald-300/[0.18] before:to-emerald-500/0',
  amber: 'before:from-amber-300/[0.18] before:to-amber-500/0',
  rose: 'before:from-rose-300/[0.18] before:to-rose-500/0',
  violet: 'before:from-violet-300/[0.18] before:to-violet-500/0',
  none: 'before:from-transparent before:to-transparent',
}

export default function Card({
  accent = 'blue',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'premium-card relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(3,7,18,0.45)]',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r',
        ACCENT_MAP[accent],
        interactive && 'transition duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:shadow-[0_26px_90px_rgba(8,15,35,0.6)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
