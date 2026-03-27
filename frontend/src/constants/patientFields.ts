import type { PredictRequest } from '../types'

export interface PatientFieldDef {
  key: keyof PredictRequest
  label: string
  unit: string
  min: number
  max: number
  step: number
  accent: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose'
  description: string
}

export const DEFAULT_PREDICT_VALUES: PredictRequest = {
  HR: 80,
  MAP: 80,
  Temp: 37.0,
  Resp: 18,
  O2Sat: 98,
  Lactate: 1.0,
  WBC: 8.0,
  Creatinine: 1.0,
  Age: 50,
  Gender: 'M',
  HoursAdmitted: 12,
}

export const DEMOGRAPHIC_FIELDS: PatientFieldDef[] = [
  {
    key: 'Age',
    label: 'Age',
    unit: 'years',
    min: 0,
    max: 120,
    step: 1,
    accent: 'amber',
    description: 'Patient age',
  },
  {
    key: 'HoursAdmitted',
    label: 'Hours Admitted',
    unit: 'hrs',
    min: 0,
    max: 1000,
    step: 1,
    accent: 'blue',
    description: 'Current stay duration',
  },
]

export const VITAL_FIELDS: PatientFieldDef[] = [
  {
    key: 'HR',
    label: 'Heart Rate',
    unit: 'bpm',
    min: 0,
    max: 300,
    step: 1,
    accent: 'rose',
    description: 'Cardiac response',
  },
  {
    key: 'MAP',
    label: 'Mean Arterial Pressure',
    unit: 'mmHg',
    min: 0,
    max: 200,
    step: 1,
    accent: 'blue',
    description: 'Perfusion pressure',
  },
  {
    key: 'Temp',
    label: 'Temperature',
    unit: 'deg C',
    min: 25,
    max: 45,
    step: 0.1,
    accent: 'amber',
    description: 'Body temperature',
  },
  {
    key: 'Resp',
    label: 'Respiratory Rate',
    unit: 'br/min',
    min: 0,
    max: 60,
    step: 1,
    accent: 'cyan',
    description: 'Breathing rate',
  },
  {
    key: 'O2Sat',
    label: 'SpO2',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    accent: 'emerald',
    description: 'Oxygen saturation',
  },
]

export const LAB_FIELDS: PatientFieldDef[] = [
  {
    key: 'Lactate',
    label: 'Lactate',
    unit: 'mmol/L',
    min: 0,
    max: 30,
    step: 0.1,
    accent: 'rose',
    description: 'Tissue stress marker',
  },
  {
    key: 'WBC',
    label: 'WBC Count',
    unit: 'x10^3/uL',
    min: 0,
    max: 100,
    step: 0.1,
    accent: 'cyan',
    description: 'Inflammatory response',
  },
  {
    key: 'Creatinine',
    label: 'Creatinine',
    unit: 'mg/dL',
    min: 0,
    max: 20,
    step: 0.1,
    accent: 'amber',
    description: 'Kidney function',
  },
]

export const ALL_NUMERIC_FIELDS = [...DEMOGRAPHIC_FIELDS, ...VITAL_FIELDS, ...LAB_FIELDS]
