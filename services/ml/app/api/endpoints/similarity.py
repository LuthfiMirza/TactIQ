from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

router = APIRouter()


class PlayerRadarMetrics(BaseModel):
    pace: int = Field(..., ge=0, le=100)
    shooting: int = Field(..., ge=0, le=100)
    passing: int = Field(..., ge=0, le=100)
    dribbling: int = Field(..., ge=0, le=100)
    defending: int = Field(..., ge=0, le=100)
    physical: int = Field(..., ge=0, le=100)
    vision: int = Field(..., ge=0, le=100)


class PlayerDTO(BaseModel):
    id: str
    teamId: Optional[str] = None
    name: str
    position: str
    nationality: Optional[str] = "Unknown"
    age: Optional[int] = 25
    marketValue: Optional[float] = 50000000.0
    photoUrl: Optional[str] = ""
    team: Optional[Dict[str, Any]] = None
    attributes: Optional[PlayerRadarMetrics] = None


class SimilarityRequest(BaseModel):
    targetPlayer: PlayerDTO
    candidatePool: Optional[List[PlayerDTO]] = None


class SimilarPlayerItem(BaseModel):
    player: PlayerDTO
    similarityScore: float


class SimilarityResponse(BaseModel):
    targetPlayer: PlayerDTO
    similarPlayers: List[SimilarPlayerItem]


# Fallback benchmark reference players if candidate pool is small or empty
REFERENCE_BENCHMARKS: List[PlayerDTO] = [
    PlayerDTO(
        id="ref-kdb",
        name="Kevin De Bruyne",
        position="MID",
        nationality="Belgium",
        age=33,
        marketValue=50000000,
        photoUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=74, shooting=88, passing=95, dribbling=87, defending=65, physical=78, vision=97)
    ),
    PlayerDTO(
        id="ref-odegaard",
        name="Martin Ødegaard",
        position="MID",
        nationality="Norway",
        age=25,
        marketValue=110000000,
        photoUrl="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=76, shooting=82, passing=93, dribbling=90, defending=68, physical=69, vision=95)
    ),
    PlayerDTO(
        id="ref-bellingham",
        name="Jude Bellingham",
        position="MID",
        nationality="England",
        age=21,
        marketValue=180000000,
        photoUrl="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=82, shooting=87, passing=89, dribbling=90, defending=80, physical=85, vision=91)
    ),
    PlayerDTO(
        id="ref-rodri",
        name="Rodri",
        position="MID",
        nationality="Spain",
        age=28,
        marketValue=130000000,
        photoUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=68, shooting=78, passing=91, dribbling=84, defending=89, physical=87, vision=92)
    ),
    PlayerDTO(
        id="ref-foden",
        name="Phil Foden",
        position="MID",
        nationality="England",
        age=24,
        marketValue=150000000,
        photoUrl="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=86, shooting=86, passing=89, dribbling=92, defending=56, physical=66, vision=90)
    ),
    PlayerDTO(
        id="ref-rice",
        name="Declan Rice",
        position="MID",
        nationality="England",
        age=25,
        marketValue=120000000,
        photoUrl="https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=78, shooting=74, passing=85, dribbling=82, defending=88, physical=89, vision=84)
    ),
    PlayerDTO(
        id="ref-saliba",
        name="William Saliba",
        position="DEF",
        nationality="France",
        age=23,
        marketValue=80000000,
        photoUrl="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=83, shooting=40, passing=81, dribbling=77, defending=91, physical=88, vision=80)
    ),
    PlayerDTO(
        id="ref-vvd",
        name="Virgil van Dijk",
        position="DEF",
        nationality="Netherlands",
        age=33,
        marketValue=30000000,
        photoUrl="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=78, shooting=60, passing=80, dribbling=73, defending=93, physical=90, vision=83)
    ),
    PlayerDTO(
        id="ref-haaland",
        name="Erling Haaland",
        position="FWD",
        nationality="Norway",
        age=24,
        marketValue=180000000,
        photoUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=91, shooting=94, passing=70, dribbling=82, defending=45, physical=92, vision=76)
    ),
    PlayerDTO(
        id="ref-vinicius",
        name="Vinícius Júnior",
        position="FWD",
        nationality="Brazil",
        age=24,
        marketValue=200000000,
        photoUrl="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=96, shooting=85, passing=81, dribbling=93, defending=38, physical=72, vision=84)
    ),
]


def extract_vector(attrs: Optional[PlayerRadarMetrics]) -> np.ndarray:
    if attrs is None:
        return np.array([75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0])
    return np.array([
        float(attrs.pace),
        float(attrs.shooting),
        float(attrs.passing),
        float(attrs.dribbling),
        float(attrs.defending),
        float(attrs.physical),
        float(attrs.vision)
    ])


@router.post("/player-similarity", response_model=SimilarityResponse)
async def calculate_player_similarity(payload: SimilarityRequest):
    """
    Accepts player ID & attributes, returns realistic 5 similar players with similarity percentages.
    Calculates high-dimensional cosine similarity across radar metric vectors.
    """
    target = payload.targetPlayer
    if not target.attributes:
        raise HTTPException(status_code=400, detail="Target player attributes are required for similarity calculation.")

    target_vec = extract_vector(target.attributes).reshape(1, -1)

    # Use supplied candidate pool or reference pool
    pool = payload.candidatePool if (payload.candidatePool and len(payload.candidatePool) > 0) else REFERENCE_BENCHMARKS
    candidates = [p for p in pool if p.id != target.id]

    if not candidates:
        candidates = [p for p in REFERENCE_BENCHMARKS if p.id != target.id]

    results: List[SimilarPlayerItem] = []

    for candidate in candidates:
        cand_vec = extract_vector(candidate.attributes).reshape(1, -1)
        
        # Calculate Cosine Similarity (direction) and Euclidean proximity (magnitude)
        cos_sim = float(cosine_similarity(target_vec, cand_vec)[0][0])
        euc_dist = float(np.linalg.norm(target_vec - cand_vec))
        max_dist = float(np.sqrt(7 * (100 ** 2)))
        euc_sim = 1.0 - (euc_dist / max_dist)

        # Blend: 60% cosine similarity, 40% magnitude proximity
        blended = (0.60 * cos_sim) + (0.40 * euc_sim)
        percentage = round(float(np.clip(blended * 100, 45.0, 99.4)), 1)

        results.append(SimilarPlayerItem(player=candidate, similarityScore=percentage))

    # Sort descending by score and pick top 5
    results.sort(key=lambda x: x.similarityScore, reverse=True)
    top_5 = results[:5]

    return SimilarityResponse(
        targetPlayer=target,
        similarPlayers=top_5
    )
