# Technical Explanation — CodeBlue AI

> A detailed breakdown of system architecture, model pipeline, explainability design, and engineering decisions.

---

## System Architecture

CodeBlue AI follows a clean client-server architecture with a separation between the ML inference layer and the presentation layer.

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  (TypeScript + Vite + Tailwind CSS) │
└───────────────┬─────────────────────┘
                │ HTTP / REST (proxied via Vite dev server)
                ▼
┌─────────────────────────────────────┐
│         FastAPI Backend             │
│         (Python / Uvicorn)          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Request Validation     │    │
│  │      (Pydantic Schemas)     │    │
│  └───────────────┬─────────────┘    │
│                  ▼                  │
│  ┌─────────────────────────────┐    │
│  │     ML Model Pipeline       │    │
│  │  (XGBoost + SHAP + Pandas)  │    │
│  └───────────────┬─────────────┘    │
│                  ▼                  │
│  ┌─────────────────────────────┐    │
│  │    Structured JSON Response │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

All communication between frontend and backend uses JSON over HTTP. The Vite dev server proxies `/api/*` requests to `http://localhost:8000`, eliminating CORS friction during development.

---

## Backend Design

### Framework: FastAPI
The backend is built with FastAPI, which provides automatic OpenAPI documentation, Pydantic-based schema validation, async support, and minimal overhead.

### Startup & Model Loading
The model is loaded once at application startup using FastAPI's `lifespan` context manager. This approach avoids reloading the model on every request and keeps inference latency minimal.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    bundle = load_model_bundle()   # loads XGBoost model + feature columns + threshold
    set_bundle(bundle)             # registers bundle with route handlers
    yield
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and deployment status |
| `GET` | `/api/model/status` | Model metadata (version, feature count, threshold) |
| `POST` | `/api/model/predict` | Single-patient prediction from JSON body |
| `POST` | `/api/model/predict-file` | Batch prediction from uploaded CSV or PSV file |
| `POST` | `/api/model/what-if` | Comparative simulation: baseline vs override inputs |
| `GET` | `/api/presets` | Retrieve pre-built clinical patient profiles |

### Request Validation
All input schemas are defined using Pydantic models. Required fields, type enforcement, and range constraints are applied before any inference runs. Invalid requests return structured 422 error responses.

### CORS Configuration
`CORSMiddleware` is applied globally with permissive settings for the demo environment. In a production deployment, this would be restricted to known origin domains.

---

## Model Pipeline

### Input Features
The model accepts 11 clinical features:

| Feature | Description | Unit |
|---|---|---|
| `HR` | Heart Rate | bpm |
| `MAP` | Mean Arterial Pressure | mmHg |
| `Temp` | Body Temperature | °C |
| `Resp` | Respiratory Rate | breaths/min |
| `O2Sat` | SpO2 (Oxygen Saturation) | % |
| `Lactate` | Serum Lactate | mmol/L |
| `WBC` | White Blood Cell Count | ×10³/µL |
| `Creatinine` | Serum Creatinine | mg/dL |
| `Age` | Patient Age | years |
| `Gender` | Biological Sex | M / F (encoded) |
| `HoursAdmitted` | Time since admission | hours |

### Preprocessing
- `Gender` is ordinally encoded (M = 1, F = 0)
- Input values are assembled into a Pandas DataFrame matching the exact column order used during training
- No normalization or scaling is applied at inference time (XGBoost is tree-based; it does not require feature scaling)

### Inference
The loaded XGBoost model produces a raw probability score via `predict_proba`. The pipeline:

```
Raw Input → Pandas DataFrame (ordered columns) → XGBoost predict_proba() → probability [0–1]
```

The probability is scaled to a 0–100 risk score and classified against a configurable threshold:
- **< threshold** → `LOW`
- **≥ threshold, < 1.5× threshold** → `MEDIUM`
- **≥ 1.5× threshold** → `HIGH`

