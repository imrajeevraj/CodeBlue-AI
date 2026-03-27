"""API routes for the hackathon demo."""

from __future__ import annotations

import csv
import math
import re
from dataclasses import dataclass
from io import StringIO
from pathlib import Path
from typing import Any, Callable

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.model import ModelBundle, run_prediction
from app.presets import PRESETS
from app.schemas import (
    ChangedFeature,
    DriverDetail,
    HealthResponse,
    ModelStatusResponse,
    PredictFileResponse,
    PredictFileRowError,
    PredictFileRowResult,
    PredictRequest,
    PredictResponse,
    PresetInfo,
    PresetsResponse,
    WhatIfRequest,
    WhatIfResponse,
)

router = APIRouter()

_bundle: ModelBundle | None = None

MAX_UPLOAD_BYTES = 2 * 1024 * 1024
MAX_BATCH_ROWS = 500
REQUIRED_COLUMNS = tuple(PredictRequest.model_fields.keys())
NUMERIC_COLUMNS = tuple(name for name in REQUIRED_COLUMNS if name != "Gender")

DEFAULT_UPLOAD_VALUES: dict[str, float | str] = {
    name: field.default
    for name, field in PredictRequest.model_fields.items()
    if field.default is not None
}

ACCEPTED_ALIASES: dict[str, list[str]] = {
    "HR": ["hr", "heart_rate", "Heart Rate", "heartrate"],
    "MAP": ["map", "mean_arterial_pressure", "Mean Arterial Pressure", "meanarterialpressure"],
    "Temp": ["temp", "temperature", "Temperature"],
    "Resp": ["resp", "respiratory_rate", "Respiratory Rate", "resprate"],
    "O2Sat": ["o2sat", "spo2", "SpO2", "oxygen_saturation"],
    "Lactate": ["lactate", "Lactate"],
    "WBC": ["wbc", "wbc_count", "WBC Count", "white_blood_cell_count"],
    "Creatinine": ["creatinine", "Creatinine"],
    "Age": ["age", "Age"],
    "Gender": ["gender", "Gender", "sex", "Sex"],
    "HoursAdmitted": [
        "HoursAdmitted",
        "hours_admitted",
        "Hours Admitted",
        "hoursadmitted",
        "hours_since_admit",
        "hours_since_admission",
        "ICULOS",
        "HospAdmTime",
    ],
}


def _identity(value: str) -> str:
    return value


def _float_identity(value: str) -> float:
    return float(value)


def _absolute_float(value: str) -> float:
    return abs(float(value))


def _is_missing_value(value: Any) -> bool:
    if value is None:
        return True

    if isinstance(value, str):
        normalized = value.strip().lower()
        return normalized in {"", "nan", "na", "n/a", "null", "none"}

    return isinstance(value, float) and math.isnan(value)


@dataclass(frozen=True)
class AliasRule:
    source_names: tuple[str, ...]
    transformer: Callable[[str], float | str] = _identity


@dataclass(frozen=True)
class ColumnResolution:
    canonical: str
    source: str | None = None
    transformer: Callable[[str], float | str] | None = None
    default: float | str | None = None


ALIASES: dict[str, tuple[AliasRule, ...]] = {
    "HR": (AliasRule(("hr", "heart_rate", "heartrate"), _float_identity),),
    "MAP": (
        AliasRule(("map", "mean_arterial_pressure", "meanarterialpressure"), _float_identity),
    ),
    "Temp": (AliasRule(("temp", "temperature"), _float_identity),),
    "Resp": (
        AliasRule(("resp", "respiratory_rate", "respiratoryrate", "resprate"), _float_identity),
    ),
    "O2Sat": (
        AliasRule(("o2sat", "spo2", "oxygen_saturation", "oxygensaturation"), _float_identity),
    ),
    "Lactate": (AliasRule(("lactate",), _float_identity),),
    "WBC": (
        AliasRule(("wbc", "wbc_count", "wbccount", "white_blood_cell_count", "whitebloodcellcount"), _float_identity),
    ),
    "Creatinine": (AliasRule(("creatinine",), _float_identity),),
    "Age": (AliasRule(("age",), _float_identity),),
    "Gender": (AliasRule(("gender", "sex"), _identity),),
    "HoursAdmitted": (
        AliasRule(("hours_admitted", "hoursadmitted", "hours_since_admit", "hours_since_admission", "hour_index"), _float_identity),
        AliasRule(("iculos", "icu_los"), _float_identity),
        AliasRule(("hospadmtime", "hosp_adm_time", "hospitaladmissiontime"), _absolute_float),
    ),
}


def set_bundle(bundle: ModelBundle) -> None:
    global _bundle
    _bundle = bundle


def _get_bundle() -> ModelBundle:
    if _bundle is None:
        raise HTTPException(503, "Model not loaded yet")
    return _bundle


