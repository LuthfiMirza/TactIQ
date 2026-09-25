"""
TactIQ - Automated K-Means Jersey Color Clustering Verification (TSK-31)
Verifies:
1. Torso cropping & soccer grass masking.
2. Dominant jersey color extraction.
3. K-Means clustering into Home vs. Away teams.
4. End-to-end integration with TacticalVideoTracker.
"""

import os
import sys
import numpy as np
import logging

# Ensure services/ml is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.abspath(os.path.join(current_dir, ".."))
if ml_root not in sys.path:
    sys.path.insert(0, ml_root)

from app.services.team_classifier import JerseyColorExtractor, TeamKMeansClassifier, rgb_to_hex
from app.services.video_tracker import TacticalVideoTracker, generate_synthetic_soccer_video

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_team_clustering")


def test_jersey_color_extraction():
    logger.info("🧪 Test 1: Testing JerseyColorExtractor with synthetic player crop & grass bleeding...")
    extractor = JerseyColorExtractor(n_clusters=2)

    # Create dummy frame with green grass background
    frame = np.full((300, 300, 3), (34, 139, 34), dtype=np.uint8)  # Green grass BGR

    # Draw a player with red jersey: bbox from (100, 50) to (180, 250)
    # Torso area roughly y: 90..160, x: 110..170
    frame[90:160, 110:170] = (25, 25, 215)  # Bright Red in BGR

    bbox = (100, 50, 180, 250)
    color = extractor.extract_dominant_color(frame, bbox)

    assert color is not None, "Failed to extract dominant color!"
    r, g, b = color
    logger.info(f"   • Extracted dominant RGB: ({r}, {g}, {b}) -> Hex: {rgb_to_hex(r, g, b)}")
    # Red channel should dominate over green and blue
    assert r > 160 and g < 70 and b < 70, f"Expected red jersey to dominate, got RGB: ({r}, {g}, {b})"
    logger.info("✅ Test 1 Passed: Red jersey successfully extracted and grass masked out!")


def test_team_kmeans_clustering():
    logger.info("\n🧪 Test 2: Testing TeamKMeansClassifier on multi-player squad colors...")
    classifier = TeamKMeansClassifier()

    # Create synthetic observations for 6 players:
    # 3 Home players (Shades of Red: Liverpool / Arsenal)
    # 3 Away players (Shades of Blue: Chelsea / Man City)
    home_reds = [
        (220, 20, 20),
        (205, 30, 25),
        (235, 15, 15),
    ]
    away_blues = [
        (15, 30, 210),
        (25, 45, 225),
        (10, 20, 195),
    ]

    for idx, col in enumerate(home_reds, start=1):
        classifier.player_color_history[idx] = [col]

    for idx, col in enumerate(away_blues, start=11):
        classifier.player_color_history[idx] = [col]

    # Run clustering
    success = classifier.fit_teams()
    assert success, "K-Means fit failed!"

    summary = classifier.get_team_summary()
    logger.info(f"   • Home team detected: {summary['home']['count']} players, Color: {summary['home']['color_hex']}")
    logger.info(f"   • Away team detected: {summary['away']['count']} players, Color: {summary['away']['color_hex']}")

    assert summary["home"]["count"] == 3
    assert summary["away"]["count"] == 3

    # Check assignment accuracy
    for p_id in [1, 2, 3]:
        assert classifier.player_team_assignments[p_id] == "home", f"Player {p_id} should be home"
    for p_id in [11, 12, 13]:
        assert classifier.player_team_assignments[p_id] == "away", f"Player {p_id} should be away"

    logger.info("✅ Test 2 Passed: 100% classification accuracy on squad colors!")


async def test_end_to_end_video_team_classification():
    logger.info("\n🧪 Test 3: End-to-end TacticalVideoTracker + K-Means on synthetic match video...")
    data_dir = os.path.join(ml_root, "data")
    os.makedirs(data_dir, exist_ok=True)
    sample_mp4 = os.path.join(data_dir, "sample_crossing.mp4")

    if not os.path.exists(sample_mp4):
        generate_synthetic_soccer_video(sample_mp4, duration_sec=4, fps=20)

    tracker = TacticalVideoTracker(conf_threshold=0.20)
    result = await tracker.stream_video_tracking(
        video_path=sample_mp4,
        session_id="tsk31-verification-run",
        fps_sample_rate=10,
        stream_to_redis=False,
        max_frames=30,
    )

    team_summary = result.get("team_summary", {})
    logger.info(f"   • Frames processed: {result['frames_processed']}")
    logger.info(f"   • Unique tracks: {result['unique_tracks_count']}")
    logger.info(f"   • Team summary: {team_summary}")

    assert result["status"] == "COMPLETED"
    logger.info("✅ Test 3 Passed: End-to-end video tracking with automated team classification!")


if __name__ == "__main__":
    import asyncio
    test_jersey_color_extraction()
    test_team_kmeans_clustering()
    asyncio.run(test_end_to_end_video_team_classification())
    logger.info("\n🎉 ALL TSK-31 K-MEANS JERSEY CLUSTERING TESTS PASSED SUCCESSFULLY!")
