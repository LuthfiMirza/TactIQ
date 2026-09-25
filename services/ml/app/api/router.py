from fastapi import APIRouter
from app.api.endpoints import similarity, prediction, tracking

api_router = APIRouter()

api_router.include_router(similarity.router, tags=["player-similarity"])
api_router.include_router(prediction.router, tags=["match-prediction"])
api_router.include_router(tracking.router, tags=["cv-tracking"])
