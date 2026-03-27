"""
CodeBlue AI — Hackathon Demo Backend
Minimal FastAPI app that loads the existing trained model and exposes
prediction + what-if endpoints. No auth, no DB, no heavy dependencies.
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.model import load_model_bundle, ModelBundle
from app.routes import router, set_bundle

# ── Globals ──────────────────────────────────────────────────────────────────
bundle: ModelBundle | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global bundle
    bundle = load_model_bundle()
    set_bundle(bundle)
    app.state.bundle = bundle
    yield


app = FastAPI(
    title="CodeBlue AI — Hackathon Demo",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
