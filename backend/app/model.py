"""
Model loading and inference engine.
Loads the trained XGBoost model + feature columns from the main project's
backend/models/ directory. No training, no DB.
"""

from __future__ import annotations

import json
import math
import pickle
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from statistics import fmean, pstdev
from typing import Any

import numpy as np
import shap

# ── Paths ────────────────────────────────────────────────────────────────────
DEMO_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = DEMO_ROOT.parent
MODELS_DIR = PROJECT_ROOT / "backend" / "models"
DATA_DIR = PROJECT_ROOT / "backend" / "app" / "data"

MODEL_BUNDLE_JSON = MODELS_DIR / "model_bundle.json"
# The model was trained with the 108-feature set in backend/app/data/
FEATURE_COLUMNS_JSON = DATA_DIR / "feature_columns.json"
MODEL_PKL = MODELS_DIR / "sepsis_model.pkl"

# ── Clinical constants ───────────────────────────────────────────────────────
CLINICAL_THRESHOLDS: dict[str, float] = {
    "HR": 100.0, "MAP": 65.0, "Temp": 38.0,
    "O2Sat": 92.0, "Lactate": 2.0, "Resp": 22.0,
}

RAW_FEATURES = ("HR", "Resp", "Temp", "MAP", "O2Sat", "WBC", "Lactate", "Creatinine")
DIRECT_INPUT_FIELDS = ("Age", "Gender", "HoursAdmitted")

