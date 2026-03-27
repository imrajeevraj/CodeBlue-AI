import { Clock3, Download, FileSpreadsheet, Sparkles } from 'lucide-react'
import type { PredictFileResponse, PredictFileRowResult } from '../../types'
import RiskBadge from '../RiskBadge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { formatFeatureName } from '../../lib/ui'

export default function BatchResultsPanel({
  batchResult,
  batchLoading,
  highRiskCount,
  resultTimestamp,
  onDownloadJson,
  onSelectRow,
}: {
  batchResult: PredictFileResponse | null
  batchLoading: boolean
  highRiskCount: number
  resultTimestamp: string | null
  onDownloadJson: () => void
  onSelectRow: (row: PredictFileRowResult) => void
}) {
  return (
    <Card accent="cyan" className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Batch Output
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Batch prediction result</h2>
          <p className="mt-2 text-sm text-slate-400">
            Keep the summary counts and first-pass triage visible while the full row table sits just below.
          </p>
        </div>
        {batchResult ? (
          <div className="flex flex-col items-end gap-2">
            {resultTimestamp ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-slate-300">
                <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                {resultTimestamp}
              </div>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={onDownloadJson}
            >
              Download JSON
            </Button>
          </div>
        ) : null}
      </div>

      {!batchResult && !batchLoading ? (
        <div className="my-auto mt-8 flex min-h-[360px] flex-col items-center justify-center text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
            <FileSpreadsheet className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-white">Batch inference ready</h3>
          <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">
            Drop in a CSV or PSV file, preview the rows, then run the live model to populate the batch table.
          </p>
        </div>
      ) : null}

      {batchLoading ? (
        <div className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-[24px]" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-[24px]" />
        </div>
      ) : null}

      {batchResult ? (
        <div className="mt-6 space-y-6 animate-rise">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span className="rounded-full border border-white/[0.08] bg-slate-950/55 px-3 py-1.5">
              Results ready
            </span>
            <span className="rounded-full border border-cyan-300/[0.14] bg-cyan-300/[0.08] px-3 py-1.5 text-cyan-100">
              {batchResult.filename}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <BatchSummaryCard label="Total Rows" value={String(batchResult.total_rows)} accent="cyan" />
            <BatchSummaryCard label="Processed" value={String(batchResult.processed_rows)} accent="emerald" />
            <BatchSummaryCard label="Failed" value={String(batchResult.failed_rows)} accent="rose" />
            <BatchSummaryCard label="High Risk" value={String(highRiskCount)} accent="amber" />
          </div>

          {batchResult.failed_rows > 0 ? (
            <Card accent="amber" className="rounded-[24px] border-amber-300/[0.14] bg-amber-300/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <Sparkles className="h-4 w-4" />
                Some rows were skipped
              </div>
              <div className="mt-3 space-y-2 text-sm text-amber-50/90">
                {batchResult.errors.map((entry) => (
                  <div key={`${entry.row_index}-${entry.message}`} className="rounded-2xl border border-amber-200/[0.12] bg-black/10 px-3 py-2">
                    Row {entry.row_index}: {entry.message}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-slate-950/45 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Row</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Label</th>
                    <th className="px-4 py-3 font-medium">Top Driver</th>
                    <th className="px-4 py-3 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResult.results.map((entry) => (
                    <tr
                      key={entry.row_index}
                      onClick={() => onSelectRow(entry)}
                      className="cursor-pointer border-b border-white/[0.04] text-slate-300 transition hover:bg-white/[0.04] last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-white">#{entry.row_index}</td>
                      <td className="px-4 py-3">{entry.score}</td>
                      <td className="px-4 py-3">
                        <RiskBadge label={entry.label} size="sm" glow={false} />
                      </td>
                      <td className="px-4 py-3">
                        {entry.top_drivers[0] ? formatFeatureName(entry.top_drivers[0].feature) : 'No driver'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{entry.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function BatchSummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'cyan' | 'emerald' | 'rose' | 'amber'
}) {
  const accentClasses = {
    cyan: 'text-cyan-200 border-cyan-300/[0.14] bg-cyan-300/[0.06]',
    emerald: 'text-emerald-200 border-emerald-300/[0.14] bg-emerald-300/[0.06]',
    rose: 'text-rose-200 border-rose-300/[0.14] bg-rose-300/[0.06]',
    amber: 'text-amber-100 border-amber-300/[0.14] bg-amber-300/[0.06]',
  }

  return (
    <div className={`rounded-[24px] border p-4 ${accentClasses[accent]}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-current/70">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}
