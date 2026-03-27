import { RotateCcw, Sparkles } from 'lucide-react'
import type { PredictRequest, PresetInfo } from '../types'
import {
  DEFAULT_PREDICT_VALUES,
  DEMOGRAPHIC_FIELDS,
  LAB_FIELDS,
  VITAL_FIELDS,
  type PatientFieldDef,
} from '../constants/patientFields'
import Button from './ui/Button'
import Card from './ui/Card'
import { cn } from '../lib/ui'

interface InputFormProps {
  values: PredictRequest
  onChange: (field: keyof PredictRequest, value: number | string) => void
  onSubmit: () => void
  onReset?: () => void
  presets?: PresetInfo[]
  onPresetSelect?: (presetKey: string) => void
  loading?: boolean
  submitLabel?: string
}

function FieldGroup({
  title,
  fields,
  values,
  onChange,
}: {
  title: string
  fields: PatientFieldDef[]
  values: PredictRequest
  onChange: InputFormProps['onChange']
}) {
  return (
    <Card accent="none" className="rounded-[24px] border-white/[0.06] bg-white/[0.025] p-4">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-sm text-slate-400">Adjust clinical inputs with quick sliders and exact values.</p>
      </div>
      <div className="space-y-3">
        {fields.map((field) => (
          <RangeField
            key={field.key}
            field={field}
            value={Number(values[field.key])}
            onChange={(nextValue) => onChange(field.key, nextValue)}
          />
        ))}
      </div>
    </Card>
  )
}

function RangeField({
  field,
  value,
  onChange,
}: {
  field: PatientFieldDef
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/45 p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <label className="text-sm font-medium text-slate-100">{field.label}</label>
          <p className="text-xs text-slate-500">{field.description}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-right">
          <div className="text-sm font-semibold text-white">{value.toFixed(field.step < 1 ? 1 : 0)}</div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{field.unit}</div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_112px] md:items-center">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={cn(
            'range-input w-full accent-sky-400',
            field.accent === 'emerald' && 'accent-emerald-400',
            field.accent === 'amber' && 'accent-amber-400',
            field.accent === 'rose' && 'accent-rose-400',
            field.accent === 'cyan' && 'accent-cyan-400',
          )}
        />
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="input-surface w-full text-right"
        />
      </div>
    </div>
  )
}

export default function InputForm({
  values,
  onChange,
  onSubmit,
  onReset,
  presets = [],
  onPresetSelect,
  loading,
  submitLabel = 'Run Prediction',
}: InputFormProps) {
  return (
    <div className="space-y-5">
      <Card accent="blue" className="rounded-[24px] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/80">
              Sample Loader
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Start from a clinically realistic profile, then fine-tune values.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-56">
              <span className="sr-only">Load Sample</span>
              <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300" />
              <select
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return
                  onPresetSelect?.(e.target.value)
                  e.target.value = ''
                }}
                className="input-surface w-full appearance-none pl-10 pr-9"
              >
                <option value="">Load Sample</option>
                {presets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="secondary"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={onReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card accent="amber" className="rounded-[24px] p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Demographics</h4>
            <p className="text-sm text-slate-400">Patient context fields that frame the prediction.</p>
          </div>
          <div className="flex rounded-2xl border border-white/[0.08] bg-slate-950/55 p-1">
            {['M', 'F'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => onChange('Gender', gender)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  values.Gender === gender
                    ? 'bg-white/[0.12] text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {gender === 'M' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {DEMOGRAPHIC_FIELDS.map((field) => (
            <RangeField
              key={field.key}
              field={field}
              value={Number(values[field.key] ?? DEFAULT_PREDICT_VALUES[field.key])}
              onChange={(nextValue) => onChange(field.key, nextValue)}
            />
          ))}
        </div>
      </Card>

      <FieldGroup title="Vitals" fields={VITAL_FIELDS} values={values} onChange={onChange} />
      <FieldGroup title="Labs" fields={LAB_FIELDS} values={values} onChange={onChange} />

      <div className="sticky bottom-4 z-10 mt-2">
        <Button type="button" onClick={onSubmit} loading={loading} size="lg" className="w-full">
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