### Response Structure
Each prediction response includes:
- `score`: integer 0–100
- `probability`: float 0–1
- `label`: `LOW` | `MEDIUM` | `HIGH`
- `threshold`: the classification threshold used
- `top_drivers`: ranked list of SHAP contributions
- `summary`: natural language explanation
- `feature_count`: number of model features

---

## Explainability — SHAP

SHAP (SHapley Additive exPlanations) is used to compute the contribution of each feature to the individual prediction.

### Approach
`shap.TreeExplainer` is used, which is optimized for tree-based models like XGBoost and runs in milliseconds per prediction. It computes exact Shapley values rather than approximations.

### What SHAP Values Represent
Each SHAP value quantifies how much a specific feature contributed to moving the prediction away from the model's baseline (expected) output. Positive SHAP values increase the predicted risk; negative values decrease it.

### Driver Output
The top N drivers are sorted by absolute SHAP magnitude and returned with:
- `feature`: feature name
- `impact`: absolute SHAP value
- `direction`: `up` (risk-increasing) or `down` (risk-decreasing)
- `value`: actual input value for that feature

### Natural Language Summary
Each prediction is accompanied by a generated summary sentence that identifies the dominant risk factors in plain language — designed for clinical readability.

---

## Model Lab Flow

### Manual Input Path
```
User fills form inputs (sliders + number fields)
       │
       ▼
POST /api/model/predict  (JSON body)
       │
       ▼
Pydantic validation → DataFrame construction
       │
       ▼
XGBoost inference + SHAP explanation
       │
       ▼
JSON response → React state update
       │
       ▼
ScoreRing animation + DriverList + Summary render
```

### Batch File Upload Path
```
User uploads CSV or PSV file
       │
       ▼
Frontend: parse headers + first 5 rows for preview (client-side)
       │
       ▼
POST /api/model/predict-file  (multipart/form-data)
       │
       ▼
Backend: read file content → detect delimiter → parse rows
       │
       ▼
For each row: validate columns → run inference + SHAP
       │
       ▼
Aggregate results: processed, failed, errors[]
       │
       ▼
JSON response → BatchResultsPanel table + summary stats
       │
       ▼
Row click → BatchRowModal with full driver detail
```

### Column Alias Mapping
The batch endpoint supports flexible column naming. Common aliases for clinical fields are mapped to the canonical feature names before inference. Missing required columns trigger a structured error response that lists what is missing and what aliases are accepted.

---

## What-If Simulation

The What-If endpoint takes a `baseline` patient record and a dictionary of `overrides` — a mapping of field names to new values.

### Flow
```
Baseline PredictRequest + Override dict
       │
       ├──▶ Run baseline inference (XGBoost + SHAP)
       │             → baseline_score, baseline_label, baseline_drivers
       │
       └──▶ Merge baseline + overrides → modified input
                     │
                     ▼
             Run updated inference (XGBoost + SHAP)
                     → updated_score, updated_label, updated_drivers
```

### Delta Calculation
```
delta = updated_score - baseline_score
changed_features = [fields present in overrides with value ≠ baseline]
```

The response includes both full prediction results, the delta value, changed features with old/new values, and separate driver lists for before and after — enabling a rich side-by-side comparison in the UI.

---

## Data Handling

### CSV Parsing
The file is read as plain text. Lines are split on `\n`, stripped, and filtered for blank rows. Values are split on `,`. The first row is treated as the header.

### PSV Parsing
Identical to CSV parsing but the delimiter is `|` (pipe character), commonly used in clinical data exports.

### Validation Logic
- All required feature columns must be present (or a recognized alias)
- Numeric values are cast to float; type errors are caught per-row
- Rows that fail validation are recorded in the `errors` array and skipped — the rest of the batch continues
- The response clearly separates `results` from `errors`

---

## UI Interaction Flow

