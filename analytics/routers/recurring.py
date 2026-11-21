"""
Recurring Transaction Detector Router
=======================================
Phase 5 deliverable: detects recurring/subscription transactions by
analysing the interval between repeated merchant payments.

Algorithm:
  1. Group transactions by normalised merchant description
  2. Compute intervals between consecutive transactions (in days)
  3. Flag as recurring if:
     - At least 2 occurrences, AND
     - Mean interval is ≈ 30 days (±10 days tolerance)
  4. Predict next_due_date = last_date + mean_interval

Endpoint:
  POST /ml/recurring   - detect recurring transactions from history
"""

import logging
import re
from datetime import date, timedelta
from collections import defaultdict
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

MONTHLY_INTERVAL_MIN = 20   # days
MONTHLY_INTERVAL_MAX = 40   # days

# ── Schemas ───────────────────────────────────────────────────────────────────

class TransactionRecord(BaseModel):
    description: str
    amount: float
    date: str        # ISO date: "2026-10-15"
    category: str


class RecurringTransaction(BaseModel):
    description: str
    amount: float
    category: str
    frequency: str              # "monthly"
    mean_interval_days: float
    last_date: str
    next_due_date: str
    occurrences: int


class RecurringRequest(BaseModel):
    transactions: list[TransactionRecord]


class RecurringResponse(BaseModel):
    recurring: list[RecurringTransaction]
    count: int


# ── Normalisation ─────────────────────────────────────────────────────────────

def _normalise(description: str) -> str:
    """Lowercase, strip amounts/dates/noise, keep merchant name core."""
    text = description.lower().strip()
    text = re.sub(r"\d{4,}", "", text)           # remove long numbers
    text = re.sub(r"[^a-z\s]", "", text)         # keep only letters + spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Detection logic ───────────────────────────────────────────────────────────

def _detect_recurring(transactions: list[TransactionRecord]) -> list[RecurringTransaction]:
    # Group by normalised description
    groups: dict[str, list[TransactionRecord]] = defaultdict(list)
    for tx in transactions:
        key = _normalise(tx.description)
        if key:
            groups[key].append(tx)

    results: list[RecurringTransaction] = []

    for key, txs in groups.items():
        if len(txs) < 2:
            continue

        # Sort by date ascending
        sorted_txs = sorted(txs, key=lambda t: t.date)
        dates = [date.fromisoformat(t.date) for t in sorted_txs]

        intervals = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
        mean_interval = sum(intervals) / len(intervals)

        if MONTHLY_INTERVAL_MIN <= mean_interval <= MONTHLY_INTERVAL_MAX:
            last_date = dates[-1]
            next_due = last_date + timedelta(days=round(mean_interval))
            avg_amount = sum(t.amount for t in sorted_txs) / len(sorted_txs)

            results.append(RecurringTransaction(
                description=sorted_txs[-1].description,
                amount=round(avg_amount, 2),
                category=sorted_txs[-1].category,
                frequency="monthly",
                mean_interval_days=round(mean_interval, 1),
                last_date=str(last_date),
                next_due_date=str(next_due),
                occurrences=len(sorted_txs),
            ))

    # Sort by next_due_date ascending (most urgent first)
    results.sort(key=lambda r: r.next_due_date)
    return results


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/recurring", response_model=RecurringResponse)
def detect_recurring(payload: RecurringRequest):
    """Detect recurring/subscription transactions from a list of transactions."""
    recurring = _detect_recurring(payload.transactions)
    return RecurringResponse(recurring=recurring, count=len(recurring))
