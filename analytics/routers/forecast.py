"""
Spending Forecast Router
=========================
Phase 3 deliverable: forecasts next-month spending per category.

Strategy:
  - Baseline: last-month's actual value (naive)
  - Advanced: Prophet time-series model (install prophet separately)

The endpoint always works — it gracefully falls back to the naive
baseline if Prophet is not installed.

Endpoint:
  POST /ml/forecast   - forecast next month's spend for a category
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Request / Response schemas ────────────────────────────────────────────────

class HistoryPoint(BaseModel):
    """A monthly spending data point: ISO date string + amount."""
    ds: str    # e.g. "2026-10-01"
    y: float   # e.g. 5200.0


class ForecastRequest(BaseModel):
    category: str
    history: list[HistoryPoint]    # at least 2 months of data


class ForecastResponse(BaseModel):
    category: str
    predicted: float
    lower: float
    upper: float
    method: str    # "prophet" | "naive"


# ── Forecast logic ────────────────────────────────────────────────────────────

def _naive_forecast(history: list[HistoryPoint]) -> tuple[float, float, float]:
    """Simple average of the last 3 months (or all data if < 3)."""
    recent = [pt.y for pt in history[-3:]]
    avg = sum(recent) / len(recent)
    std = (sum((v - avg) ** 2 for v in recent) / len(recent)) ** 0.5
    return round(avg, 2), round(max(0, avg - std), 2), round(avg + std, 2)


def _prophet_forecast(history: list[HistoryPoint]) -> Optional[tuple[float, float, float]]:
    """Use Prophet if installed; return None if not available."""
    try:
        import pandas as pd
        from prophet import Prophet  # type: ignore

        df = pd.DataFrame([{"ds": pt.ds, "y": pt.y} for pt in history])
        df["ds"] = pd.to_datetime(df["ds"])

        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=False,
            daily_seasonality=False,
            uncertainty_samples=500,
        )
        model.fit(df)
        future = model.make_future_dataframe(periods=1, freq="MS")
        forecast = model.predict(future)
        last = forecast.iloc[-1]
        return (
            round(float(last["yhat"]), 2),
            round(float(max(0, last["yhat_lower"])), 2),
            round(float(last["yhat_upper"]), 2),
        )
    except ImportError:
        logger.info("[forecast] Prophet not installed — falling back to naive")
        return None
    except Exception as e:
        logger.warning("[forecast] Prophet failed: %s — falling back to naive", e)
        return None


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/forecast", response_model=ForecastResponse)
def forecast_spending(payload: ForecastRequest):
    """Forecast next month's spend for a category using Prophet or naive baseline."""
    if len(payload.history) < 2:
        # Not enough data
        last_val = payload.history[0].y if payload.history else 0.0
        return ForecastResponse(
            category=payload.category,
            predicted=last_val,
            lower=last_val,
            upper=last_val,
            method="naive",
        )

    # Try Prophet first
    prophet_result = _prophet_forecast(payload.history)
    if prophet_result:
        predicted, lower, upper = prophet_result
        method = "prophet"
    else:
        predicted, lower, upper = _naive_forecast(payload.history)
        method = "naive"

    return ForecastResponse(
        category=payload.category,
        predicted=predicted,
        lower=lower,
        upper=upper,
        method=method,
    )