```
User Action (form input, button click, file drop)
       │
       ▼
React state update (useState / useCallback)
       │
       ▼
API call via typed api.ts client (fetch wrapper with error handling)
       │
       ├── On success → setResult(data) → animate component render
       │
       └── On error → setError(message) + toast notification
```

### Key UI Patterns
- **Optimistic loading** — skeletons replace content immediately on request start
- **Animated results** — `animate-rise` CSS keyframe applied to result panels on appearance
- **Animated numbers** — `AnimatedNumber` component eases numeric transitions for score and probability
- **SHAP ring** — `ScoreRing` SVG uses stroke-dashoffset animation driven by the score value
- **Toast system** — non-blocking success, info, and error notifications with auto-dismiss

---

## Design Decisions

### Why FastAPI?
FastAPI is the fastest Python web framework for I/O-bound workloads, with built-in async support, automatic OpenAPI docs, and first-class Pydantic integration. Model inference is CPU-bound but lightweight enough that sync routes suffice for this scale.

### Why React + TypeScript?
React's component model maps naturally to the multi-panel dashboard layout. TypeScript enforces contract correctness between the API layer and the UI — the same types used in the API response are reflected in frontend interfaces, eliminating an entire class of runtime bugs.

### Why XGBoost?
XGBoost outperforms many deep learning models on tabular clinical data at moderate feature counts. It is fast at inference time (microseconds per row), requires no GPU, and is directly supported by SHAP's `TreeExplainer` for exact (non-approximate) explanations.

### Why SHAP?
SHAP provides theoretically grounded feature attributions with desirable properties (completeness, consistency, local accuracy). `TreeExplainer` is exact for tree-based models, making it significantly faster than kernel-based alternatives. It is the de facto standard for interpretable ML in clinical applications.

### Why Vite?
Vite provides near-instant HMR (Hot Module Replacement) and build times that make iterative UI development fast. The built-in proxy support eliminates CORS configuration during development.

### Why Tailwind CSS?
Tailwind enables consistent, token-based styling without a component library dependency. Every spacing, color, and radius value is drawn from a shared scale, making the UI visually consistent without custom CSS management overhead.

---

## Limitations

These are honest assessments of the current demo scope:

| Limitation | Description |
|---|---|
| **No real clinical data** | The model is trained on a research or synthetic dataset. Performance on live hospital data has not been validated. |
| **No streaming input** | Vitals are entered manually or via file upload. Real hospital systems stream continuous sensor data. |
| **No authentication** | The demo API has no access control. Production deployment would require auth, RBAC, and audit logging. |
| **No data persistence** | Predictions are not stored. There is no patient history, session management, or longitudinal tracking. |
| **Single-model architecture** | The system uses one pre-trained model. Production would benefit from model versioning, A/B testing, and drift detection. |
| **Threshold is fixed** | The classification threshold is set at training time. Clinical deployment requires calibration against local patient populations and workflows. |
| **Limited input validation** | Current validation checks type and presence. Range-based clinical plausibility checks (e.g. HR > 300 is physiologically impossible) are not exhaustive. |

---

## Future Improvements

### Short-Term
- **EHR integration** — Connect to FHIR APIs to pull patient data automatically into the prediction interface
- **Alert system** — Push notifications when batch results contain HIGH-risk patients above a defined threshold
- **User authentication** — Role-based access for clinicians, administrators, and researchers

### Medium-Term
- **Real-time streaming** — WebSocket-based updates from ICU monitoring systems
- **Model retraining pipeline** — Automated retraining on new labeled data with drift detection and rollback
- **Clinician feedback loop** — Allow clinicians to annotate predictions (agree / disagree) to generate training signal

### Long-Term
- **Multimodal input** — Incorporate imaging results, ECG data, and clinical notes via NLP
- **Population dashboards** — Unit-level and ward-level risk views for charge nurses and administrators
- **Regulatory compliance** — FDA SaMD (Software as a Medical Device) pathway preparation, including clinical validation studies
- **Federated learning** — Train across hospital systems without sharing raw patient data
