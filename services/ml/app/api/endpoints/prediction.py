from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.match_predictor import match_predictor_engine

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


class ExpectedGoals(BaseModel):
    home_xg: float
    away_xg: float


class ScoreProbability(BaseModel):
    score: str
    home: int
    away: int
    probability: float


class MatchPredictionResponse(BaseModel):
    fixtureId: str
    winProbabilities: WinProbabilities
    predictedScore: str
    insights: List[str]
    expectedGoals: Optional[ExpectedGoals] = None
    topScores: Optional[List[ScoreProbability]] = None
    model: Optional[str] = "RandomForest + Bivariate Poisson"


@router.post("/match-prediction", response_model=MatchPredictionResponse)
async def predict_match_outcome(payload: MatchPredictRequest):
    """
    Accepts home & away team statistics, computes win/draw/away probabilities using a trained
    RandomForestClassifier (TSK-14), and predicts final scoreline via Bivariate Poisson distribution (TSK-41 / DEF-07).
    Guaranteed win + draw + away probabilities sum up to exactly 100.0%.
    """
    home = payload.homeTeamStats or TeamStats(recentFormPoints=11, goalsScoredAvg=2.2, goalsConcededAvg=0.9, possessionAvg=58.0)
    away = payload.awayTeamStats or TeamStats(recentFormPoints=10, goalsScoredAvg=1.9, goalsConcededAvg=1.1, possessionAvg=52.0)

    result = match_predictor_engine.predict_match(
        fixture_id=payload.fixtureId,
        home_form=home.recentFormPoints,
        away_form=away.recentFormPoints,
        home_scored=home.goalsScoredAvg,
        away_scored=away.goalsScoredAvg,
        home_conceded=home.goalsConcededAvg,
        away_conceded=away.goalsConcededAvg,
        home_poss=home.possessionAvg,
        away_poss=away.possessionAvg,
    )

    return MatchPredictionResponse(
        fixtureId=result["fixtureId"],
        winProbabilities=WinProbabilities(**result["winProbabilities"]),
        predictedScore=result["predictedScore"],
        insights=result["insights"],
        expectedGoals=ExpectedGoals(**result["expectedGoals"]),
        topScores=[ScoreProbability(**s) for s in result["topScores"]],
        model=result["model"],
    )


@router.get("/match-prediction/model-info")
async def get_match_predictor_model_info():
    """
    Returns diagnostics and metadata on the trained Random Forest and Bivariate Poisson models (TSK-14).
    """
    return {
        "status": "OPERATIONAL",
        "modelType": "RandomForestClassifier with Sigmoid Probability Calibration",
        "scorelineDistribution": "Dixon-Coles Bivariate Poisson",
        "isTrained": match_predictor_engine.is_trained,
        "features": match_predictor_engine.feature_names,
        "classes": match_predictor_engine.classes_,
        "tacticalParameters": {
            "dixonColesRho": -0.10,
            "leagueBaselineHomeXg": 1.45,
            "leagueBaselineAwayXg": 1.15,
        }
    }
