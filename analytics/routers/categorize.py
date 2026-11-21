"""
Expense Categorisation Router
==============================
Phase 2 deliverable: classifies a transaction description into one of
the standard WIMG categories using a trained scikit-learn pipeline.

Endpoints:
  POST /ml/categorize         - categorise a single description
  POST /ml/categorize/batch   - categorise a list of descriptions

Model Training:
  Run `python scripts/train_categorizer.py` to train the model.
  The trained pipeline is saved to models/categorizer/model.pkl
  If the model file is missing, a rule-based fallback is used so the
  service never crashes in a fresh deployment.
"""

import os
import re
import joblib
import logging
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Model & categories ────────────────────────────────────────────────────────

CATEGORIES = [
    "Food", "Rent", "Shopping", "Transport",
    "Bills", "Healthcare", "Entertainment", "Investment", "Salary", "Others",
]

MODEL_PATH = Path(__file__).parent.parent / "models" / "categorizer" / "model.pkl"
_model = None  # lazy-loaded


def _load_model():
    global _model
    if _model is None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
        logger.info("[categorize] Loaded trained model from %s", MODEL_PATH)
    return _model


# ── Rule-based fallback (used before training) ───────────────────────────────

KEYWORD_RULES: list[tuple[str, list[str]]] = [
    ("Food",          ["food", "swiggy", "zomato", "restaurant", "cafe", "lunch", "dinner", "snack", "grocery", "bigbasket", "blinkit"]),
    ("Transport",     ["uber", "ola", "metro", "petrol", "diesel", "auto", "bus", "irctc", "train", "fuel", "rapido"]),
    ("Shopping",      ["amazon", "flipkart", "meesho", "myntra", "ajio", "shopping", "mall", "clothes"]),
    ("Healthcare",    ["pharmacy", "hospital", "clinic", "doctor", "medicine", "apollo", "health"]),
    ("Entertainment", ["netflix", "hotstar", "spotify", "prime", "youtube", "cinema", "pvr", "inox", "game"]),
    ("Bills",         ["electricity", "internet", "wifi", "jio", "airtel", "bsnl", "vodafone", "bill", "recharge", "water"]),
    ("Rent",          ["rent", "house", "flat", "pg", "landlord", "maintenance"]),
    ("Investment",    ["mutual fund", "sip", "nps", "ppf", "zerodha", "groww", "stocks", "shares", "fd", "investment"]),
    ("Salary",        ["salary", "payroll", "stipend", "income", "credit", "employer"]),
]


def _rule_based_classify(description: str) -> str:
    text = description.lower()
    for category, keywords in KEYWORD_RULES:
        if any(kw in text for kw in keywords):
            return category
    return "Others"


def _classify(description: str) -> str:
    model = _load_model()
    if model is not None:
        try:
            return str(model.predict([description])[0])
        except Exception as e:
            logger.warning("[categorize] Model prediction failed: %s — using fallback", e)
    return _rule_based_classify(description)


# ── Request / Response schemas ────────────────────────────────────────────────

class CategoryRequest(BaseModel):
    description: str
    amount: Optional[float] = None  # reserved for future amount-aware model


class CategoryResponse(BaseModel):
    category: str
    confidence: str  # "model" | "rule-based"


class BatchCategoryRequest(BaseModel):
    descriptions: list[str]


class BatchCategoryResponse(BaseModel):
    results: list[CategoryResponse]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/categorize", response_model=CategoryResponse)
def categorize_single(payload: CategoryRequest):
    """Classify a single transaction description into a WIMG category."""
    model = _load_model()
    confidence = "model" if model else "rule-based"
    category = _classify(payload.description)
    return CategoryResponse(category=category, confidence=confidence)


@router.post("/categorize/batch", response_model=BatchCategoryResponse)
def categorize_batch(payload: BatchCategoryRequest):
    """Classify a batch of transaction descriptions."""
    model = _load_model()
    confidence = "model" if model else "rule-based"
    results = [
        CategoryResponse(category=_classify(desc), confidence=confidence)
        for desc in payload.descriptions
    ]
    return BatchCategoryResponse(results=results)
