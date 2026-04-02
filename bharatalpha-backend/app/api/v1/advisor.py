from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.api.v1.router import error_response, success_response

router = APIRouter(prefix="/advisor", tags=["advisor"])

RiskProfileType = Literal["Conservative", "Moderate", "Aggressive"]

# ──────────────────────────────────────────────
# Allocation engine (pure Python, no DB needed)
# ──────────────────────────────────────────────

GOVT_BONDS = [
    {"id": "gb1", "name": "RBI 7.26% G-Sec 2033", "issuer": "Reserve Bank of India",
     "couponRate": 7.26, "yieldToMaturity": 7.18, "creditRating": "Sovereign",
     "type": "G-Sec", "minInvestment": 10000},
    {"id": "gb2", "name": "RBI Savings Bond 8.05% 2031", "issuer": "Reserve Bank of India",
     "couponRate": 8.05, "yieldToMaturity": 8.05, "creditRating": "Sovereign",
     "type": "Savings Bond", "minInvestment": 1000},
    {"id": "gb3", "name": "91-Day Treasury Bill", "issuer": "Government of India",
     "couponRate": 0, "yieldToMaturity": 6.85, "creditRating": "Sovereign",
     "type": "T-Bill", "minInvestment": 25000},
    {"id": "gb4", "name": "Maharashtra SDL 7.45% 2030", "issuer": "State of Maharashtra",
     "couponRate": 7.45, "yieldToMaturity": 7.38, "creditRating": "Sovereign (State)",
     "type": "SDL", "minInvestment": 10000},
]

CORP_BONDS = [
    {"id": "cb1", "name": "HDFC Bank NCD 8.25% 2027", "issuer": "HDFC Bank Ltd",
     "couponRate": 8.25, "yieldToMaturity": 8.10, "creditRating": "AAA"},
    {"id": "cb2", "name": "Power Finance Corp NCD 7.95% 2028", "issuer": "PFC",
     "couponRate": 7.95, "yieldToMaturity": 7.88, "creditRating": "AAA"},
    {"id": "cb3", "name": "Tata Capital NCD 8.50% 2026", "issuer": "Tata Capital",
     "couponRate": 8.50, "yieldToMaturity": 8.42, "creditRating": "AAA"},
    {"id": "cb4", "name": "Bajaj Finance NCD 8.65% 2027", "issuer": "Bajaj Finance",
     "couponRate": 8.65, "yieldToMaturity": 8.55, "creditRating": "AAA"},
]

ETFS = [
    {"id": "etf1", "name": "Nippon India Nifty 50 ETF", "symbol": "NIFTYBEES",
     "category": "Equity", "expenseRatio": 0.04, "returns1Y": 16.2},
    {"id": "etf2", "name": "HDFC Gold ETF", "symbol": "HDFCMFGETF",
     "category": "Gold", "expenseRatio": 0.55, "returns1Y": 18.7},
    {"id": "etf3", "name": "SBI Nifty Bank ETF", "symbol": "SETFNIFBK",
     "category": "Sectoral", "expenseRatio": 0.18, "returns1Y": 12.3},
    {"id": "etf4", "name": "Mirae Asset Silver ETF", "symbol": "SILVERETF",
     "category": "Silver", "expenseRatio": 0.50, "returns1Y": 22.4},
    {"id": "etf5", "name": "Motilal Oswal Nasdaq 100 ETF", "symbol": "MON100",
     "category": "International", "expenseRatio": 0.58, "returns1Y": 24.8},
]

FDS = [
    {"id": "fd1", "bankName": "State Bank of India", "bankType": "Public Sector",
     "bestRate": 7.00, "maxRate": 8.25, "minAmount": 1000, "insuranceCover": 500000},
    {"id": "fd2", "bankName": "HDFC Bank", "bankType": "Private Sector",
     "bestRate": 7.25, "maxRate": 8.50, "minAmount": 5000, "insuranceCover": 500000},
    {"id": "fd3", "bankName": "Ujjivan Small Finance Bank", "bankType": "Small Finance",
     "bestRate": 8.50, "maxRate": 9.00, "minAmount": 1000, "insuranceCover": 500000},
    {"id": "fd4", "bankName": "Bajaj Finance FD", "bankType": "NBFC",
     "bestRate": 8.35, "maxRate": 8.60, "minAmount": 15000, "insuranceCover": 0,
     "creditRating": "AAA (CRISIL)"},
]