def _split_inputs(req: PredictRequest) -> tuple[dict[str, float], dict[str, Any]]:
    raw = {
        key: getattr(req, key)
        for key in ("HR", "MAP", "Temp", "Resp", "O2Sat", "Lactate", "WBC", "Creatinine")
    }
    direct = {"Age": req.Age, "Gender": req.Gender, "HoursAdmitted": req.HoursAdmitted}
    return raw, direct


def _predict_from_request(bundle: ModelBundle, req: PredictRequest) -> dict[str, Any]:
    raw, direct = _split_inputs(req)
    return run_prediction(bundle, raw, direct)


def _clean_header(value: str) -> str:
    stripped = value.replace("\ufeff", " ").strip()
    return re.sub(r"\s+", " ", stripped)


def _normalize_header(value: str) -> str:
    cleaned = _clean_header(value)
    return "".join(ch for ch in cleaned.lower() if ch.isalnum() or ch == "_")


def _resolve_headers(headers: list[str]) -> tuple[dict[str, ColumnResolution], list[str]]:
    cleaned_lookup: dict[str, str] = {}
    normalized_lookup: dict[str, str] = {}

    for header in headers:
        cleaned = _clean_header(header)
        if not cleaned:
            continue
        cleaned_lookup.setdefault(cleaned, header)
        normalized_lookup.setdefault(_normalize_header(cleaned), header)

    resolutions: dict[str, ColumnResolution] = {}
    missing: list[str] = []

    for canonical in REQUIRED_COLUMNS:
        if canonical in cleaned_lookup:
            resolutions[canonical] = ColumnResolution(
                canonical=canonical,
                source=cleaned_lookup[canonical],
                transformer=_identity if canonical == "Gender" else _float_identity,
                default=DEFAULT_UPLOAD_VALUES.get(canonical),
            )
            continue

        canonical_normalized = _normalize_header(canonical)
        if canonical_normalized in normalized_lookup:
            resolutions[canonical] = ColumnResolution(
                canonical=canonical,
                source=normalized_lookup[canonical_normalized],
                transformer=_identity if canonical == "Gender" else _float_identity,
                default=DEFAULT_UPLOAD_VALUES.get(canonical),
            )
            continue

        alias_rules = ALIASES.get(canonical, ())
        matched = None
        for rule in alias_rules:
            for alias in rule.source_names:
                alias_normalized = _normalize_header(alias)
                if alias_normalized in normalized_lookup:
                    matched = ColumnResolution(
                        canonical=canonical,
                        source=normalized_lookup[alias_normalized],
                        transformer=rule.transformer,
                        default=DEFAULT_UPLOAD_VALUES.get(canonical),
                    )
                    break
            if matched:
                break

        if matched:
            resolutions[canonical] = matched
            continue

        if canonical in DEFAULT_UPLOAD_VALUES:
            resolutions[canonical] = ColumnResolution(
                canonical=canonical,
                default=DEFAULT_UPLOAD_VALUES[canonical],
            )
            continue

        missing.append(canonical)

    return resolutions, missing


def _coerce_row(record: dict[str, str], resolutions: dict[str, ColumnResolution]) -> PredictRequest:
    payload: dict[str, float | str] = {}

    for column in REQUIRED_COLUMNS:
        resolution = resolutions[column]

        if resolution.source is None:
            if resolution.default is None:
                raise ValueError(f"Missing value for {column}")
            payload[column] = resolution.default
            continue

        raw_value = record.get(resolution.source, "")
        value = raw_value.strip() if isinstance(raw_value, str) else raw_value

        if _is_missing_value(value):
            if resolution.default is not None:
                payload[column] = resolution.default
                continue
            raise ValueError(f"Missing value for {column}")

        try:
            transformed = resolution.transformer(value) if resolution.transformer else value
        except (TypeError, ValueError) as exc:
            if column in NUMERIC_COLUMNS:
                raise ValueError(f"Invalid numeric value for {column}: {value}") from exc
            raise ValueError(f"Invalid value for {column}: {value}") from exc

        if _is_missing_value(transformed):
            if resolution.default is not None:
                payload[column] = resolution.default
                continue
            raise ValueError(f"Missing value for {column}")

        payload[column] = transformed

    return PredictRequest(**payload)


def _format_validation_error(exc: ValidationError) -> str:
    parts: list[str] = []
    for error in exc.errors():
        location = error.get("loc", [])
        field = str(location[-1]) if location else ""
        parts.append(f"{field}: {error['msg']}" if field else error["msg"])
    return "; ".join(parts)


def _build_reader(filename: str, text: str) -> csv.DictReader[str]:
    suffix = Path(filename).suffix.lower()
    delimiter = "," if suffix == ".csv" else "|"
    return csv.DictReader(StringIO(text), delimiter=delimiter, skipinitialspace=True)


def _missing_columns_response(missing_columns: list[str]) -> JSONResponse:
    accepted_aliases = {
        column: ACCEPTED_ALIASES.get(column, [])
        for column in missing_columns
    }
    return JSONResponse(
        status_code=400,
        content={
            "error": "Missing required columns",
            "missing_columns": missing_columns,
            "accepted_aliases": accepted_aliases,
        },
    )


