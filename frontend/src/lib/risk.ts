export type RiskLabel = 'LOW' | 'MEDIUM' | 'HIGH'

export const RISK_META: Record<
  RiskLabel,
  {
    solid: string
    soft: string
    glow: string
    badge: string
    bar: string
    border: string
    text: string
  }
> = {
  LOW: {
    solid: '#34d399',
    soft: 'rgba(52, 211, 153, 0.18)',
    glow: '0 0 42px rgba(52, 211, 153, 0.18)',
    badge: 'border-emerald-400/25 bg-emerald-400/[0.12] text-emerald-200',
    bar: 'from-emerald-300 via-emerald-400 to-teal-300',
    border: 'border-emerald-400/25',
    text: 'text-emerald-300',
  },
  MEDIUM: {
    solid: '#fbbf24',
    soft: 'rgba(251, 191, 36, 0.18)',
    glow: '0 0 42px rgba(251, 191, 36, 0.18)',
    badge: 'border-amber-400/25 bg-amber-400/[0.12] text-amber-100',
    bar: 'from-amber-200 via-amber-400 to-orange-300',
    border: 'border-amber-400/25',
    text: 'text-amber-200',
  },
  HIGH: {
    solid: '#fb7185',
    soft: 'rgba(251, 113, 133, 0.18)',
    glow: '0 0 42px rgba(251, 113, 133, 0.2)',
    badge: 'border-rose-400/25 bg-rose-400/[0.12] text-rose-100',
    bar: 'from-rose-300 via-rose-400 to-red-400',
    border: 'border-rose-400/25',
    text: 'text-rose-200',
  },
}

export function normalizeRiskLabel(label: string): RiskLabel {
  if (label === 'MEDIUM' || label === 'HIGH') {
    return label
  }
  return 'LOW'
}
