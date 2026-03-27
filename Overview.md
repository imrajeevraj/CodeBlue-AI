# CodeBlue AI — Project Overview

> Real-time sepsis risk prediction with interpretable drivers and interactive treatment simulation.

---

## The Problem

Sepsis is one of the leading causes of preventable death in hospitals worldwide. It kills approximately **11 million people per year** and accounts for nearly 20% of all global deaths. Yet early detection dramatically improves survival rates — identifying sepsis just one hour earlier can reduce mortality risk significantly.

The challenge is not a lack of data. Hospital patients are surrounded by sensors and labs generating continuous readings. The challenge is **making sense of that data in real time**, in a way that a busy clinician can act on immediately.

Current tools fall short in two critical ways:

1. **No real-time synthesis** — clinicians must manually review multiple vitals and labs across different systems
2. **No transparency** — when prediction systems do exist, they are black boxes that offer a score but no explanation of *why*

Clinicians cannot act on a number alone. They need to understand what's driving the risk.

---

## The Solution

**CodeBlue AI** is a clinical intelligence platform that delivers real-time sepsis risk prediction with full explainability — directly in the browser, with no hardware or integration required for the demo.

Given a patient's current vitals and lab values, CodeBlue AI:

- Produces an interpretable **risk score** (0–100)
- Classifies the patient as **LOW, MEDIUM, or HIGH** risk
- Shows the **top contributing clinical factors** with direction and magnitude
- Generates a **natural language summary** of the prediction
- Allows clinicians to run **"what-if" simulations** to see how specific interventions would change the outcome

The result is a tool that is **fast, transparent, and actionable**.

---

## Key Features

### Model Lab — Manual Input
Enter individual patient data using intuitive sliders and numeric inputs. Load pre-built patient profiles for rapid testing. Run instant predictions and see the full breakdown: score, label, probability, drivers, and summary — all in one panel.

### Model Lab — Batch File Upload
Upload a CSV or PSV file with multiple patient rows. The system processes every row through the live model and returns row-level predictions, a summary table, error reporting for invalid rows, and JSON export. Any row can be clicked to open a full drill-down view.

### What-If Simulator
Start with a baseline patient profile. Toggle individual vitals or lab values to "override" mode and adjust them to simulate a clinical intervention. Run the model again and compare the before/after side by side — score delta, changed features, driver shift, and updated summary.

### Explainability (SHAP)
Every prediction includes a ranked list of the top clinical drivers — the features that contributed most to moving the score up or down. This is powered by SHAP (SHapley Additive exPlanations), the industry standard for interpretable ML. Clinicians see not just *what* the risk is, but *why*.

---

## How It Works

```
Patient Data Input
       │
       ▼
FastAPI Backend (REST endpoint)
       │
       ▼
Feature Preprocessing & Validation
       │
       ▼
XGBoost Model Inference
       │
       ▼
SHAP Explainability Engine
       │
       ▼
Risk Score + Label + Drivers + Summary
       │
       ▼
React Frontend (Visualization + Interaction)
```

The entire inference pipeline — from input to result — completes in **under one second**.

---

## Why It Matters

| Impact Area | CodeBlue AI Contribution |
|---|---|
| **Early Detection** | Identify high-risk patients before clinical deterioration |
| **Clinician Confidence** | Explainable outputs that clinicians can reason about |
| **Treatment Simulation** | Test "what if we improve X?" without waiting for real outcomes |
| **Batch Screening** | Process entire patient cohorts in seconds |
| **Decision Support** | Not a replacement for clinicians — a tool that augments their judgment |

Even a one-hour improvement in sepsis detection time translates directly to lives saved. CodeBlue AI is designed to make that improvement possible at scale.

---

## Key Differentiators

**Explainability by design, not as an afterthought**
Every prediction comes with SHAP-powered driver analysis. Clinicians are shown exactly which vitals or labs are elevating the risk, and by how much.

**Interactive simulation**
The What-If Simulator is not a common feature in clinical prediction tools. It allows clinicians and researchers to interrogate the model interactively — testing hypothetical interventions before applying them.

**Batch and real-time support in one interface**
CodeBlue AI handles both individual patient scoring (manual input) and population-level screening (file upload) within the same application.

**Demo-ready and deployable**
No hardware, no hospital IT integration, no setup friction. The system runs in the browser with a single command and is immediately demonstrable.

---

## Demo Walkthrough

### 1. Open the Home Page
View the live model status — loaded, version, feature count, and alert threshold — confirming the system is operational.

### 2. Navigate to Model Lab
Select Manual Input mode. Load a high-risk patient preset (sepsis-positive profile with elevated lactate, low MAP, high heart rate).

### 3. Run a Prediction
Click **Run Prediction**. Watch the animated risk ring fill to a HIGH score. See the probability reading, the RiskBadge classification, and the natural language summary.

### 4. Review SHAP Drivers
Scroll to the Top Risk Drivers panel. Observe which clinical values are driving the risk upward (e.g. Lactate, Heart Rate) and which are moderate (e.g. Temperature).

### 5. Switch to Batch Upload
Upload a CSV file with 10 mixed-risk patient rows. Click **Run Batch Prediction**. See the summary: 10 processed, 4 HIGH risk, 0 failed. Click a HIGH-risk row to open the full drill-down view.

### 6. Navigate to What-If Simulator
Load the same high-risk baseline. Toggle Lactate and MAP to override mode. Reduce Lactate from 4.2 to 1.5 and improve MAP from 55 to 75. Click **Simulate Impact**.

### 7. Review the Comparison
Observe the before card (HIGH, score 82) and after card (MEDIUM, score 54). The delta card shows −28 points, −34%. Changed features are highlighted. Driver lists show the shift in contributing factors.

**Total walkthrough time: approximately 5 minutes.**

---

## Team & Context

Built as a hackathon demonstration of what clinical AI can look like when explainability, usability, and real-time inference are treated as first-class requirements — not optional features.
