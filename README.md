# CodeBlue AI Hackathon Demo

A polished hackathon demo of the CodeBlue AI sepsis risk workflow with a FastAPI backend, a React + TypeScript frontend, live manual prediction, what-if simulation, and batch file upload inference powered by the real model pipeline.

## Quick Start

```bash
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..
npm install
npm run dev
```

Services:
- Frontend: `http://localhost:3000`
- Backend API and docs: `http://localhost:8000/docs`

Optional launcher:

```bash
python run_demo.py
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Premium model status dashboard with quick navigation |
| Model Lab | `/model-lab` | Manual prediction and batch file upload inference in one workspace |
| What-If | `/what-if` | Baseline vs override comparison with before/after delta cards |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, FastAPI, Uvicorn |
| ML | XGBoost, SHAP |
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |

## Manual Setup

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check and model status |
| `GET` | `/api/model/status` | Model metadata |
| `POST` | `/api/model/predict` | Single manual prediction |
| `POST` | `/api/model/predict-file` | Batch prediction from `.csv` or `.psv` upload |
| `POST` | `/api/model/what-if` | Baseline vs modified comparison |
| `GET` | `/api/presets` | Demo patient presets |

## Demo Highlights

- Premium dark UI tuned for hackathon demos
- Manual single-patient inference with explanation summary and top drivers
- Batch inference from uploaded `.csv` and `.psv` files
- What-if simulation for before/after clinical scenarios
- Automatic smooth scroll to results after prediction, batch scoring, and simulation
- Built-in sample files for quick live demos

## Model Lab UX

- `Manual Input` and `File Upload` modes live on the same page
- On desktop, inputs stay on the left and results stay top-visible on the right
- After `Run Prediction` or `Run Batch Prediction`, the app automatically scrolls to the result panel
- Result cards surface the score, label, threshold, explanation, and top drivers without requiring manual hunting

## File Upload Inference

- Supported formats: `.csv`, `.psv`
- File must include the live model input columns:
  `HR`, `MAP`, `Temp`, `Resp`, `O2Sat`, `Lactate`, `WBC`, `Creatinine`, `Age`, `Gender`, `HoursAdmitted`
- Upload through `Model Lab -> File Upload`
- Run predictions and inspect row-level results in the batch table
- CSV uses comma separators
- PSV uses pipe separators
- Header matching is case-insensitive and supports common aliases such as `hours_admitted`, `Hours Admitted`, `ICULOS`, and `HospAdmTime`
- Header normalization trims whitespace and removes UTF-8 BOM characters when present
- Common missing cell values such as blank, `nan`, `NaN`, `null`, `none`, `na`, and `n/a` are treated as missing upload values
- Sparse rows fall back to the existing `PredictRequest` defaults before real model inference
- Sample files are available in `frontend/public/samples/`

### Required Upload Schema

Canonical columns expected by the upload endpoint:

- `HR`
- `MAP`
- `Temp`
- `Resp`
- `O2Sat`
- `Lactate`
- `WBC`
- `Creatinine`
- `Age`
- `Gender`
- `HoursAdmitted`

Accepted aliases include:

- `HR`: `hr`, `heart_rate`, `Heart Rate`
- `MAP`: `map`, `mean_arterial_pressure`, `Mean Arterial Pressure`
- `Temp`: `temp`, `temperature`
- `Resp`: `resp`, `respiratory_rate`
- `O2Sat`: `o2sat`, `spo2`, `SpO2`, `oxygen_saturation`
- `WBC`: `wbc`, `wbc_count`, `WBC Count`, `white_blood_cell_count`
- `HoursAdmitted`: `hours_admitted`, `Hours Admitted`, `hoursadmitted`, `hours_since_admission`, `ICULOS`, `HospAdmTime`

If upload validation fails, the API returns missing columns plus accepted aliases for those fields.

## Result Experience

- Manual predictions show a top-visible result card with:
  - risk ring
  - badge
  - score and threshold
  - compact input snapshot
  - explanation summary
  - top drivers
- Batch predictions show:
  - summary cards for total, processed, failed, and high-risk rows
  - row-level results table
  - optional row detail modal
- What-if simulation auto-scrolls to the comparison cards after a successful run

## Sample Curl Commands

Single prediction:

```bash
curl -X POST http://localhost:8000/api/model/predict \
  -H "Content-Type: application/json" \
  -d "{\"HR\":120,\"MAP\":55,\"Temp\":39.0,\"Resp\":28,\"O2Sat\":91,\"Lactate\":4.0,\"WBC\":18,\"Creatinine\":2.0,\"Age\":65,\"Gender\":\"M\",\"HoursAdmitted\":24}"
```

What-if:

```bash
curl -X POST http://localhost:8000/api/model/what-if \
  -H "Content-Type: application/json" \
  -d "{\"baseline\":{\"HR\":120,\"MAP\":55,\"Temp\":39.0,\"Resp\":28,\"O2Sat\":91,\"Lactate\":4.0,\"WBC\":18,\"Creatinine\":2.0,\"Age\":65,\"Gender\":\"M\",\"HoursAdmitted\":24},\"overrides\":{\"MAP\":72,\"Lactate\":1.5}}"
```

Batch file upload:

```bash
curl -X POST http://localhost:8000/api/model/predict-file \
  -F "file=@frontend/public/samples/sample_mixed_risk.csv"
```

## Project Structure

```text
hackathon-demo/
|-- backend/
|   |-- main.py
|   |-- requirements.txt
|   `-- app/
|       |-- model.py
|       |-- routes.py
|       |-- schemas.py
|       `-- presets.py
|-- frontend/
|   |-- public/
|   |   `-- samples/
|   |-- index.html
|   `-- src/
|       |-- api.ts
|       |-- types.ts
|       |-- components/
|       `-- pages/
`-- README.md
```