CLINICAL_TEMPLATES: dict[str, tuple[str, str]] = {
    "HR_latest": ("sustained tachycardia (HR {v:.0f} bpm)", "bradycardia (HR {v:.0f} bpm)"),
    "MAP_latest": ("hypotension (MAP {v:.0f} mmHg)", "stable blood pressure (MAP {v:.0f} mmHg)"),
    "Temp_latest": ("fever ({v:.1f}\u00b0C)", "hypothermia ({v:.1f}\u00b0C)"),
    "Resp_latest": ("tachypnea (RR {v:.0f} br/min)", "stable respiratory rate (RR {v:.0f} br/min)"),
    "O2Sat_latest": ("hypoxemia (SpO\u2082 {v:.0f}%)", "adequate oxygenation (SpO\u2082 {v:.0f}%)"),
    "Lactate_latest": ("elevated lactate ({v:.1f} mmol/L)", "normal lactate ({v:.1f} mmol/L)"),
    "HR_slope_3h": ("rapidly rising heart rate", "declining heart rate"),
    "MAP_slope_3h": ("falling blood pressure trend", "rising blood pressure"),
    "Temp_slope_3h": ("rising temperature trend", ""),
    "Resp_slope_3h": ("worsening respiratory rate trend", ""),
    "Lactate_slope_3h": ("rapidly rising lactate", ""),
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def _window(values: list[float], size: int) -> list[float]:
    return values[-size:] if values else []

def _mean(values: list[float]) -> float:
    return float(fmean(values)) if values else 0.0

def _std(values: list[float]) -> float:
    return float(pstdev(values)) if len(values) >= 2 else 0.0

def _slope(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    x = list(range(len(values)))
    xm, ym = _mean(x), _mean(values)
    denom = sum((xi - xm) ** 2 for xi in x)
    if math.isclose(denom, 0.0):
        return 0.0
    numer = sum((xi - xm) * (yi - ym) for xi, yi in zip(x, values))
    return float(numer / denom)

def _gender_to_code(value: str | int | float | None) -> int:
    if isinstance(value, (int, float)):
        return int(value)
    if not value:
        return 0
    return 1 if str(value).strip().lower().startswith("m") else 0

def _age_to_bin(age: float | None) -> int:
    return int(float(age) // 10) if age is not None else 0


# ── ModelBundle ──────────────────────────────────────────────────────────────

@dataclass
class ModelBundle:
    model: Any = field(repr=False)
    feature_columns: list[str] = field(default_factory=list)
    version: str = "unknown"
    threshold: float = 0.35
    medium_band: float = 0.30
    high_band: float = 0.60
    loaded_at: str = ""
    explainer: Any = field(default=None, repr=False)

    @property
    def feature_count(self) -> int:
        return len(self.feature_columns)

    def band_for(self, probability: float) -> str:
        if probability >= self.high_band:
            return "HIGH"
        if probability >= self.medium_band:
            return "MEDIUM"
        return "LOW"


def load_model_bundle() -> ModelBundle:
    if not MODEL_PKL.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PKL}")

    with MODEL_PKL.open("rb") as f:
        model = pickle.load(f)

    if FEATURE_COLUMNS_JSON.exists():
        feature_columns = json.loads(FEATURE_COLUMNS_JSON.read_text(encoding="utf-8"))
    else:
        raise RuntimeError(f"Feature columns not found: {FEATURE_COLUMNS_JSON}")

    version = "sepsis_model_runtime_v2"
    threshold = 0.35
    medium_band = 0.30
    high_band = 0.60

    if MODEL_BUNDLE_JSON.exists():
        manifest = json.loads(MODEL_BUNDLE_JSON.read_text(encoding="utf-8"))
        version = manifest.get("version", version)
        threshold = manifest.get("threshold", threshold)
        bands = manifest.get("risk_bands", {})
        medium_band = bands.get("medium", medium_band)
        high_band = bands.get("high", high_band)

    bundle = ModelBundle(
        model=model,
        feature_columns=feature_columns,
        version=version,
        threshold=threshold,
        medium_band=medium_band,
        high_band=high_band,
        loaded_at=datetime.now(timezone.utc).isoformat(),
    )

    # Pre-build SHAP explainer
    try:
        bundle.explainer = shap.TreeExplainer(model)
    except Exception:
        pass

    return bundle


# ── Feature Vector Builder ───────────────────────────────────────────────────

def _build_engineered_features(fv: dict[str, float], raw_name: str, values: list[float]) -> None:
    r3 = _window(values, 3)
    r6 = _window(values, 6)
    r12 = _window(values, 12)
    latest = values[-1] if values else float("nan")
    previous = values[-2] if len(values) > 1 else latest
    missing = len(values) == 0

    fv[f"{raw_name}_latest"] = latest
    fv[f"{raw_name}_mean_3h"] = _mean(r3) if r3 else latest
    fv[f"{raw_name}_std_3h"] = _std(r3)
    fv[f"{raw_name}_mean_6h"] = _mean(r6) if r6 else latest
    fv[f"{raw_name}_min_6h"] = min(r6) if r6 else latest
    fv[f"{raw_name}_max_6h"] = max(r6) if r6 else latest
    fv[f"{raw_name}_mean_12h"] = _mean(r12) if r12 else latest
    fv[f"{raw_name}_min_12h"] = min(r12) if r12 else latest
    fv[f"{raw_name}_max_12h"] = max(r12) if r12 else latest
    fv[f"{raw_name}_delta"] = latest - previous if not missing else 0.0
    fv[f"{raw_name}_slope_3h"] = _slope(r3)
    fv[f"{raw_name}_slope_6h"] = _slope(r6)
    fv[f"{raw_name}_slope_12h"] = _slope(r12)

    # Flags
    thresh = CLINICAL_THRESHOLDS.get(raw_name)
    if thresh is not None and not missing:
        if raw_name in ("MAP", "O2Sat"):
            fv[f"{raw_name}_low"] = 1.0 if latest < thresh else 0.0
        else:
            fv[f"{raw_name}_high"] = 1.0 if latest > thresh else 0.0


def build_feature_vector(
    feature_columns: list[str],
    raw_inputs: dict[str, float],
    direct_inputs: dict[str, Any],
) -> dict[str, float]:
    fv: dict[str, float] = {col: 0.0 for col in feature_columns}

    # Demographics
    if "Age" in fv:
        fv["Age"] = float(direct_inputs.get("Age", 0.0))
    if "Gender" in fv:
        fv["Gender"] = float(_gender_to_code(direct_inputs.get("Gender")))
    if "Age_bin" in fv:
        fv["Age_bin"] = float(_age_to_bin(direct_inputs.get("Age")))
    hours = float(direct_inputs.get("HoursAdmitted", 0.0))
    if "HospAdmTime" in fv:
        fv["HospAdmTime"] = hours
    if "hours_since_admit" in fv:
        fv["hours_since_admit"] = hours
    if "hours_since_admission" in fv:
        fv["hours_since_admission"] = hours
    if "hour_index" in fv:
        fv["hour_index"] = hours

    # Build per-vital engineered features from the single raw input value
    for raw_name in RAW_FEATURES:
        val = raw_inputs.get(raw_name)
        if val is not None:
            series = [float(val)]
        else:
            series = []
        _build_engineered_features(fv, raw_name, series)

    # Apply any direct overrides that match feature columns exactly
    for key, value in direct_inputs.items():
        if key in fv and key not in ("Age", "Gender", "HoursAdmitted"):
            fv[key] = float(value)

    # Interaction features
    hr = raw_inputs.get("HR", 0.0)
    sbp = raw_inputs.get("SBP", fv.get("SBP_latest", 0.0))
    resp = raw_inputs.get("Resp", 0.0)
    o2 = raw_inputs.get("O2Sat", 0.0)
    map_val = raw_inputs.get("MAP", 0.0)

    if "shock_index" in fv and sbp > 0:
        fv["shock_index"] = hr / sbp
    if "resp_oxygen_ratio" in fv and o2 > 0:
        fv["resp_oxygen_ratio"] = resp / o2
    if "map_hr_ratio" in fv and hr > 0:
        fv["map_hr_ratio"] = map_val / hr

    return {col: float(fv.get(col, 0.0)) for col in feature_columns}


# ── Inference ────────────────────────────────────────────────────────────────

def _score_to_int(prob: float) -> int:
    pct = prob * 100.0 if prob <= 1.0 else prob
    return int(round(max(0.0, min(100.0, pct))))


def _generate_explanation(shap_dict: dict[str, float], fv: dict[str, float], n_drivers: int = 3) -> str:
    ranked = sorted(
        [(k, v) for k, v in shap_dict.items() if v > 0.01],
        key=lambda x: -abs(x[1]),
    )[:n_drivers]

    phrases: list[str] = []
    for feat, sv in ranked:
        val = fv.get(feat)
        template = CLINICAL_TEMPLATES.get(feat)
        if template and val is not None:
            try:
                phrase = template[0].format(v=val) if sv > 0 else template[1].format(v=val)
                if phrase:
                    phrases.append(phrase)
                    continue
            except (IndexError, ValueError):
                pass
        clean = feat.replace("_", " ")
        phrases.append(f"{clean} ({'elevated' if sv > 0 else 'reduced'})")

    if not phrases:
        return "Prediction is based on the overall clinical profile."
    if len(phrases) == 1:
        return f"Risk is primarily driven by {phrases[0]}."
    return f"Risk is driven by {', '.join(phrases[:-1])}, and {phrases[-1]}."


def run_prediction(
    bundle: ModelBundle,
    raw_inputs: dict[str, float],
    direct_inputs: dict[str, Any],
) -> dict[str, Any]:
    fv = build_feature_vector(bundle.feature_columns, raw_inputs, direct_inputs)

    X = np.array([[fv[col] for col in bundle.feature_columns]])

    if hasattr(bundle.model, "predict_proba"):
        prob = float(bundle.model.predict_proba(X)[0, 1])
    else:
        prob = float(bundle.model.predict(X)[0])

    band = bundle.band_for(prob)
    score = _score_to_int(prob)

    # SHAP drivers
    top_drivers: list[dict[str, Any]] = []
    explanation = ""

    if bundle.explainer is not None:
        try:
            sv = bundle.explainer.shap_values(X)
            if isinstance(sv, list):
                sv = sv[1]
            shap_dict = dict(zip(bundle.feature_columns, sv[0]))

            sorted_drivers = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
            top_drivers = [
                {
                    "feature": k,
                    "impact": round(abs(v), 4),
                    "direction": "up" if v > 0 else "down",
                    "value": round(fv.get(k, 0.0), 4),
                }
                for k, v in sorted_drivers
            ]
            explanation = _generate_explanation(shap_dict, fv)
        except Exception:
            explanation = f"Risk is classified as {band.lower()} based on the overall clinical profile."
    else:
        explanation = f"Risk is classified as {band.lower()} based on the overall clinical profile."

    return {
        "score": score,
        "probability": round(prob, 4),
        "label": band,
        "threshold": bundle.threshold,
        "top_drivers": top_drivers,
        "summary": explanation,
        "feature_count": bundle.feature_count,
    }
