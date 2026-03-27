import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlaskConical, Upload } from 'lucide-react'
import { ApiError, api } from '../api'
import type {
  PredictFileResponse,
  PredictFileRowResult,
  PredictFileUploadErrorResponse,
  PredictRequest,
  PredictResponse,
  PresetInfo,
} from '../types'
import InputForm from '../components/InputForm'
import Card from '../components/ui/Card'
import { useToast } from '../components/ui/ToastProvider'
import { DEFAULT_PREDICT_VALUES } from '../constants/patientFields'
import { normalizeRiskLabel } from '../lib/risk'
import { cn } from '../lib/ui'
import BatchResultsPanel from '../components/model-lab/BatchResultsPanel'
import BatchRowModal from '../components/model-lab/BatchRowModal'
import BatchUploadPanel from '../components/model-lab/BatchUploadPanel'
import ManualPredictionPanel from '../components/model-lab/ManualPredictionPanel'
import { buildPreview, inferFileFormat, type FilePreview } from '../components/model-lab/modelLabUtils'

type ModelLabMode = 'manual' | 'file'

export default function ModelLab() {
  const [mode, setMode] = useState<ModelLabMode>('manual')
  const [values, setValues] = useState<PredictRequest>({ ...DEFAULT_PREDICT_VALUES })
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [predictionSnapshot, setPredictionSnapshot] = useState<PredictRequest | null>(null)
  const [predictionTimestamp, setPredictionTimestamp] = useState<string | null>(null)
  const [presets, setPresets] = useState<PresetInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [batchFile, setBatchFile] = useState<File | null>(null)
  const [batchPreview, setBatchPreview] = useState<FilePreview | null>(null)
  const [batchResult, setBatchResult] = useState<PredictFileResponse | null>(null)
  const [batchResultTimestamp, setBatchResultTimestamp] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState<PredictFileUploadErrorResponse | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedRow, setSelectedRow] = useState<PredictFileRowResult | null>(null)

  const manualResultRef = useRef<HTMLDivElement | null>(null)
  const batchResultRef = useRef<HTMLDivElement | null>(null)
  const lastManualResultRef = useRef<PredictResponse | null>(null)
  const lastBatchResultRef = useRef<PredictFileResponse | null>(null)
  const toast = useToast()

  useEffect(() => {
    api.presets().then(setPresets).catch(() => {})
  }, [])

  const handleChange = useCallback(
    (field: keyof PredictRequest, value: number | string) =>
      setValues((prev) => ({ ...prev, [field]: value })),
    [],
  )

  const scrollToResult = useCallback((element: HTMLDivElement | null) => {
    if (!element) return

    window.setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        element.focus({ preventScroll: true })
      }, 220)
    }, 80)
  }, [])

  useEffect(() => {
    if (result && result !== lastManualResultRef.current) {
      scrollToResult(manualResultRef.current)
    }
    lastManualResultRef.current = result
  }, [result, scrollToResult])

  useEffect(() => {
    if (batchResult && batchResult !== lastBatchResultRef.current) {
      scrollToResult(batchResultRef.current)
    }
    lastBatchResultRef.current = batchResult
  }, [batchResult, scrollToResult])

  const runPrediction = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const nextResult = await api.predict(values)
      setResult(nextResult)
      setPredictionSnapshot({ ...values })
      setPredictionTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      toast.success('Prediction completed', `${nextResult.label} risk profile ready for review.`)
    } catch (err) {
      setError(String(err))
      toast.error('Prediction failed', 'Please check the backend connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [toast, values])

  const applyPreset = useCallback((preset: PresetInfo) => {
    const next = { ...DEFAULT_PREDICT_VALUES }
    for (const [key, value] of Object.entries(preset.inputs)) {
      if (key in next) {
        ;(next as Record<string, number | string>)[key] = value
      }
    }
    setValues(next as PredictRequest)
    setResult(null)
    setPredictionSnapshot(null)
    setPredictionTimestamp(null)
  }, [])

  const handlePresetSelect = useCallback(
    (presetKey: string) => {
      const preset = presets.find((entry) => entry.key === presetKey)
      if (preset) {
        applyPreset(preset)
        toast.info('Sample loaded', preset.label)
      }
    },
    [applyPreset, presets, toast],
  )

  const resetValues = useCallback(() => {
    setValues({ ...DEFAULT_PREDICT_VALUES })
    setResult(null)
    setPredictionSnapshot(null)
    setPredictionTimestamp(null)
  }, [])

  const handleBatchFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      const format = inferFileFormat(file.name)
      if (!format) {
        setBatchError({ error: 'Only .csv and .psv files are supported.' })
        toast.error('Unsupported file', 'Please upload a CSV or PSV file.')
        return
      }

      setBatchFile(file)
      setBatchResult(null)
      setBatchError(null)

      try {
        setBatchPreview(await buildPreview(file, format))
      } catch (err) {
        setBatchPreview(null)
        setBatchError({ error: err instanceof Error ? err.message : String(err) })
      }
    },
    [toast],
  )

  const runBatchPrediction = useCallback(async () => {
    if (!batchFile) return
    setBatchLoading(true)
    setBatchError(null)
    try {
      const nextResult = await api.predictFile(batchFile)
      setBatchResult(nextResult)
      setBatchResultTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setSelectedRow(nextResult.results[0] ?? null)
      toast.success(
        'Batch prediction completed',
        `${nextResult.processed_rows} rows processed from ${nextResult.filename}.`,
      )
    } catch (err) {
      if (err instanceof ApiError && typeof err.details === 'object' && err.details !== null) {
        setBatchError(err.details as PredictFileUploadErrorResponse)
      } else {
        setBatchError({
          error: err instanceof Error ? err.message : String(err),
        })
      }
      toast.error('Batch prediction failed', 'Please check the file schema and try again.')
    } finally {
      setBatchLoading(false)
    }
  }, [batchFile, toast])

  const clearBatchFile = useCallback(() => {
    setBatchFile(null)
    setBatchPreview(null)
    setBatchResult(null)
    setBatchResultTimestamp(null)
    setBatchError(null)
    setSelectedRow(null)
  }, [])

  const downloadBatchJson = useCallback(() => {
    if (!batchResult) return
    const blob = new Blob([JSON.stringify(batchResult, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${batchResult.filename.replace(/\.[^.]+$/, '')}-results.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [batchResult])

  const normalizedLabel = result ? normalizeRiskLabel(result.label) : 'LOW'
  const summaryTokens = result?.summary.split(/(\s+)/).map((token, index) => {
    const cleaned = token.replace(/[^a-zA-Z]/g, '').toLowerCase()
    const highlightTerms = ['risk', 'lactate', 'pressure', 'heart', 'respiratory', 'oxygen', 'creatinine', 'wbc']
    const shouldHighlight = cleaned === normalizedLabel.toLowerCase() || highlightTerms.includes(cleaned)
    return shouldHighlight ? (
      <span key={`${token}-${index}`} className="rounded-md bg-white/[0.08] px-1 py-0.5 font-medium text-white">
        {token}
      </span>
    ) : (
      <span key={`${token}-${index}`}>{token}</span>
    )
  })

  const batchHighRiskCount = useMemo(
    () => batchResult?.results.filter((entry) => entry.label === 'HIGH').length ?? 0,
    [batchResult],
  )

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
        {/* ── Left column: header + mode switch + input ── */}
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/[0.12] bg-sky-400/10">
              <FlaskConical className="h-6 w-6 text-sky-200" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Model Lab</h1>
              <p className="text-sm text-slate-400">
                Single-patient or batch inference
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 rounded-[20px] border border-white/[0.06] bg-slate-950/50 p-1.5">
            {[
              { key: 'manual' as const, label: 'Manual Input', icon: FlaskConical },
              { key: 'file' as const, label: 'File Upload', icon: Upload },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-2 rounded-[16px] px-4 py-2.5 text-sm font-medium transition',
                  mode === key
                    ? 'bg-white/[0.12] text-white shadow-[0_10px_24px_rgba(15,23,42,0.32)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {mode === 'manual' ? (
            <Card accent="blue" className="p-5 sm:p-6">
              <InputForm
                values={values}
                onChange={handleChange}
                onSubmit={runPrediction}
                onReset={resetValues}
                presets={presets}
                onPresetSelect={handlePresetSelect}
                loading={loading}
              />
            </Card>
          ) : (
            <BatchUploadPanel
              batchFile={batchFile}
              batchPreview={batchPreview}
              batchResult={batchResult}
              batchLoading={batchLoading}
              batchError={batchError}
              dragActive={dragActive}
              setDragActive={setDragActive}
              onFilePick={handleBatchFile}
              onRun={runBatchPrediction}
              onClear={clearBatchFile}
            />
          )}
        </div>

        {/* ── Right column: sticky result panel ── */}
        {mode === 'manual' ? (
          <div
            ref={manualResultRef}
            tabIndex={-1}
            className="scroll-mt-28 outline-none xl:sticky xl:top-24 xl:self-start"
          >
            <Card
              accent={
                result
                  ? normalizedLabel === 'HIGH'
                    ? 'rose'
                    : normalizedLabel === 'MEDIUM'
                      ? 'amber'
                      : 'emerald'
                  : 'cyan'
              }
              className="p-5 sm:p-6"
            >
              <ManualPredictionPanel
                result={result}
                loading={loading}
                error={error}
                normalizedLabel={normalizedLabel}
                summaryTokens={summaryTokens}
                inputs={predictionSnapshot ?? values}
                resultTimestamp={predictionTimestamp}
              />
            </Card>
          </div>
        ) : (
          <div
            ref={batchResultRef}
            tabIndex={-1}
            className="scroll-mt-28 outline-none xl:sticky xl:top-24 xl:self-start"
          >
            <BatchResultsPanel
              batchResult={batchResult}
              batchLoading={batchLoading}
              highRiskCount={batchHighRiskCount}
              resultTimestamp={batchResultTimestamp}
              onDownloadJson={downloadBatchJson}
              onSelectRow={setSelectedRow}
            />
          </div>
        )}
      </div>

      {selectedRow ? <BatchRowModal row={selectedRow} onClose={() => setSelectedRow(null)} /> : null}
    </>
  )
}
