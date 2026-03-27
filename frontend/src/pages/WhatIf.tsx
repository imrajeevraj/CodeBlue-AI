import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  ChevronsRight,
  GitCompare,
  RefreshCcw,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { api } from '../api'
import type { PredictRequest, PresetInfo, WhatIfResponse } from '../types'
import ScoreRing from '../components/ScoreRing'
import RiskBadge from '../components/RiskBadge'
import DriverList from '../components/DriverList'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import Skeleton from '../components/ui/Skeleton'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import { useToast } from '../components/ui/ToastProvider'
import { ALL_NUMERIC_FIELDS, DEFAULT_PREDICT_VALUES } from '../constants/patientFields'
import { normalizeRiskLabel } from '../lib/risk'
import { cn } from '../lib/ui'

export default function WhatIf() {
  const [baseline, setBaseline] = useState<PredictRequest>({ ...DEFAULT_PREDICT_VALUES })
  const [overrides, setOverrides] = useState<Record<string, number | string>>({})
  const [result, setResult] = useState<WhatIfResponse | null>(null)
  const [presets, setPresets] = useState<PresetInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resultPanelRef = useRef<HTMLDivElement | null>(null)
  const lastResultRef = useRef<WhatIfResponse | null>(null)
  const toast = useToast()

  useEffect(() => {
    api.presets().then(setPresets).catch(() => {})
  }, [])

  const scrollToResults = useCallback(() => {
    const element = resultPanelRef.current
    if (!element) return

    window.setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        element.focus({ preventScroll: true })
      }, 220)
    }, 80)
  }, [])

  useEffect(() => {
    if (result && result !== lastResultRef.current) {
      scrollToResults()
    }
    lastResultRef.current = result
  }, [result, scrollToResults])

  const runWhatIf = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const nextResult = await api.whatIf({ baseline, overrides })
      setResult(nextResult)
      toast.success(
        'Simulation updated',
        `${nextResult.baseline_label} to ${nextResult.updated_label} transition ready.`,
      )
    } catch (err) {
      setError(String(err))
      toast.error('Simulation failed', 'Please verify the backend and try again.')
    } finally {
      setLoading(false)
    }
  }, [baseline, overrides, toast])

  const applyPreset = useCallback((preset: PresetInfo) => {
    const next = { ...DEFAULT_PREDICT_VALUES }
    for (const [key, value] of Object.entries(preset.inputs)) {
      if (key in next) {
        ;(next as Record<string, number | string>)[key] = value
      }
    }
    setBaseline(next as PredictRequest)
    setOverrides({})
    setResult(null)
  }, [])

  const resetAll = useCallback(() => {
    setBaseline({ ...DEFAULT_PREDICT_VALUES })
    setOverrides({})
    setResult(null)
  }, [])

  const updateBaseline = useCallback((key: string, value: number | string) => {
    setBaseline((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateOverride = useCallback((key: string, value: number) => {
    setOverrides((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleOverride = useCallback(
    (key: string, enabled: boolean) => {
      setOverrides((prev) => {
        if (enabled) {
          return { ...prev, [key]: Number(baseline[key as keyof PredictRequest]) }
        }

        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    [baseline],
  )

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card accent="violet" className="p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-300/[0.12] bg-cyan-400/10">
              <GitCompare className="h-7 w-7 text-cyan-200" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                What-If Simulator
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
                Make the model feel like magic without changing the science.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Compare baseline and override scenarios, spotlight the delta, and show exactly which clinical changes moved the score.
              </p>
            </div>
          </div>
        </Card>

        <Card accent="cyan" className="p-7">
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Workflow
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Baseline in, impact out.</h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">Baseline</span>
              <ChevronsRight className="h-4 w-4 text-cyan-300" />
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">Overrides</span>
              <ChevronsRight className="h-4 w-4 text-cyan-300" />
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">Compare</span>
            </div>
          </div>
        </Card>
      </section>

      {presets.length > 0 ? (
        <Card accent="cyan" className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Baseline Samples
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Load a realistic patient profile to stage the before-and-after story quickly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    applyPreset(preset)
                    toast.info('Baseline loaded', preset.label)
                  }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/[0.18] hover:bg-white/[0.08] hover:text-white"
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="space-y-6">
          <Card accent="blue" className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Baseline
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">Patient State</h2>
              </div>
              <div className="flex rounded-2xl border border-white/[0.08] bg-slate-950/55 p-1">
                {['M', 'F'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => updateBaseline('Gender', gender)}
                    className={cn(
                      'rounded-xl px-4 py-2 text-sm font-medium transition',
                      baseline.Gender === gender
                        ? 'bg-white/[0.12] text-white'
                        : 'text-slate-400 hover:text-white',
                    )}
                  >
                    {gender === 'M' ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {ALL_NUMERIC_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="rounded-[22px] border border-white/[0.07] bg-slate-950/45 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-100">{field.label}</label>
                      <p className="text-xs text-slate-500">{field.description}</p>
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      {field.unit}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_112px] md:items-center">
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={Number(baseline[field.key])}
                      onChange={(e) => updateBaseline(field.key, parseFloat(e.target.value) || 0)}
                      className="range-input w-full accent-sky-400"
                      title={`${field.label} baseline`}
                    />
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={baseline[field.key]}
                      onChange={(e) => updateBaseline(field.key, parseFloat(e.target.value) || 0)}
                      className="input-surface w-full text-right"
                      title={`${field.label} value`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card accent="violet" className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Overrides
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">Scenario Changes</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Toggle each field between baseline and override value to stage the intervention.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                onClick={resetAll}
              >
                Reset
              </Button>
            </div>
            <div className="space-y-3">
              {ALL_NUMERIC_FIELDS.map((field) => {
                const hasOverride = field.key in overrides
                const overrideValue = hasOverride
                  ? Number(overrides[field.key])
                  : Number(baseline[field.key])

                return (
                  <div
                    key={field.key}
                    className={cn(
                      'rounded-[22px] border p-4 transition',
                      hasOverride
                        ? 'border-cyan-300/[0.18] bg-cyan-400/[0.06] shadow-[0_18px_40px_rgba(34,211,238,0.08)]'
                        : 'border-white/[0.07] bg-slate-950/45',
                    )}
                  >
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{field.label}</p>
                        <p className="text-xs text-slate-500">
                          Baseline {Number(baseline[field.key]).toFixed(field.step < 1 ? 1 : 0)} {field.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-950/55 p-1">
                        <button
                          type="button"
                          onClick={() => toggleOverride(field.key, false)}
                          className={cn(
                            'rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition',
                            !hasOverride ? 'bg-white/[0.12] text-white' : 'text-slate-500 hover:text-white',
                          )}
                        >
                          Use baseline
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleOverride(field.key, true)}
                          className={cn(
                            'rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition',
                            hasOverride ? 'bg-cyan-400/[0.14] text-cyan-100' : 'text-slate-500 hover:text-white',
                          )}
                        >
                          Override value
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_112px] md:items-center">
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={overrideValue}
                        disabled={!hasOverride}
                        onChange={(e) => updateOverride(field.key, parseFloat(e.target.value) || 0)}
                        className="range-input w-full accent-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                        title={`${field.label} override`}
                      />
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        disabled={!hasOverride}
                        value={hasOverride ? overrides[field.key] : ''}
                        placeholder={String(baseline[field.key])}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === '') {
                            toggleOverride(field.key, false)
                            return
                          }
                          updateOverride(field.key, parseFloat(raw) || 0)
                        }}
                        className="input-surface w-full text-right disabled:opacity-40"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="sticky bottom-4 mt-6">
              <Button
                type="button"
                onClick={runWhatIf}
                loading={loading}
                disabled={Object.keys(overrides).length === 0}
                size="lg"
                className="w-full"
                leftIcon={<WandSparkles className="h-4 w-4" />}
              >
                Simulate Impact
              </Button>
            </div>
          </Card>
        </div>

        <div
          ref={resultPanelRef}
          tabIndex={-1}
          className="scroll-mt-28 outline-none xl:sticky xl:top-24 xl:self-start"
        >
          <Card accent="cyan" className="p-5 sm:p-6">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Comparison
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Before, After, Change</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Show the impact clearly, with risk labels and changed inputs spotlighted.
                </p>
              </div>
            </div>

            {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

            {!result && !loading && !error ? (
              <div className="my-auto flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                  <GitCompare className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">Ready to simulate</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">
                  Turn on a few overrides and run the simulation to see the delta card, changed features, and driver comparison.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="mt-8 space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-48 rounded-[24px]" />
                  ))}
                </div>
                <Skeleton className="h-16 w-full rounded-[24px]" />
                <Skeleton className="h-28 w-full rounded-[24px]" />
                <Skeleton className="h-48 w-full rounded-[24px]" />
              </div>
            ) : null}

            {result ? (
              <div className="mt-8 space-y-6 animate-rise">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                  <ComparisonCard
                    title="Before"
                    score={result.baseline_score}
                    probability={result.baseline_probability}
                    label={result.baseline_label}
                  />
                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.16)]">
                      <ArrowRight className="h-5 w-5 animate-pulse" />
                    </div>
                  </div>
                  <ComparisonCard
                    title="After"
                    score={result.updated_score}
                    probability={result.updated_probability}
                    label={result.updated_label}
                  />
                  <ChangeCard result={result} />
                </div>

                {result.changed_features.length > 0 ? (
                  <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sparkles className="h-4 w-4 text-cyan-300" />
                      Changed Features
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.changed_features.map((changedFeature) => (
                        <span
                          key={changedFeature.name}
                          className="rounded-2xl border border-cyan-300/[0.14] bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100"
                        >
                          <span className="font-medium">{changedFeature.name}</span>: {changedFeature.old} to{' '}
                          {changedFeature.new}
                        </span>
                      ))}
                    </div>
                  </Card>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-2">
                  <DriverList drivers={result.baseline_drivers} title="Baseline Drivers" />
                  <DriverList drivers={result.updated_drivers} title="Updated Drivers" />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <SummaryCard title="Baseline Summary" text={result.baseline_summary} />
                  <SummaryCard title="Updated Summary" text={result.updated_summary} />
                </div>
              </div>
            ) : null}
          </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ComparisonCard({
  title,
  score,
  probability,
  label,
}: {
  title: string
  score: number
  probability: number
  label: string
}) {
  const tone = normalizeRiskLabel(label)

  return (
    <Card
      accent={tone === 'HIGH' ? 'rose' : tone === 'MEDIUM' ? 'amber' : 'emerald'}
      className="rounded-[24px] border-white/[0.07] bg-white/[0.03] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <div className="mt-4 flex justify-center">
        <ScoreRing score={score} label={tone} size={164} probability={probability} />
      </div>
      <div className="mt-4 flex justify-center">
        <RiskBadge label={label} size="sm" />
      </div>
    </Card>
  )
}

function ChangeCard({ result }: { result: WhatIfResponse }) {
  const percentChange =
    result.baseline_score === 0 ? 0 : (result.delta / result.baseline_score) * 100

  return (
    <Card
      accent={result.delta > 0 ? 'rose' : result.delta < 0 ? 'emerald' : 'cyan'}
      className="rounded-[24px] border-white/[0.07] bg-white/[0.03] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Change</p>
      <div className="mt-4 text-center">
        <p
          className={cn(
            'text-5xl font-semibold',
            result.delta > 0
              ? 'text-rose-200'
              : result.delta < 0
                ? 'text-emerald-200'
                : 'text-slate-100',
          )}
        >
          {result.delta > 0 ? '+' : ''}
          <AnimatedNumber value={result.delta} />
        </p>
        <p className="mt-2 text-sm text-slate-400">points</p>
      </div>
      <div className="mt-5 rounded-[20px] border border-white/[0.07] bg-slate-950/45 p-4">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Percentage change</span>
          <span>
            {percentChange > 0 ? '+' : ''}
            <AnimatedNumber value={percentChange} decimals={1} suffix="%" />
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar
            value={Math.min(Math.abs(percentChange), 100)}
            tone={result.delta > 0 ? 'rose' : result.delta < 0 ? 'emerald' : 'cyan'}
          />
        </div>
      </div>
    </Card>
  )
}

function SummaryCard({ title, text }: { title: string; text: string }) {
  return (
    <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
    </Card>
  )
}
