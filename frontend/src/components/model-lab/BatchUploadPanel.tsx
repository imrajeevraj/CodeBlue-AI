import { AlertTriangle, FileSpreadsheet, Upload } from 'lucide-react'
import type { PredictFileResponse, PredictFileUploadErrorResponse } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { cn } from '../../lib/ui'
import type { FilePreview } from './modelLabUtils'
import { formatBytes, inferFileFormat } from './modelLabUtils'

export default function BatchUploadPanel({
  batchFile,
  batchPreview,
  batchResult,
  batchLoading,
  batchError,
  dragActive,
  setDragActive,
  onFilePick,
  onRun,
  onClear,
}: {
  batchFile: File | null
  batchPreview: FilePreview | null
  batchResult: PredictFileResponse | null
  batchLoading: boolean
  batchError: PredictFileUploadErrorResponse | null
  dragActive: boolean
  setDragActive: (value: boolean) => void
  onFilePick: (file: File | null) => void | Promise<void>
  onRun: () => void
  onClear: () => void
}) {
  return (
    <Card accent="cyan" className="p-5 sm:p-6">
      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          void onFilePick(event.dataTransfer.files?.[0] ?? null)
        }}
        className={cn(
          'rounded-[28px] border border-dashed p-6 text-center transition',
          dragActive
            ? 'border-cyan-300/40 bg-cyan-300/[0.08]'
            : 'border-white/[0.12] bg-white/[0.03]',
        )}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/[0.08] bg-slate-950/55">
          <Upload className="h-7 w-7 text-cyan-200" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">Upload batch file</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
          Upload patient/data rows and run batch prediction through the live model.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
          Accepted formats: .csv, .psv
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.psv"
              className="sr-only"
              onChange={(event) => void onFilePick(event.target.files?.[0] ?? null)}
            />
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(59,130,246,0.92),rgba(125,211,252,0.88))] px-4 py-3 text-sm font-medium text-slate-950 shadow-[0_18px_40px_rgba(56,189,248,0.22)]">
              <Upload className="h-4 w-4" />
              Browse File
            </span>
          </label>
          {batchFile ? (
            <Button type="button" variant="secondary" onClick={onClear}>
              Clear
            </Button>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
          <a className="rounded-full border border-white/[0.08] px-3 py-1.5 hover:text-white" href="/samples/sample_low_risk.csv" download>
            sample_low_risk.csv
          </a>
          <a className="rounded-full border border-white/[0.08] px-3 py-1.5 hover:text-white" href="/samples/sample_mixed_risk.csv" download>
            sample_mixed_risk.csv
          </a>
          <a className="rounded-full border border-white/[0.08] px-3 py-1.5 hover:text-white" href="/samples/sample_high_risk.psv" download>
            sample_high_risk.psv
          </a>
        </div>
      </div>

      {batchFile ? (
        <div className="mt-5 rounded-[24px] border border-white/[0.07] bg-slate-950/45 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected file</p>
              <p className="mt-2 text-lg font-semibold text-white">{batchFile.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-400">
                <span className="rounded-full border border-white/[0.08] px-3 py-1">
                  {formatBytes(batchFile.size)}
                </span>
                <span className="rounded-full border border-white/[0.08] px-3 py-1">
                  {inferFileFormat(batchFile.name) ?? 'Unknown'}
                </span>
                {batchPreview ? (
                  <span className="rounded-full border border-white/[0.08] px-3 py-1">
                    {batchPreview.totalRows} rows detected
                  </span>
                ) : null}
                {batchResult ? (
                  <span className="rounded-full border border-emerald-300/[0.16] bg-emerald-300/[0.08] px-3 py-1 text-emerald-200">
                    Last run ready
                  </span>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              onClick={onRun}
              loading={batchLoading}
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            >
              Run Batch Prediction
            </Button>
          </div>
        </div>
      ) : null}

      {batchPreview ? (
        <Card accent="none" className="mt-5 rounded-[24px] border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileSpreadsheet className="h-4 w-4 text-cyan-300" />
            Preview
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500">
                  {batchPreview.headers.map((header) => (
                    <th key={header} className="px-3 py-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batchPreview.rows.map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${row.join('-')}`} className="border-b border-white/[0.04] text-slate-300 last:border-b-0">
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {batchError ? (
        <Card accent="amber" className="mt-5 rounded-[24px] border-amber-300/[0.14] bg-amber-300/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            Upload validation issue
          </div>
          <p className="mt-3 text-sm text-amber-50/90">{batchError.error}</p>
          {batchError.missing_columns?.length ? (
            <div className="mt-4 space-y-3">
              {batchError.missing_columns.map((column) => (
                <div key={column} className="rounded-2xl border border-amber-200/[0.12] bg-black/10 px-3 py-3">
                  <p className="text-sm font-medium text-amber-50">{column}</p>
                  {batchError.accepted_aliases?.[column]?.length ? (
                    <p className="mt-2 text-xs text-amber-50/80">
                      Accepted aliases: {batchError.accepted_aliases[column].join(', ')}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}
    </Card>
  )
}
