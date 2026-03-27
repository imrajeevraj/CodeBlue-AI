import type {
  HealthResponse,
  ModelStatusResponse,
  PredictFileResponse,
  PredictRequest,
  PredictResponse,
  PresetInfo,
  WhatIfRequest,
  WhatIfResponse,
} from './types'

const BASE = '/api'

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const details = await res.json()
      const message =
        typeof details?.error === 'string'
          ? details.error
          : typeof details?.detail === 'string'
            ? details.detail
            : `Request failed with status ${res.status}`
      throw new ApiError(message, res.status, details)
    }

    const body = await res.text()
    throw new ApiError(body || `Request failed with status ${res.status}`, res.status, body)
  }

  return res.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>('/health'),

  modelStatus: () => request<ModelStatusResponse>('/model/status'),

  predict: (data: PredictRequest) =>
    request<PredictResponse>('/model/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  predictFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<PredictFileResponse>('/model/predict-file', {
      method: 'POST',
      body: formData,
    })
  },

  whatIf: (data: WhatIfRequest) =>
    request<WhatIfResponse>('/model/what-if', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  presets: () =>
    request<{ presets: PresetInfo[] }>('/presets').then((response) => response.presets),
}
