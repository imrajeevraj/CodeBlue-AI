import { Sparkles, X } from 'lucide-react'
import type { PredictFileRowResult } from '../../types'
import DriverList from '../DriverList'
import ScoreRing from '../ScoreRing'
import RiskBadge from '../RiskBadge'
import Card from '../ui/Card'
import { formatFeatureName } from '../../lib/ui'

export default function BatchRowModal({
  row,
  onClose,
}: {
  row: PredictFileRowResult
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_35px_100px_rgba(2,6,23,0.55)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/[0.08] bg-white/[0.04] p-2 text-slate-300 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Row Details
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Uploaded row #{row.row_index}</h3>
            <p className="mt-2 text-sm text-slate-400">
              Full input payload, risk score, top drivers, and summary for the selected uploaded record.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge label={row.label} />
            <span className="text-sm text-slate-400">{row.score}/100</span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex justify-center">
            <ScoreRing score={row.score} label={row.label} probability={row.probability} size={180} />
          </div>

          <div className="space-y-4">
            <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(row.input).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-white/[0.06] bg-slate-950/45 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {formatFeatureName(key)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">{String(value)}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-sky-300" />
                Explanation Summary
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{row.summary}</p>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <DriverList drivers={row.top_drivers} />
        </div>
      </div>
    </div>
  )
}
