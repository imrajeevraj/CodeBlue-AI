import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Cpu,
  FlaskConical,
  GitCompare,
  Layers,
  XCircle,
} from 'lucide-react'
import { api } from '../api'
import type { ModelStatusResponse } from '../types'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'
import { buttonStyles } from '../components/ui/Button'

export default function Home() {
  const [status, setStatus] = useState<ModelStatusResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.modelStatus().then(setStatus).catch((e) => setError(String(e)))
  }, [])

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] px-6 py-14 shadow-[0_35px_100px_rgba(2,6,23,0.45)] sm:px-10">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/[0.15] bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
            <Activity className="h-3.5 w-3.5" />
            Live Clinical Intelligence
          </div>
          <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            <span className="animate-gradient-shift bg-[linear-gradient(120deg,#e0f2fe_5%,#7dd3fc_30%,#f8fafc_50%,#38bdf8_70%,#bae6fd_95%)] bg-[length:200%_100%] bg-clip-text text-transparent">
              CodeBlue AI
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300/90 sm:text-xl">
            Real-time sepsis risk prediction with interpretable drivers and instant treatment simulations.
            Transparent scoring clinicians can trust at a glance.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/model-lab" className={buttonStyles({ variant: 'primary', size: 'lg' })}>
              <FlaskConical className="h-4 w-4" />
              Open Model Lab
            </Link>
            <Link to="/what-if" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              <GitCompare className="h-4 w-4" />
              Run What-If Simulation
            </Link>
          </div>
        </div>
      </section>

      <Card accent="cyan" interactive className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
              <Cpu className="h-4 w-4 text-sky-300" />
              Model Status
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Live model health, deployment metadata, and explainability coverage.
            </p>
          </div>
          {status?.loaded ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              Loaded
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-sm text-rose-300">
            <XCircle className="h-4 w-4" />
            Failed to connect: {error}
          </div>
        ) : null}

        {status ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
              label="Status"
              value={status.loaded ? 'Loaded' : 'Error'}
              accent="emerald"
            />
            <Stat
              icon={<Layers className="h-5 w-5 text-sky-300" />}
              label="Version"
              value={status.version}
              accent="blue"
            />
            <Stat
              icon={<Activity className="h-5 w-5 text-cyan-300" />}
              label="Features"
              value={String(status.feature_count)}
              accent="cyan"
            />
            <Stat
              icon={<Crosshair className="h-5 w-5 text-amber-300" />}
              label="Threshold"
              value={status.threshold.toFixed(2)}
              accent="amber"
            />
          </div>
        ) : null}

        {!status && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="mt-4 h-3 w-20" />
                <Skeleton className="mt-2 h-5 w-24" />
              </Card>
            ))}
          </div>
        ) : null}
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <QuickLink
          to="/model-lab"
          icon={<FlaskConical className="h-6 w-6 text-sky-300" />}
          title="Model Lab"
          desc="Enter patient vitals and labs to get a real-time sepsis risk prediction with interpretable driver analysis."
          benefit="Instant clinical risk prediction"
          accent="blue"
        />
        <QuickLink
          to="/what-if"
          icon={<GitCompare className="h-6 w-6 text-cyan-300" />}
          title="What-If Simulator"
          desc="Adjust clinical inputs and instantly compare before, after, and delta impact on patient risk."
          benefit="Simulate treatment impact in seconds"
          accent="cyan"
        />
      </section>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode
  label: string
  value: string
  accent: 'blue' | 'cyan' | 'emerald' | 'amber'
}) {
  return (
    <Card accent={accent} className="rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-slate-950/60">
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      </div>
    </Card>
  )
}

function QuickLink({
  to,
  icon,
  title,
  desc,
  benefit,
  accent,
}: {
  to: string
  icon: ReactNode
  title: string
  desc: string
  benefit: string
  accent: 'blue' | 'cyan'
}) {
  return (
    <Link to={to} className="group block">
      <Card accent={accent} interactive className="h-full p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55 transition duration-300 group-hover:scale-105 group-hover:rotate-3">
          {icon}
        </div>
        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm font-medium text-sky-200/80">{benefit}</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:border-white/[0.16] group-hover:text-white">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-400">{desc}</p>
      </Card>
    </Link>
  )
}
