import os
import sys
import cv2
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
ml_root = os.path.abspath(os.path.join(current_dir, ".."))
if ml_root not in sys.path:
    sys.path.insert(0, ml_root)

from app.services.field_homography import DynamicHomographyEstimator

video_path = os.path.join(ml_root, "data", "spain_croatia.mp4")
cap = cv2.VideoCapture(video_path)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
print(f"🎬 Spain vs Croatia video loaded! Total frames: {total_frames}, FPS: {fps:.1f}")

estimator = DynamicHomographyEstimator()

best_result = None
best_frame_idx = 0

# Check broadcast frames: between frame 100 and 1500
test_indices = [150, 250, 450, 600, 750, 900, 1100, 1300]
for idx in test_indices:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ret, frame = cap.read()
    if not ret or frame is None:
        continue
    res = estimator.calibrate_from_field_lines(frame)
    print(f"  Frame {idx:4d} | Lines: {res['lines_detected']:2d} | Intersections: {res['intersections_detected']:2d} | Status: {res['status']:7s} | Conf: {res['confidence_score']:.1f}% | Error: {res['reprojection_error']:.5f}")
    if best_result is None or res['lines_detected'] > best_result['lines_detected']:
        best_result = res
        best_frame_idx = idx

cap.release()

print(f"\n🏆 Best Frame Selected: Frame {best_frame_idx}")
if best_result:
    print(f"   • Confidence: {best_result['confidence_score']}%")
    print(f"   • Reprojection Error: {best_result['reprojection_error']}")
    print(f"   • Lines Detected: {best_result['lines_detected']}")
    print(f"   • Intersections Detected: {best_result['intersections_detected']}")
    print(f"   • Homography Matrix (3x3): {json.dumps(best_result['homography_matrix'])}")
    print(f"   • Camera FOV Quad: {best_result['camera_fov_quad']}")
    print("✅ Successfully calibrated dynamic homography on actual Spain vs Croatia video!")
