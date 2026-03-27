import { AlertTriangle, ShieldCheck, Siren } from 'lucide-react'
import { RISK_META, normalizeRiskLabel } from '../lib/risk'
import { cn } from '../lib/ui'

interface RiskBadgeProps {
  label: string
  size?: 'sm' | 'md'
  glow?: boolean
}

const ICONS = {
  LOW: ShieldCheck,
  MEDIUM: AlertTriangle,
  HIGH: Siren,
}

export default function RiskBadge({ label, size = 'md', glow = true }: RiskBadgeProps) {
  const normalized = normalizeRiskLabel(label)
  const style = RISK_META[normalized]
  const Icon = ICONS[normalized]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold uppercase tracking-[0.22em]',
        size === 'sm' ? 'text-[10px]' : 'text-[11px]',
        style.badge,
      )}
      style={glow ? { boxShadow: style.glow } : undefined}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-current opacity-50" />
        <span className="relative h-2 w-2 rounded-full bg-current" />
      </span>
      <Icon className="h-3.5 w-3.5" />
      {normalized}
    </span>
  )
}