@router.get("/health", response_model=HealthResponse)
def health():
    bundle = _bundle
    return HealthResponse(
        status="ok",
        model_loaded=bundle is not None,
        version=bundle.version if bundle else "n/a",
    )


@router.get("/model/status", response_model=ModelStatusResponse)
def model_status():
    bundle = _get_bundle()
    return ModelStatusResponse(
        loaded=True,
        model_name="XGBoost Sepsis Risk Classifier",
        version=bundle.version,
        feature_count=bundle.feature_count,
        threshold=round(bundle.threshold, 4),
    )


@router.post("/model/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    bundle = _get_bundle()
    result = _predict_from_request(bundle, req)
    return PredictResponse(
        score=result["score"],
        probability=result["probability"],
        label=result["label"],
        threshold=result["threshold"],
        top_drivers=[DriverDetail(**driver) for driver in result["top_drivers"]],
        summary=result["summary"],
        feature_count=result["feature_count"],
    )


@router.post("/model/predict-file", response_model=PredictFileResponse)
async def predict_file(file: UploadFile = File(...)):
    bundle = _get_bundle()
    filename = file.filename or "uploaded-file"
    suffix = Path(filename).suffix.lower()

    if suffix not in {".csv", ".psv"}:
        raise HTTPException(400, "Only .csv and .psv files are supported")

    payload = await file.read()
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            413,
            f"File is too large. Limit is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    try:
        text = payload.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(400, "Unable to decode file. Please upload UTF-8 text.") from exc

    reader = _build_reader(filename, text)
    headers = reader.fieldnames or []
    if not headers:
        raise HTTPException(400, "File must include a header row")

    resolutions, missing_columns = _resolve_headers(headers)
    if missing_columns:
        return _missing_columns_response(missing_columns)

    rows = list(reader)
    total_rows = len(rows)
    if total_rows == 0:
        raise HTTPException(400, "File does not contain any data rows")
    if total_rows > MAX_BATCH_ROWS:
        raise HTTPException(400, f"Too many rows. Limit is {MAX_BATCH_ROWS}.")

    results: list[PredictFileRowResult] = []
    errors: list[PredictFileRowError] = []

    for row_index, record in enumerate(rows, start=1):
        try:
            predict_request = _coerce_row(record, resolutions)
            prediction = _predict_from_request(bundle, predict_request)
            results.append(
                PredictFileRowResult(
                    row_index=row_index,
                    input=predict_request.model_dump(),
                    score=prediction["score"],
                    probability=prediction["probability"],
                    label=prediction["label"],
                    threshold=prediction["threshold"],
                    top_drivers=[DriverDetail(**driver) for driver in prediction["top_drivers"]],
                    summary=prediction["summary"],
                )
            )
        except ValueError as exc:
            errors.append(PredictFileRowError(row_index=row_index, message=str(exc)))
        except ValidationError as exc:
            errors.append(
                PredictFileRowError(row_index=row_index, message=_format_validation_error(exc))
            )

    return PredictFileResponse(
        filename=filename,
        total_rows=total_rows,
        processed_rows=len(results),
        failed_rows=len(errors),
        results=results,
        errors=errors,
    )


@router.post("/model/what-if", response_model=WhatIfResponse)
def what_if(req: WhatIfRequest):
    bundle = _get_bundle()
    base_result = _predict_from_request(bundle, req.baseline)

    updated_req_dict = req.baseline.model_dump()
    changed: list[ChangedFeature] = []
    for key, new_val in req.overrides.items():
        if key in updated_req_dict:
            old_val = updated_req_dict[key]
            if str(old_val) != str(new_val):
                changed.append(ChangedFeature(name=key, old=old_val, new=new_val))
            updated_req_dict[key] = new_val

    updated_req = PredictRequest(**updated_req_dict)
    updated_result = _predict_from_request(bundle, updated_req)

    return WhatIfResponse(
        baseline_score=base_result["score"],
        baseline_probability=base_result["probability"],
        updated_score=updated_result["score"],
        updated_probability=updated_result["probability"],
        delta=updated_result["score"] - base_result["score"],
        baseline_label=base_result["label"],
        updated_label=updated_result["label"],
        changed_features=changed,
        baseline_drivers=[DriverDetail(**driver) for driver in base_result["top_drivers"]],
        updated_drivers=[DriverDetail(**driver) for driver in updated_result["top_drivers"]],
        baseline_summary=base_result["summary"],
        updated_summary=updated_result["summary"],
    )


@router.get("/presets", response_model=PresetsResponse)
def get_presets():
    items = [
        PresetInfo(
            key=key,
            label=value["label"],
            description=value["description"],
            inputs=value["inputs"],
        )
        for key, value in PRESETS.items()
    ]
    return PresetsResponse(presets=items)
