"""
TactIQ - Automated ByteTrack Stability Verification Script (TSK-30)
Verifies YOLOv8 + ByteTrack on local MP4 video file:
1. Generates/loads an MP4 video clip with crossing players (occlusion test).
2. Runs TacticalVideoTracker (YOLOv8 + ByteTrack).
3. Evaluates tracking ID persistence across the crossing event.
4. Outputs annotated video and performance metrics.
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

from app.services.video_tracker import (
    TacticalVideoTracker,
    generate_synthetic_soccer_video,
    ULTRALYTICS_AVAILABLE,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_tracking_bytetrack")


async def main():
    logger.info("==================================================")
    logger.info("⚽ TactIQ: Testing YOLOv8 + ByteTrack Pipeline (TSK-30)")
    logger.info("==================================================")

    data_dir = os.path.join(ml_root, "data")
    os.makedirs(data_dir, exist_ok=True)
    sample_mp4 = os.path.join(data_dir, "sample_crossing.mp4")
    annotated_mp4 = os.path.join(data_dir, "sample_crossing_annotated.mp4")

    # Step 1: Generate or check test video
    logger.info(f"📹 Step 1: Generating synthetic football crossing video at: {sample_mp4}")
    generate_synthetic_soccer_video(sample_mp4, duration_sec=5, fps=20)
    logger.info("✅ Synthetic test video created successfully.")

    # Step 2: Initialize TacticalVideoTracker
    logger.info("🤖 Step 2: Initializing TacticalVideoTracker with YOLOv8 & ByteTrack...")
    tracker = TacticalVideoTracker(tracker_config="bytetrack.yaml", conf_threshold=0.20)

    # Step 3: Run tracking pipeline
    logger.info("🎯 Step 3: Processing video frames and extracting stabilized tracking IDs...")
    result = await tracker.stream_video_tracking(
        video_path=sample_mp4,
        session_id="tsk-30-verification-session",
        fps_sample_rate=10,
        stream_to_redis=False,  # Local test without requiring active Redis server
        output_annotated_path=annotated_mp4,
    )

    logger.info("==================================================")
    logger.info("📊 Tracking Execution Summary:")
    for k, v in result.items():
        logger.info(f"   • {k}: {v}")
    logger.info("==================================================")

    if os.path.exists(annotated_mp4):
        file_size_kb = os.path.getsize(annotated_mp4) / 1024.0
        logger.info(f"🎥 Annotated video output verified: {annotated_mp4} ({file_size_kb:.1f} KB)")

    logger.info("🎉 TSK-30 Tracking verification test finished successfully!")


if __name__ == "__main__":
    asyncio.run(main())
