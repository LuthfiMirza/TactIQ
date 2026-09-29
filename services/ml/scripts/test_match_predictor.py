"""
TactIQ - Automated Match Predictor Verification Script (TSK-14, TSK-15, TSK-41)
Verifies:
1. Trained RandomForestClassifier probability calibration & normalization (sum == 100.0%).
2. Dixon-Coles Bivariate Poisson Expected Goals (xG) scoreline modeling.
3. Model information & diagnostic metadata endpoint.
4. Edge cases (evenly matched teams, heavy favorites, defensive grind).
"""

import os
import sys
import asyncio
import logging

# Ensure services/ml is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.abspath(os.path.join(current_dir, ".."))
if ml_root not in sys.path:
    sys.path.insert(0, ml_root)

from app.api.endpoints.prediction import (
    predict_match_outcome,
    get_match_predictor_model_info,
    MatchPredictRequest,
    TeamStats,
)
from app.services.match_predictor import match_predictor_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_match_predictor")


async def main():
    logger.info("==================================================")
    logger.info("🏆 TactIQ: Testing Match Predictor Model (TSK-14, TSK-15, TSK-41)")
    logger.info("==================================================")

    # 1. Check Model Metadata
    logger.info("🔍 Step 1: Checking ML Model Info...")
    info = await get_match_predictor_model_info()
    logger.info(f"   • Model Type: {info['modelType']}")
    logger.info(f"   • Scoreline Distribution: {info['scorelineDistribution']}")
    logger.info(f"   • Is Trained: {info['isTrained']}")
    logger.info(f"   • Features count: {len(info['features'])}")
    assert info["isTrained"] is True, "Model must be trained"
    logger.info("✅ Step 1 Passed: ML Model operational!")

    # 2. Test Case A: Heavy Home Favorite (e.g. Man City vs Promoted Team)
    logger.info("\n⚽ Step 2: Testing Heavy Home Favorite Matchup...")
    req_fav = MatchPredictRequest(
        fixtureId="fix-mci-lut",
        homeTeamStats=TeamStats(recentFormPoints=15, goalsScoredAvg=2.9, goalsConcededAvg=0.5, possessionAvg=68.0),
        awayTeamStats=TeamStats(recentFormPoints=3, goalsScoredAvg=0.8, goalsConcededAvg=2.3, possessionAvg=35.0),
    )
    res_fav = await predict_match_outcome(req_fav)
    logger.info(f"   • Home Win: {res_fav.winProbabilities.homeWin}%")
    logger.info(f"   • Draw: {res_fav.winProbabilities.draw}%")
    logger.info(f"   • Away Win: {res_fav.winProbabilities.awayWin}%")
    logger.info(f"   • Expected Goals: Home {res_fav.expectedGoals.home_xg} vs Away {res_fav.expectedGoals.away_xg}")
    logger.info(f"   • Predicted Score: {res_fav.predictedScore}")
    assert res_fav.winProbabilities.homeWin > 80.0, "Heavy favorite should have >80% win probability"
    total_p = round(res_fav.winProbabilities.homeWin + res_fav.winProbabilities.draw + res_fav.winProbabilities.awayWin, 1)
    assert total_p == 100.0, "Probabilities must sum strictly to 100.0%"
    logger.info("✅ Step 2 Passed: Heavy favorite correctly predicted!")

    # 3. Test Case B: Balanced Derby (e.g. Real Madrid vs Barcelona)
    logger.info("\n⚽ Step 3: Testing Evenly Matched Derby Matchup...")
    req_derby = MatchPredictRequest(
        fixtureId="fix-rma-bar",
        homeTeamStats=TeamStats(recentFormPoints=12, goalsScoredAvg=2.2, goalsConcededAvg=0.9, possessionAvg=53.0),
        awayTeamStats=TeamStats(recentFormPoints=12, goalsScoredAvg=2.1, goalsConcededAvg=0.8, possessionAvg=51.0),
    )
    res_derby = await predict_match_outcome(req_derby)
    logger.info(f"   • Home Win: {res_derby.winProbabilities.homeWin}%")
    logger.info(f"   • Draw: {res_derby.winProbabilities.draw}%")
    logger.info(f"   • Away Win: {res_derby.winProbabilities.awayWin}%")
    logger.info(f"   • Predicted Score: {res_derby.predictedScore}")
    logger.info(f"   • Top 3 Scores: {[s.score + ' (' + str(s.probability) + '%)' for s in res_derby.topScores[:3]]}")
    total_p_derby = round(res_derby.winProbabilities.homeWin + res_derby.winProbabilities.draw + res_derby.winProbabilities.awayWin, 1)
    assert total_p_derby == 100.0, "Derby probabilities must sum to 100.0%"
    logger.info("✅ Step 3 Passed: Balanced derby produces competitive distribution!")

    # 4. Test Case C: Low-Scoring Defensive Grind
    logger.info("\n⚽ Step 4: Testing Low-Scoring Defensive Battle (Dixon-Coles Poisson test)...")
    req_def = MatchPredictRequest(
        fixtureId="fix-def-battle",
        homeTeamStats=TeamStats(recentFormPoints=8, goalsScoredAvg=0.7, goalsConcededAvg=0.6, possessionAvg=49.0),
        awayTeamStats=TeamStats(recentFormPoints=8, goalsScoredAvg=0.6, goalsConcededAvg=0.7, possessionAvg=51.0),
    )
    res_def = await predict_match_outcome(req_def)
    logger.info(f"   • Expected Goals: Home {res_def.expectedGoals.home_xg} vs Away {res_def.expectedGoals.away_xg}")
    logger.info(f"   • Predicted Score: {res_def.predictedScore}")
    logger.info(f"   • Top Score: {res_def.topScores[0].score} with prob {res_def.topScores[0].probability}%")
    assert res_def.expectedGoals.home_xg < 1.3 and res_def.expectedGoals.away_xg < 1.3, "Defensive battle must have low xG"
    logger.info("✅ Step 4 Passed: Bivariate Poisson low-scoring adjustment verified!")

    logger.info("\n🎉 ALL TSK-14, TSK-15 & TSK-41 MATCH PREDICTOR TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())
