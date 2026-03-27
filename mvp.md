# MVP Definition — CodeBlue AI

---

## Objective

Define the minimum working version of CodeBlue AI that demonstrates real clinical value, is stable enough for a live demo, and communicates the product vision clearly to judges, clinicians, and technical reviewers in under two minutes.

---

## Core Features (Must-Have)

### Prediction Engine
- Real-time sepsis risk prediction from patient vitals and lab values
- XGBoost model inference returning a risk score (0–100), probability, and a risk label: **LOW / MEDIUM / HIGH**
- Configurable classification threshold

### Model Lab — Manual Input
- Form-based input for all clinical parameters (heart rate, MAP, temperature, respiratory rate, SpO2, lactate, WBC, creatinine, age, gender, hours admitted)
- Sample patient presets for rapid demo loading
- Instant prediction on submit with animated result panel

### Model Lab — Batch File Upload
- Upload CSV or PSV files containing multiple patient rows
- Row-level inference with per-row results, labels, and top drivers
- Summary statistics (total rows, processed, failed, high-risk count)
- JSON export of full batch output
- Drill-down modal for any individual row

### What-If Simulator
- Load a baseline patient profile
- Toggle individual fields between baseline and override values
- Re-run the model and display a side-by-side comparison
- Show delta score, percentage change, changed features, and updated driver analysis

### Explainability (SHAP)
- Top risk-contributing features displayed per prediction
- Direction indicator (increasing or decreasing risk)
- Impact magnitude with visual progress bars
- Natural language summary per prediction

### UI Dashboard
- Home page with live model health and status metadata
- Consistent dark-mode design across all pages
- Toast notifications, loading skeletons, empty states, and error handling
- Fully responsive layout

---

## What Is NOT Included in the MVP

| Excluded Feature | Reason |
|---|---|
| Hospital EHR integration | Requires institutional access and compliance work |
| Real-time device streaming | Outside hackathon scope; infrastructure-intensive |
| User authentication | No multi-user use case in this demo context |
| Large-scale cloud deployment | Single-instance demo environment only |
| Model retraining pipeline | Inference-only; model is pre-trained |
| HIPAA / data compliance layer | Demo uses synthetic or anonymized data only |
| Alert / notification systems | Future feature beyond current scope |
| Mobile native application | Web-first; responsive design covers mobile viewing |

---

## Success Criteria

The MVP is considered successful if:

1. **Predictions are reliable** — The model returns consistent, clinically reasonable scores for all valid inputs
2. **Manual flow works end-to-end** — A judge can enter vitals, run prediction, and read a result in under 30 seconds
3. **Batch upload works** — A CSV file can be uploaded, processed, and results displayed without error
4. **What-If simulation is clear** — The before/after comparison is immediately readable
5. **Explainability is visible** — At least three top risk drivers are shown per prediction with direction and magnitude
6. **Value is understood in < 2 minutes** — A non-technical observer can grasp what the system does and why it matters

---

## Demo Scope

The following sequence defines exactly what will be shown during the hackathon presentation:

### Step 1 — Home Page
- Show model status card: loaded, version, feature count, threshold
- Navigate to Model Lab

### Step 2 — Manual Prediction
- Load a high-risk patient preset (e.g. sepsis-positive profile)
- Walk through vitals and lab values briefly
- Run prediction → show animated risk ring, HIGH label, probability
- Point to top SHAP drivers and natural language summary

### Step 3 — Batch Inference
- Switch to File Upload mode
- Upload a pre-prepared CSV with mixed-risk rows
- Run batch prediction → show summary stats and results table
- Click a HIGH-risk row to open drill-down modal

### Step 4 — What-If Simulation
- Load same high-risk baseline
- Toggle 2–3 clinical values (e.g. lower lactate, improve O2Sat)
- Run simulation → show score drop from HIGH to MEDIUM or LOW
- Highlight the delta card and changed features panel

### Total estimated demo time: **4–6 minutes**
