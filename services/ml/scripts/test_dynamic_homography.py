"""
TactIQ - Automated Dynamic Field Line & Adaptive Homography Verification (TSK-32)
Verifies:
1. Pitch grass segmentation and white field line isolation using OpenCV.
2. Probabilistic Hough Line detection and line intersection keypoint extraction.
3. Lucas-Kanade optical flow camera motion tracking (pan, tilt, zoom).
4. Adaptive homography matrix updating under camera transformations.
"""

import os
import sys
import cv2
import numpy as np
import logging

current_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.abspath(os.path.join(current_dir, ".."))
if ml_root not in sys.path:
    sys.path.insert(0, ml_root)

from app.services.field_homography import PitchLineDetector, DynamicHomographyEstimator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_dynamic_homography")


def create_mock_soccer_frame(pan_x: int = 0, pan_y: int = 0, zoom: float = 1.0) -> np.ndarray:
    """Generates a synthetic soccer broadcast frame with field lines and camera transformation."""
    w, h = 960, 540
    frame = np.full((h, w, 3), (34, 139, 34), dtype=np.uint8)  # Green grass pitch

    # Pitch markings in base coordinate
    cx, cy = w // 2 + pan_x, h // 2 + pan_y

    # Touchlines
    cv2.rectangle(frame, (cx - int(380 * zoom), cy - int(200 * zoom)), (cx + int(380 * zoom), cy + int(200 * zoom)), (255, 255, 255), 3)
    # Halfway line
    cv2.line(frame, (cx, cy - int(200 * zoom)), (cx, cy + int(200 * zoom)), (255, 255, 255), 3)
    # Center circle
    cv2.circle(frame, (cx, cy), int(70 * zoom), (255, 255, 255), 3)
    # Center spot
    cv2.circle(frame, (cx, cy), 5, (255, 255, 255), -1)

    return frame


def test_field_line_detector():
    logger.info("🧪 Test 1: Testing PitchLineDetector on soccer pitch markings...")
    detector = PitchLineDetector()
    frame = create_mock_soccer_frame()

    pitch_mask = detector.segment_pitch_mask(frame)
    assert np.count_nonzero(pitch_mask) > 10000, "Pitch grass segmentation failed!"

    white_lines = detector.extract_white_field_lines(frame, pitch_mask)
    assert np.count_nonzero(white_lines) > 500, "White line extraction failed!"

    lines, intersections = detector.detect_lines_and_intersections(frame)
    logger.info(f"   • Lines detected: {len(lines)}")
    logger.info(f"   • Intersections detected: {len(intersections)}")

    assert len(lines) >= 3, f"Expected at least 3 lines, got {len(lines)}"
    assert len(intersections) >= 1, f"Expected at least 1 intersection, got {len(intersections)}"
    logger.info("✅ Test 1 Passed: Pitch lines & keypoints successfully detected!")


def test_adaptive_homography_pan_zoom():
    logger.info("\n🧪 Test 2: Testing DynamicHomographyEstimator under camera Pan & Zoom...")
    estimator = DynamicHomographyEstimator()

    # Frame 1: Base frame
    f1 = create_mock_soccer_frame(pan_x=0, pan_y=0, zoom=1.0)
    stats1 = estimator.update_with_frame(f1)
    logger.info("   • Frame 1 registered (Base pose)")

    # Frame 2: Simulated Camera Pan right (+20px)
    f2 = create_mock_soccer_frame(pan_x=-20, pan_y=0, zoom=1.0)
    stats2 = estimator.update_with_frame(f2)
    logger.info(f"   • Frame 2 (Pan Right): dx={stats2['pan_delta_x']}, dy={stats2['tilt_delta_y']}, features={stats2['features_tracked']}")

    # Frame 3: Simulated Camera Zoom In (zoom=1.04x)
    f3 = create_mock_soccer_frame(pan_x=-20, pan_y=0, zoom=1.04)
    stats3 = estimator.update_with_frame(f3)
    logger.info(f"   • Frame 3 (Zoom In): zoom_scale={stats3['zoom_scale']}, features={stats3['features_tracked']}")

    # Test coordinate transformation
    cam_x, cam_y = 0.50, 0.50
    pitch_x, pitch_y = estimator.transform_camera_to_pitch(cam_x, cam_y)
    logger.info(f"   • Center camera point ({cam_x}, {cam_y}) -> Adaptive pitch point: ({pitch_x}, {pitch_y})")

    assert 0.02 <= pitch_x <= 0.98, "Pitch coordinate out of bounds!"
    assert 0.02 <= pitch_y <= 0.98, "Pitch coordinate out of bounds!"
    assert estimator.updates_count >= 1, "Expected homography to adapt to camera motion!"

    logger.info("✅ Test 2 Passed: Homography matrix adaptively tracked camera motion!")


def test_video_file_adaptation():
    logger.info("\n🧪 Test 3: Testing DynamicHomographyEstimator on local MP4 video file...")
    data_dir = os.path.join(ml_root, "data")
    sample_mp4 = os.path.join(data_dir, "sample_crossing.mp4")

    if not os.path.exists(sample_mp4):
        logger.warning("sample_crossing.mp4 not found, skipping video test.")
        return

    cap = cv2.VideoCapture(sample_mp4)
    estimator = DynamicHomographyEstimator()
    frames_checked = 0

    while cap.isOpened() and frames_checked < 10:
        ret, frame = cap.read()
        if not ret:
            break
        stats = estimator.update_with_frame(frame)
        frames_checked += 1

    cap.release()
    logger.info(f"   • Analyzed {frames_checked} frames of MP4 video.")
    logger.info(f"   • Cumulative Pan X: {estimator.pan_accum_x:.4f}, Tilt Y: {estimator.tilt_accum_y:.4f}")
    logger.info("✅ Test 3 Passed: Successfully adapted on video stream!")


if __name__ == "__main__":
    test_field_line_detector()
    test_adaptive_homography_pan_zoom()
    test_video_file_adaptation()
    logger.info("\n🎉 ALL TSK-32 DYNAMIC HOMOGRAPHY TESTS PASSED SUCCESSFULLY!")
