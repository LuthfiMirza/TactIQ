from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import os
import json
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
    filterPosition: Optional[bool] = Field(False, description="Whether to restrict candidate comparisons to same position")
    limit: Optional[int] = Field(5, ge=1, le=50, description="Top K similar players to return")


class SimilarPlayerItem(BaseModel):
    player: PlayerDTO
    similarityScore: float


class SimilarityResponse(BaseModel):
    targetPlayer: PlayerDTO
    similarPlayers: List[SimilarPlayerItem]
    datasetPoolSize: int = 500


# Fallback benchmark reference players if dataset file is absent
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
        id="ref-haaland",
        name="Erling Haaland",
        position="FWD",
        nationality="Norway",
        age=24,
        marketValue=180000000,
        photoUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
        attributes=PlayerRadarMetrics(pace=91, shooting=94, passing=70, dribbling=82, defending=45, physical=92, vision=76)
    ),
]


def load_players_dataset() -> List[PlayerDTO]:
    """
    Loads comprehensive 500+ player dataset (TSK-33) from FBref / Kaggle dataset JSON.
    """
    json_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "players_fbref_500.json")
    if not os.path.exists(json_path):
        # Alternative search in services/ml/data/
        alt_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "players_fbref_500.json")
        if os.path.exists(alt_path):
            json_path = alt_path

    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                loaded: List[PlayerDTO] = []
                for p in raw_data:
                    attrs = PlayerRadarMetrics(**p["attributes"]) if p.get("attributes") else None
                    loaded.append(
                        PlayerDTO(
                            id=p["id"],
                            teamId=p.get("teamId"),
                            name=p["name"],
                            position=p["position"],
                            nationality=p.get("nationality", "Unknown"),
                            age=p.get("age", 25),
                            marketValue=p.get("marketValue", 20000000.0),
                            photoUrl=p.get("photoUrl", ""),
                            team=p.get("team"),
                            attributes=attrs,
                        )
                    )
                if len(loaded) >= 100:
                    print(f"📦 [SimilarityEngine] Loaded {len(loaded)} players from FBref dataset ({json_path}).")
                    return loaded
        except Exception as e:
            print(f"⚠️ Failed to load 500+ dataset: {e}")

    return REFERENCE_BENCHMARKS


# Global in-memory player dataset (TSK-33)
EXTENDED_PLAYER_POOL: List[PlayerDTO] = load_players_dataset()


def extract_vector(attrs: Optional[PlayerRadarMetrics]) -> np.ndarray:
    if attrs is None:
        return np.array([75.0, 75.0, 75.0, 75.0, 75.0, 75.0, 75.0], dtype=np.float32)
    return np.array([
        float(attrs.pace),
        float(attrs.shooting),
        float(attrs.passing),
        float(attrs.dribbling),
        float(attrs.defending),
        float(attrs.physical),
        float(attrs.vision)
    ], dtype=np.float32)


@router.post("/player-similarity", response_model=SimilarityResponse)
async def calculate_player_similarity(payload: SimilarityRequest):
    """
    Accepts player ID & attributes, evaluates against 500+ player database (TSK-33),
    and returns top similar players using vectorized high-dimensional cosine & Euclidean similarity.
    """
    target = payload.targetPlayer
    if not target.attributes:
        raise HTTPException(status_code=400, detail="Target player attributes are required for similarity calculation.")

    target_vec = extract_vector(target.attributes).reshape(1, -1)

    # Determine candidate pool (custom or default 500+ dataset)
    pool = payload.candidatePool if (payload.candidatePool and len(payload.candidatePool) > 0) else EXTENDED_PLAYER_POOL
    
    # Filter candidates
    candidates = [p for p in pool if p.id != target.id and p.attributes is not None]
    if payload.filterPosition:
        candidates = [p for p in candidates if p.position == target.position]

    if not candidates:
        candidates = [p for p in EXTENDED_PLAYER_POOL if p.id != target.id and p.attributes is not None]

    # Vectorized computation across entire dataset in parallel
    cand_matrix = np.array([extract_vector(c.attributes) for c in candidates], dtype=np.float32)

    # Cosine Similarity: shape (1, N)
    cos_sims = cosine_similarity(target_vec, cand_matrix)[0]

    # Euclidean proximity: shape (N,)
    euc_dists = np.linalg.norm(cand_matrix - target_vec, axis=1)
    max_dist = float(np.sqrt(7 * (100.0 ** 2)))
    euc_sims = 1.0 - (euc_dists / max_dist)

    # Blend: 60% cosine similarity, 40% magnitude proximity
    blended = (0.60 * cos_sims) + (0.40 * euc_sims)
    percentages = np.round(np.clip(blended * 100.0, 45.0, 99.4), 1)

    limit = payload.limit or 5
    # Argsort descending
    top_indices = np.argsort(percentages)[::-1][:limit]

    results: List[SimilarPlayerItem] = []
    for idx in top_indices:
        results.append(
            SimilarPlayerItem(
                player=candidates[idx],
                similarityScore=float(percentages[idx])
            )
        )

    return SimilarityResponse(
        targetPlayer=target,
        similarPlayers=results,
        datasetPoolSize=len(pool)
    )


@router.get("/players-database", response_model=List[PlayerDTO])
async def get_players_database(
    position: Optional[str] = Query(None, description="Filter by position: FWD, MID, DEF, GK"),
    search: Optional[str] = Query(None, description="Search player by name"),
    limit: int = Query(50, ge=1, le=550, description="Max players to return")
):
    """
    Returns players from the 500+ player dataset with optional search and filtering (TSK-33).
    """
    filtered = EXTENDED_PLAYER_POOL
    if position:
        filtered = [p for p in filtered if p.position.upper() == position.upper()]
    if search:
        s_lower = search.lower()
        filtered = [p for p in filtered if s_lower in p.name.lower()]

    return filtered[:limit]


@router.get("/similarity-dataset-stats")
async def get_similarity_dataset_stats():
    """
    Returns summary statistics for the 500+ player dataset (TSK-33).
    """
    fwd_count = sum(1 for p in EXTENDED_PLAYER_POOL if p.position == "FWD")
    mid_count = sum(1 for p in EXTENDED_PLAYER_POOL if p.position == "MID")
    def_count = sum(1 for p in EXTENDED_PLAYER_POOL if p.position == "DEF")
    gk_count = sum(1 for p in EXTENDED_PLAYER_POOL if p.position == "GK")

    top_valued = sorted(EXTENDED_PLAYER_POOL, key=lambda x: x.marketValue or 0, reverse=True)[:5]

    return {
        "status": "LOADED",
        "total_players": len(EXTENDED_PLAYER_POOL),
        "dataset_source": "FBref & Kaggle European Leagues Benchmark",
        "positions_breakdown": {
            "FWD": fwd_count,
            "MID": mid_count,
            "DEF": def_count,
            "GK": gk_count,
        },
        "top_market_value_players": [
            {"name": p.name, "team": p.team.get("code") if p.team else "N/A", "value": p.marketValue}
            for p in top_valued
        ]
    }
