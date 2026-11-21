"""
Financial Health Score Router
==============================
Phase 5 deliverable: computes a composite Financial Health Score (0–100)
from the user's financial data.

Score Components:
  1. Savings Rate       (25%) - (income - expenses) / income, target ≥ 20%
  2. Budget Adherence   (20%) - categories within budget / total budgeted categories
  3. Emergency Fund     (20%) - savings balance / avg_monthly_expense, target ≥ 3 months
  4. Debt Ratio         (15%) - loan repayments / income, target ≤ 30%
  5. Investment Rate    (20%) - SIP/investment amount / income, target ≥ 10%

Score Bands:
  0–40   → Critical
  41–65  → Needs Attention
  66–80  → Good
  81–100 → Excellent

Endpoint:
  POST /ml/health-score   - compute financial health score
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class HealthScoreRequest(BaseModel):
    monthly_income: float
    monthly_expenses: float
    monthly_investment: float       # SIP + any investment transactions
    monthly_loan_repayment: float   # EMI / debt payments (0 if none)
    savings_balance: float          # emergency fund / savings account balance
    categories_in_budget: int       # how many budget categories were respected
    total_budget_categories: int    # total categories with a set budget


class ComponentScore(BaseModel):
    name: str
    score: float         # 0–100
    weight: float        # 0–1
    weighted: float      # score * weight
    insight: str


class HealthScoreResponse(BaseModel):
    total_score: float
    band: str                       # "Critical" | "Needs Attention" | "Good" | "Excellent"
    band_color: str                 # "red" | "yellow" | "green" | "emerald"
    components: list[ComponentScore]
    summary: str


# ── Scoring helpers ───────────────────────────────────────────────────────────

def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _savings_rate_score(income: float, expenses: float) -> tuple[float, str]:
    if income <= 0:
        return 0.0, "No income recorded."
    rate = (income - expenses) / income
    # 20%+ rate = 100 pts; 0% = 0 pts; scale linearly
    score = _clamp(rate / 0.20 * 100)
    if rate >= 0.20:
        insight = f"Great! You saved {rate*100:.0f}% of income (target: 20%+)."
    elif rate > 0:
        insight = f"You saved {rate*100:.0f}% of income. Aim for 20%+."
    else:
        insight = "Expenses exceed income this month. Review your spending."
    return round(score, 1), insight


def _budget_adherence_score(in_budget: int, total: int) -> tuple[float, str]:
    if total == 0:
        return 50.0, "No budgets set yet. Create budgets to track adherence."
    ratio = in_budget / total
    score = _clamp(ratio * 100)
    insight = f"{in_budget}/{total} budget categories stayed within limits."
    return round(score, 1), insight


def _emergency_fund_score(savings_balance: float, monthly_expenses: float) -> tuple[float, str]:
    if monthly_expenses <= 0:
        return 50.0, "No monthly expenses recorded."
    months_covered = savings_balance / monthly_expenses
    # 6 months = 100 pts; scale linearly; target = 3 months
    score = _clamp(months_covered / 6.0 * 100)
    insight = (
        f"Emergency fund covers {months_covered:.1f} months of expenses "
        f"({'✓ target met' if months_covered >= 3 else 'target: 3+ months'})."
    )
    return round(score, 1), insight


def _debt_ratio_score(loan_repayment: float, income: float) -> tuple[float, str]:
    if income <= 0:
        return 0.0, "No income recorded."
    ratio = loan_repayment / income
    # 0% debt = 100 pts; 30% debt = 0 pts
    score = _clamp((1 - ratio / 0.30) * 100)
    if ratio == 0:
        insight = "No loan repayments — excellent debt position."
    elif ratio <= 0.30:
        insight = f"Loan EMIs are {ratio*100:.0f}% of income (safe limit: 30%)."
    else:
        insight = f"⚠️ Loan EMIs are {ratio*100:.0f}% of income — above the safe 30% limit."
    return round(score, 1), insight


def _investment_rate_score(investment: float, income: float) -> tuple[float, str]:
    if income <= 0:
        return 0.0, "No income recorded."
    rate = investment / income
    # 10%+ = 100 pts; scale linearly
    score = _clamp(rate / 0.10 * 100)
    if rate >= 0.10:
        insight = f"You invest {rate*100:.0f}% of income (target: 10%+). Keep it up!"
    elif rate > 0:
        insight = f"You invest {rate*100:.0f}% of income. Aim for 10%+ via SIPs."
    else:
        insight = "No investments recorded. Start a SIP to build long-term wealth."
    return round(score, 1), insight


def _band(score: float) -> tuple[str, str]:
    if score >= 81:
        return "Excellent", "emerald"
    elif score >= 66:
        return "Good", "green"
    elif score >= 41:
        return "Needs Attention", "yellow"
    else:
        return "Critical", "red"


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/health-score", response_model=HealthScoreResponse)
def compute_health_score(payload: HealthScoreRequest):
    """Compute a composite Financial Health Score (0–100)."""

    weights = {
        "Savings Rate":     0.25,
        "Budget Adherence": 0.20,
        "Emergency Fund":   0.20,
        "Debt Ratio":       0.15,
        "Investment Rate":  0.20,
    }

    s1, i1 = _savings_rate_score(payload.monthly_income, payload.monthly_expenses)
    s2, i2 = _budget_adherence_score(payload.categories_in_budget, payload.total_budget_categories)
    s3, i3 = _emergency_fund_score(payload.savings_balance, payload.monthly_expenses)
    s4, i4 = _debt_ratio_score(payload.monthly_loan_repayment, payload.monthly_income)
    s5, i5 = _investment_rate_score(payload.monthly_investment, payload.monthly_income)

    components_data = [
        ("Savings Rate",     weights["Savings Rate"],     s1, i1),
        ("Budget Adherence", weights["Budget Adherence"], s2, i2),
        ("Emergency Fund",   weights["Emergency Fund"],   s3, i3),
        ("Debt Ratio",       weights["Debt Ratio"],       s4, i4),
        ("Investment Rate",  weights["Investment Rate"],  s5, i5),
    ]

    components = [
        ComponentScore(
            name=name,
            score=score,
            weight=weight,
            weighted=round(score * weight, 2),
            insight=insight,
        )
        for name, weight, score, insight in components_data
    ]

    total = round(sum(c.weighted for c in components), 1)
    band, color = _band(total)

    summary_map = {
        "Excellent":       "Your finances are in excellent shape. Keep up the great habits!",
        "Good":            "You're doing well. A few tweaks will push you to excellent.",
        "Needs Attention": "Some areas need attention. Focus on the lowest-scoring components.",
        "Critical":        "Your financial health needs urgent attention. Start with savings and budgets.",
    }

    return HealthScoreResponse(
        total_score=total,
        band=band,
        band_color=color,
        components=components,
        summary=summary_map[band],
    )
