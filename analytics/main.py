"""
WIMG Analytics Microservice
============================
A FastAPI microservice that powers the ML features of the
"Where Is My Money Going?" application.

Services exposed:
  /ml/categorize   - Expense auto-categorisation (NB vs LR)
  /ml/forecast     - Spending forecast per category (Prophet vs naive)
  /ml/anomaly      - Unusual transaction detection (Z-score)
  /ml/health-score - Composite Financial Health Score
  /ml/recurring    - Recurring/subscription transaction detection
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import categorize, forecast, anomaly, health_score, recurring

app = FastAPI(
    title="WIMG Analytics Service",
    description="ML microservice for the Where Is My Money Going? personal finance app.",
    version="1.0.0",
)

# CORS: only allow requests from the Node backend
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(categorize.router, prefix="/ml", tags=["Categorisation"])
app.include_router(forecast.router, prefix="/ml", tags=["Forecasting"])
app.include_router(anomaly.router, prefix="/ml", tags=["Anomaly Detection"])
app.include_router(health_score.router, prefix="/ml", tags=["Health Score"])
app.include_router(recurring.router, prefix="/ml", tags=["Recurring Transactions"])


@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe used by Render and the Node backend."""
    return {"status": "ok", "service": "wimg-analytics", "version": "1.0.0"}