STOCKS = [
    {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy",
     "signal": "BUY", "bharatAlphaScore": 84, "expectedReturn": "18-24%"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking",
     "signal": "BUY", "bharatAlphaScore": 88, "expectedReturn": "15-20%"},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT",
     "signal": "HOLD", "bharatAlphaScore": 79, "expectedReturn": "12-16%"},
    {"symbol": "INFY", "name": "Infosys", "sector": "IT",
     "signal": "BUY", "bharatAlphaScore": 81, "expectedReturn": "16-22%"},
    {"symbol": "NTPC", "name": "NTPC Ltd", "sector": "Power",
     "signal": "BUY", "bharatAlphaScore": 73, "expectedReturn": "20-28%"},
    {"symbol": "LT", "name": "Larsen & Toubro", "sector": "Engineering",
     "signal": "BUY", "bharatAlphaScore": 85, "expectedReturn": "16-22%"},
]

MFS = [
    {"id": "mf1", "name": "Mirae Asset Large Cap Fund", "category": "Large Cap",
     "riskLevel": "Moderate", "returns5Y": 14.8, "expenseRatio": 0.54},
    {"id": "mf2", "name": "Parag Parikh Flexi Cap Fund", "category": "Flexi Cap",
     "riskLevel": "Moderate", "returns5Y": 18.2, "expenseRatio": 0.63},
    {"id": "mf3", "name": "Quant ELSS Tax Saver Fund", "category": "ELSS",
     "riskLevel": "Very High", "returns5Y": 24.3, "expenseRatio": 0.75},
    {"id": "mf4", "name": "HDFC Balanced Advantage Fund", "category": "Hybrid",
     "riskLevel": "Moderate", "returns5Y": 13.1, "expenseRatio": 0.71},
    {"id": "mf5", "name": "Navi Nifty 50 Index Fund", "category": "Index",
     "riskLevel": "Moderate", "returns5Y": 13.5, "expenseRatio": 0.06},
    {"id": "mf6", "name": "ICICI Pru Debt Management Fund", "category": "Debt",
     "riskLevel": "Low", "returns5Y": 7.4, "expenseRatio": 0.45},
]


