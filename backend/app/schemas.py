"""Pydantic schemas for the hackathon demo API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DriverDetail(BaseModel):
    feature: str
    impact: float
    direction: str
    value: float


class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool
    version: str


class ModelStatusResponse(BaseModel):
    loaded: bool
    model_name: str
    version: str
    feature_count: int
    threshold: float


class PredictRequest(BaseModel):
    HR: float = Field(80.0, ge=0, le=300)
    MAP: float = Field(80.0, ge=0, le=200)
    Temp: float = Field(37.0, ge=25, le=45)
    Resp: float = Field(18.0, ge=0, le=60)
    O2Sat: float = Field(98.0, ge=0, le=100)
    Lactate: float = Field(1.0, ge=0, le=30)
    WBC: float = Field(8.0, ge=0, le=100)
    Creatinine: float = Field(1.0, ge=0, le=20)
    Age: float = Field(50.0, ge=0, le=120)
    Gender: str = Field("M")
    HoursAdmitted: float = Field(12.0, ge=0, le=1000)


class PredictResponse(BaseModel):
    score: int
    probability: float
    label: str
    threshold: float
    top_drivers: list[DriverDetail]
    summary: str
    feature_count: int


class PredictFileRowError(BaseModel):
    row_index: int
    message: str


class PredictFileRowResult(BaseModel):
    row_index: int
    input: dict[str, float | str]
    score: int
    probability: float
    label: str
    threshold: float
    top_drivers: list[DriverDetail]
    summary: str


class PredictFileResponse(BaseModel):
    filename: str
    total_rows: int
    processed_rows: int
    failed_rows: int
    results: list[PredictFileRowResult]
    errors: list[PredictFileRowError]


class WhatIfRequest(BaseModel):
    baseline: PredictRequest
    overrides: dict[str, float | str]


class ChangedFeature(BaseModel):
    name: str
    old: float | str
    new: float | str


class WhatIfResponse(BaseModel):
    baseline_score: int
    baseline_probability: float
    updated_score: int
    updated_probability: float
    delta: int
    baseline_label: str
    updated_label: str
    changed_features: list[ChangedFeature]
    baseline_drivers: list[DriverDetail]
    updated_drivers: list[DriverDetail]
    baseline_summary: str
    updated_summary: str


class PresetInfo(BaseModel):
    key: str
    label: str
    description: str
    inputs: dict[str, float | int | str]


class PresetsResponse(BaseModel):
    presets: list[PresetInfo]
