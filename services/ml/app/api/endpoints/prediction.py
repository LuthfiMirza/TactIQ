from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
import numpy as np

router = APIRouter()


class TeamStats(BaseModel):
    recentFormPoints: int = Field(default=10, ge=0, le=15, description="Points in last 5 matches (0-15)")
    goalsScoredAvg: float = Field(default=2.1, ge=0.0, le=5.0)
    goalsConcededAvg: float = Field(default=1.0, ge=0.0, le=5.0)
    possessionAvg: float = Field(default=55.0, ge=20.0, le=80.0)


class MatchPredictRequest(BaseModel):
    fixtureId: str
    homeTeamStats: Optional[TeamStats] = None
    awayTeamStats: Optional[TeamStats] = None


class WinProbabilities(BaseModel):
    homeWin: float
    draw: float
    awayWin: float


class MatchPredictionResponse(BaseModel):
    fixtureId: str
    winProbabilities: WinProbabilities
    predictedScore: str
    insights: List[str]


@router.post("/match-prediction", response_model=MatchPredictionResponse)
async def predict_match_outcome(payload: MatchPredictRequest):
    """
    Accepts home & away team statistics, computes win/draw/away probabilities
    guaranteed to sum up to exactly 100.0%, and predicts final scoreline.
    """
    home = payload.homeTeamStats or TeamStats(recentFormPoints=11, goalsScoredAvg=2.2, goalsConcededAvg=0.9, possessionAvg=58.0)
    away = payload.awayTeamStats or TeamStats(recentFormPoints=10, goalsScoredAvg=1.9, goalsConcededAvg=1.1, possessionAvg=52.0)

    # Tactical power ratings
    # Home pitch advantage baseline = +1.8 rating points
    home_rating = (home.recentFormPoints * 1.5) + (home.goalsScoredAvg * 3.0) - (home.goalsConcededAvg * 2.0) + (home.possessionAvg * 0.1) + 1.8
    away_rating = (away.recentFormPoints * 1.5) + (away.goalsScoredAvg * 3.0) - (away.goalsConcededAvg * 2.0) + (away.possessionAvg * 0.1)

    # Base expectations
    diff = home_rating - away_rating

    # Sigmoid logistic probability modeling
    exp_factor = 1.0 / (1.0 + np.exp(-diff * 0.12))
    
    # Draw propensity is higher when teams are evenly matched
    draw_base = max(18.0, 30.0 - abs(diff) * 1.2)
    remaining = 100.0 - draw_base

    home_win_raw = remaining * exp_factor
    away_win_raw = remaining * (1.0 - exp_factor)

    # Normalize to strictly ensure sum == 100.0%
    total = home_win_raw + draw_base + away_win_raw
    home_win = round(float((home_win_raw / total) * 100.0), 1)
    away_win = round(float((away_win_raw / total) * 100.0), 1)
    draw = round(float(100.0 - home_win - away_win), 1)

    # Predicted Score Heuristic
    if home_win >= 60.0:
        predicted_score = "3 - 1"
    elif home_win >= 48.0:
        predicted_score = "2 - 1"
    elif away_win >= 55.0:
        predicted_score = "0 - 2"
    elif away_win >= 45.0:
        predicted_score = "1 - 2"
    elif abs(home_win - away_win) <= 8.0:
        predicted_score = "1 - 1"
    else:
        predicted_score = "2 - 1"

    insights = [
        f"TactIQ ML Model: Home advantage gives +{round(1.8 / home_rating * 100, 1)}% attacking momentum.",
        f"Form differential: {home.recentFormPoints} pts vs {away.recentFormPoints} pts in previous 5 fixtures.",
        f"Expected possession contest: {home.possessionAvg}% home control vs {away.possessionAvg}% away counter-press.",
    ]

    return MatchPredictionResponse(
        fixtureId=payload.fixtureId,
        winProbabilities=WinProbabilities(
            homeWin=home_win,
            draw=draw,
            awayWin=away_win
        ),
        predictedScore=predicted_score,
        insights=insights
    )
