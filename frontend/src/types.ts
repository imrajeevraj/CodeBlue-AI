export interface DriverDetail {
  feature: string
  impact: number
  direction: 'up' | 'down'
  value: number
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  version: string
}

export interface ModelStatusResponse {
  loaded: boolean
  model_name: string
  version: string
  feature_count: number
  threshold: number
}

export interface PredictRequest {
  HR: number
  MAP: number
  Temp: number
  Resp: number
  O2Sat: number
  Lactate: number
  WBC: number
  Creatinine: number
  Age: number
  Gender: string
  HoursAdmitted: number
}

export interface PredictResponse {
  score: number
  probability: number
  label: 'LOW' | 'MEDIUM' | 'HIGH'
  threshold: number
  top_drivers: DriverDetail[]
  summary: string
  feature_count: number
}

export interface PredictFileRowError {
  row_index: number
  message: string
}

export interface PredictFileRowResult {
  row_index: number
  input: PredictRequest
  score: number
  probability: number
  label: 'LOW' | 'MEDIUM' | 'HIGH'
  threshold: number
  top_drivers: DriverDetail[]
  summary: string
}

export interface PredictFileResponse {
  filename: string
  total_rows: number
  processed_rows: number
  failed_rows: number
  results: PredictFileRowResult[]
  errors: PredictFileRowError[]
}

export interface PredictFileUploadErrorResponse {
  error: string
  missing_columns?: string[]
  accepted_aliases?: Record<string, string[]>
}

export interface WhatIfRequest {
  baseline: PredictRequest
  overrides: Record<string, number | string>
}

export interface ChangedFeature {
  name: string
  old: number | string
  new: number | string
}

export interface WhatIfResponse {
  baseline_score: number
  baseline_probability: number
  updated_score: number
  updated_probability: number
  delta: number
  baseline_label: string
  updated_label: string
  changed_features: ChangedFeature[]
  baseline_drivers: DriverDetail[]
  updated_drivers: DriverDetail[]
  baseline_summary: string
  updated_summary: string
}

export interface PresetInfo {
  key: string
  label: string
  description: string
  inputs: Record<string, number | string>
}