def _build_recommendation(amount: float, horizon_years: int, risk_profile: RiskProfileType) -> dict:
    is_conservative = risk_profile == "Conservative"
    is_aggressive = risk_profile == "Aggressive"
    is_short = horizon_years <= 3
    is_long = horizon_years >= 7

    # Base percentages
    stocks_pct = 55 if is_aggressive else (15 if is_conservative else 35)
    mf_pct = 20 if is_aggressive else (20 if is_conservative else 25)
    govt_bond_pct = 3 if is_aggressive else (22 if is_conservative else 12)
    corp_bond_pct = 2 if is_aggressive else (12 if is_conservative else 7)
    etf_pct = 12 if is_aggressive else (5 if is_conservative else 9)
    fd_pct = 0 if is_aggressive else (18 if is_conservative else 5)
    gold_pct = 5
    silver_pct = 3 if is_aggressive else (3 if is_conservative else 2)

    # Horizon adjustments
    if is_short:
        shift = 10 if is_aggressive else (5 if is_conservative else 8)
        stocks_pct = max(5, stocks_pct - shift)
        mf_pct = max(5, mf_pct - shift // 2)
        fd_pct = min(35, fd_pct + shift)
        govt_bond_pct = min(30, govt_bond_pct + shift // 2)
    elif is_long:
        boost = 8 if is_aggressive else (5 if is_conservative else 7)
        stocks_pct = min(70, stocks_pct + boost)
        mf_pct = min(35, mf_pct + boost // 2)
        fd_pct = max(0, fd_pct - boost)
        govt_bond_pct = max(2, govt_bond_pct - boost // 2)

    total = stocks_pct + mf_pct + govt_bond_pct + corp_bond_pct + etf_pct + fd_pct + gold_pct + silver_pct
    scale = 100 / total
    stocks_pct = round(stocks_pct * scale)
    mf_pct = round(mf_pct * scale)
    govt_bond_pct = round(govt_bond_pct * scale)
    corp_bond_pct = round(corp_bond_pct * scale)
    etf_pct = round(etf_pct * scale)
    fd_pct = round(fd_pct * scale)
    gold_pct = round(gold_pct * scale)
    silver_pct = 100 - stocks_pct - mf_pct - govt_bond_pct - corp_bond_pct - etf_pct - fd_pct - gold_pct

    def amt(pct: int) -> int:
        return round(amount * pct / 100)

    risk_score = 74 if is_aggressive else (24 if is_conservative else 50)
    exp_ret = {"min": 16, "max": 26} if is_aggressive else ({"min": 8, "max": 12} if is_conservative else {"min": 12, "max": 18})

    allocation = [
        {"name": "Direct Stocks", "pct": stocks_pct, "amount": amt(stocks_pct), "color": "#3B82F6",
         "icon": "📈", "expectedReturn": "18–28%" if is_aggressive else ("10–14%" if is_conservative else "14–20%")},
        {"name": "Mutual Funds", "pct": mf_pct, "amount": amt(mf_pct), "color": "#00C896",
         "icon": "🏦", "expectedReturn": "16–24%" if is_aggressive else ("9–13%" if is_conservative else "13–18%")},
        {"name": "Govt Bonds", "pct": govt_bond_pct, "amount": amt(govt_bond_pct), "color": "#06B6D4",
         "icon": "🏛️", "expectedReturn": "7.0–8.1%"},
        {"name": "Corp Bonds", "pct": corp_bond_pct, "amount": amt(corp_bond_pct), "color": "#8B5CF6",
         "icon": "🏢", "expectedReturn": "7.8–8.7%"},
        {"name": "ETFs", "pct": etf_pct, "amount": amt(etf_pct), "color": "#F59E0B",
         "icon": "⚡", "expectedReturn": "14–22%" if is_aggressive else ("8–12%" if is_conservative else "12–17%")},
        {"name": "Fixed Deposits", "pct": fd_pct, "amount": amt(fd_pct), "color": "#10B981",
         "icon": "🔒", "expectedReturn": "6.8–8.5%"},
        {"name": "Gold", "pct": gold_pct, "amount": amt(gold_pct), "color": "#F59E0B",
         "icon": "🪙", "expectedReturn": "10–14%"},
        {"name": "Silver", "pct": silver_pct, "amount": amt(silver_pct), "color": "#94A3B8",
         "icon": "🥈", "expectedReturn": "8–20%"},
    ]
    allocation = [a for a in allocation if a["pct"] > 0]

    stock_count = 5 if is_aggressive else (3 if is_conservative else 4)
    bond_count = 1 if is_aggressive else (3 if is_conservative else 2)
    etf_count = 4 if is_aggressive else (2 if is_conservative else 3)
    fd_count = 0 if is_aggressive else (4 if is_conservative else 2)

    mf_ids = (["mf3", "mf1", "mf2", "mf5"] if is_aggressive else (["mf6", "mf4", "mf5"] if is_conservative else ["mf2", "mf5", "mf4", "mf1"]))

    return {
        "riskProfile": risk_profile,
        "amount": amount,
        "horizonYears": horizon_years,
        "riskScore": risk_score,
        "expectedReturnRange": exp_ret,
        "allocation": allocation,
        "recommendedStocks": STOCKS[:stock_count],
        "recommendedMFs": [m for m in MFS if m["id"] in mf_ids],
        "recommendedGovtBonds": GOVT_BONDS[:bond_count],
        "recommendedCorpBonds": CORP_BONDS[:bond_count],
        "recommendedETFs": ETFS[:etf_count],
        "recommendedFDs": FDS[:fd_count] if fd_pct > 0 else [],
        "goldAmount": amt(gold_pct),
        "silverAmount": amt(silver_pct),
    }


# ──────────────────────────────────────────────
# Request / Response Models
# ──────────────────────────────────────────────

class RecommendRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Investment amount in INR")
    horizonYears: int = Field(..., ge=1, le=30, description="Investment horizon in years")
    riskProfile: RiskProfileType = Field(..., description="Risk profile: Conservative / Moderate / Aggressive")


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.post("/recommend")
async def recommend(body: RecommendRequest, request: Request):
    if body.amount < 1000:
        return error_response("INVALID_AMOUNT", "Minimum investment amount is ₹1,000", status_code=400)
    data = _build_recommendation(body.amount, body.horizonYears, body.riskProfile)
    return success_response(request, data, data_source="bharatalpha-engine")


@router.get("/profiles")
async def get_profiles(request: Request):
    """Return description of each risk profile for UI display."""
    return success_response(request, {
        "profiles": [
            {
                "id": "Conservative",
                "label": "Conservative",
                "icon": "🛡️",
                "description": "Capital preservation. Bonds & FDs dominate. Suitable for short horizons or low risk tolerance.",
                "expectedReturn": "8–12% CAGR",
                "riskScore": 24,
                "color": "#10B981",
            },
            {
                "id": "Moderate",
                "label": "Moderate",
                "icon": "⚖️",
                "description": "Balanced growth. Mix of equity, bonds and commodities. Best for 5–10 year horizons.",
                "expectedReturn": "12–18% CAGR",
                "riskScore": 50,
                "color": "#F59E0B",
            },
            {
                "id": "Aggressive",
                "label": "Aggressive",
                "icon": "🚀",
                "description": "Maximum growth. Heavy equity & ETF exposure. Ideal for 10+ year horizons.",
                "expectedReturn": "16–26% CAGR",
                "riskScore": 74,
                "color": "#EF4444",
            },
        ]
    }, data_source="static")
