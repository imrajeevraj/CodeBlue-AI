import AnimatedNumber from './ui/AnimatedNumber'
import { RISK_META, normalizeRiskLabel } from '../lib/risk'

interface ScoreRingProps {
  score: number
  label: 'LOW' | 'MEDIUM' | 'HIGH'
  size?: number
  probability?: number
}

export default function ScoreRing({
  score,
  label,
  size = 196,
  probability,
}: ScoreRingProps) {
  const normalized = normalizeRiskLabel(label)
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = RISK_META[normalized].solid

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-[22%] rounded-full blur-2xl"
        style={{ background: RISK_META[normalized].soft }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`score-${normalized}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="55%" stopColor={color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#score-${normalized})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease, stroke 0.8s ease',
            filter: `drop-shadow(0 0 14px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-[13%] rounded-full border border-white/10 bg-slate-950/70 backdrop-blur-xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Risk Score
        </span>
        <span className="mt-2 text-5xl font-semibold text-white">
          <AnimatedNumber value={score} />
        </span>
        <span className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
          {normalized} risk
        </span>
        {typeof probability === 'number' ? (
          <span className="mt-2 text-sm text-slate-300">
            <AnimatedNumber value={probability * 100} decimals={1} suffix="%" /> probability
          </span>
        ) : null}
      </div>
    </div>
  )
}
