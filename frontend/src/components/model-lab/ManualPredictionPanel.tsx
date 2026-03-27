import { ActivitySquare, Clock3, FlaskConical, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PredictRequest, PredictResponse } from '../../types'
import DriverList from '../DriverList'
import RiskBadge from '../RiskBadge'
import ScoreRing from '../ScoreRing'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Skeleton from '../ui/Skeleton'

export default function ManualPredictionPanel({
  result,
  loading,
  error,
  normalizedLabel,
  summaryTokens,
  inputs,
  resultTimestamp,
}: {
  result: PredictResponse | null
  loading: boolean
  error: string
  normalizedLabel: 'LOW' | 'MEDIUM' | 'HIGH'
  summaryTokens: ReactNode[] | undefined
  inputs: PredictRequest
  resultTimestamp: string | null
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Prediction Result
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Live inference summary</h2>
          <p className="mt-2 text-sm text-slate-400">
            The highest-signal risk story stays visible here as soon as the model responds.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-slate-300">
            <ActivitySquare className="h-3.5 w-3.5 text-cyan-300" />
            Live Inference
          </div>
          {result ? <RiskBadge label={result.label} /> : null}
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

      {!result && !error && !loading ? (
        <div className="my-auto flex min-h-[360px] flex-col items-center justify-center text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
            <FlaskConical className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-white">Ready for a prediction</h3>
          <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">
            Load a sample or fine-tune values on the left, then run the model to reveal the risk score and explanation.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 space-y-5">
          <div className="flex justify-center">
            <Skeleton className="h-52 w-52 rounded-full" />
          </div>
          <Skeleton className="mx-auto h-8 w-36" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-28 w-full rounded-[24px]" />
          <Skeleton className="h-44 w-full rounded-[24px]" />
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-5 animate-rise">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span className="rounded-full border border-white/[0.08] bg-slate-950/55 px-3 py-1.5">
              Prediction ready
            </span>
            {resultTimestamp ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-slate-950/55 px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                {resultTimestamp}
              </span>
            ) : null}
          </div>

          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <div className="flex justify-center">
              <ScoreRing
                score={result.score}
                label={result.label}
                probability={result.probability}
              />
            </div>
            <div className="space-y-4">
              <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Risk Score
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Score, probability, and threshold aligned for a quick demo readout.
                    </p>
                  </div>
                  <RiskBadge label={result.label} size="sm" />
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                      <span>Risk score</span>
                      <span>{result.score}/100</span>
                    </div>
                    <ProgressBar
                      value={result.score}
                      tone={
                        normalizedLabel === 'HIGH'
                          ? 'rose'
                          : normalizedLabel === 'MEDIUM'
                            ? 'amber'
                            : 'emerald'
                      }
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                      <span>Alert threshold</span>
                      <span>{(result.threshold * 100).toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={result.threshold * 100} tone="cyan" />
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Score" value={`${result.score}/100`} />
                <MetricCard label="Probability" value={`${(result.probability * 100).toFixed(1)}%`} />
                <MetricCard label="Threshold" value={`${(result.threshold * 100).toFixed(0)}%`} />
                <MetricCard label="Features used" value={String(result.feature_count)} />
              </div>
            </div>
          </div>

          <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ActivitySquare className="h-4 w-4 text-cyan-300" />
              Input Snapshot
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Heart Rate', `${inputs.HR} bpm`],
                ['MAP', `${inputs.MAP} mmHg`],
                ['Temperature', `${inputs.Temp} deg C`],
                ['Respiratory Rate', `${inputs.Resp} br/min`],
                ['SpO2', `${inputs.O2Sat}%`],
                ['Lactate', `${inputs.Lactate} mmol/L`],
                ['WBC Count', `${inputs.WBC}`],
                ['Creatinine', `${inputs.Creatinine} mg/dL`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-white/[0.07] bg-slate-950/50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Explanation Summary
            </div>
            <p className="mt-4 text-sm leading-8 text-slate-300">{summaryTokens}</p>
          </Card>

          <DriverList drivers={result.top_drivers} title="Top Risk Drivers" />
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/[0.07] bg-slate-950/45 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}
