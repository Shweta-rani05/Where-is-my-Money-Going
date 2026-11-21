"""
Anomaly Detection Router
=========================
Phase 3 deliverable: detects unusually large transactions using a
Z-score statistical method.

A transaction is flagged as anomalous if its amount is more than
THRESHOLD standard deviations above the mean for that category.

Endpoint:
  POST /ml/anomaly   - detect if a transaction amount is unusual
"""

import logging
import math
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

THRESHOLD = 2.0  # Z-score cutoff (2 SD = ~95th percentile)

# ── Schemas ───────────────────────────────────────────────────────────────────

class AnomalyRequest(BaseModel):
    amount: float
    category: str
    history_amounts: list[float]  # past amounts for same category


class AnomalyResponse(BaseModel):
    is_anomaly: bool
    z_score: float
    threshold: float
    message: str


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/anomaly", response_model=AnomalyResponse)
def detect_anomaly(payload: AnomalyRequest):
    """
    Uses Z-score method to detect if a transaction amount is unusual
    compared to the user's historical spend in the same category.
    """
    history = payload.history_amounts

    if len(history) < 3:
        # Not enough history to make a meaningful judgment
        return AnomalyResponse(
            is_anomaly=False,
            z_score=0.0,
            threshold=THRESHOLD,
            message="Insufficient history for anomaly detection.",
        )

    n = len(history)
    mean = sum(history) / n
    variance = sum((x - mean) ** 2 for x in history) / n
    std = math.sqrt(variance)

    if std == 0:
        z_score = 0.0
    else:
        z_score = abs((payload.amount - mean) / std)

    is_anomaly = z_score > THRESHOLD

    if is_anomaly:
        message = (
            f"⚠️ Unusual {payload.category} spend of ₹{payload.amount:,.0f} "
            f"(Z-score: {z_score:.2f}). Your average is ₹{mean:,.0f}."
        )
    else:
        message = f"Normal {payload.category} spend (Z-score: {z_score:.2f})."

    return AnomalyResponse(
        is_anomaly=is_anomaly,
        z_score=round(z_score, 2),
        threshold=THRESHOLD,
        message=message,
    )
