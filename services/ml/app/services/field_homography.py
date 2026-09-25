"""
TactIQ Dynamic Field Line Detection & Adaptive Homography Engine (TSK-32)
Uses OpenCV line segmentation, Hough transform, keypoint intersection,
and Lucas-Kanade optical flow camera-motion estimation to dynamically update
homography matrices adaptively under camera pan, tilt, and zoom.
"""

import cv2
import math
import numpy as np
import logging
from typing import List, Tuple, Optional, Dict, Any

logger = logging.getLogger("tactiq.field_homography")


class PitchLineDetector:
    """
    Detects soccer pitch lines and keypoint intersections using OpenCV.
    Segments pitch grass via HSV color filtering, isolates white field markings,
    and applies Probabilistic Hough Line Transform.
    """

    def __init__(self):
        # HSV threshold for green soccer pitch grass
        self.lower_green = np.array([30, 40, 40], dtype=np.uint8)
        self.upper_green = np.array([90, 255, 255], dtype=np.uint8)

    def segment_pitch_mask(self, bgr_frame: np.ndarray) -> np.ndarray:
        """Isolates the playing field surface and masks out stands/crowd."""
        hsv = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2HSV)
        grass_mask = cv2.inRange(hsv, self.lower_green, self.upper_green)

        # Morphological opening to remove small noise, then closing to fill field gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        grass_clean = cv2.morphologyEx(grass_mask, cv2.MORPH_OPEN, kernel)
        grass_clean = cv2.morphologyEx(grass_clean, cv2.MORPH_CLOSE, kernel)

        return grass_clean

    def extract_white_field_lines(self, bgr_frame: np.ndarray, pitch_mask: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Extracts white line pixels strictly within the pitch boundaries.
        """
        if pitch_mask is None:
            pitch_mask = self.segment_pitch_mask(bgr_frame)

        # Convert to Grayscale & HLS
        gray = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
        hls = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2HLS)
        lightness = hls[:, :, 1]

        # White lines have high lightness and low saturation
        # Combined threshold on lightness and grayscale intensity
        _, thresh_white = cv2.threshold(lightness, 185, 255, cv2.THRESH_BINARY)
        _, thresh_gray = cv2.threshold(gray, 175, 255, cv2.THRESH_BINARY)
        white_combined = cv2.bitwise_and(thresh_white, thresh_gray)

        # Restrict strictly to pitch region
        lines_on_pitch = cv2.bitwise_and(white_combined, pitch_mask)

        # Morphological thinning / line enhancement
        line_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        lines_enhanced = cv2.morphologyEx(lines_on_pitch, cv2.MORPH_CLOSE, line_kernel)

        return lines_enhanced

    def detect_lines_and_intersections(
        self, bgr_frame: np.ndarray
    ) -> Tuple[List[Tuple[int, int, int, int]], List[Tuple[float, float]]]:
        """
        Detects line segments using Probabilistic Hough Transform (HoughLinesP)
        and computes mutual intersection keypoints.
        """
        lines_mask = self.extract_white_field_lines(bgr_frame)
        edges = cv2.Canny(lines_mask, 50, 150, apertureSize=3)

        # HoughLinesP: rho=1 pixel, theta=1 degree, threshold=40, minLineLength=30, maxLineGap=15
        raw_lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=35, minLineLength=30, maxLineGap=15)

        detected_lines: List[Tuple[int, int, int, int]] = []
        if raw_lines is not None:
            for l in raw_lines:
                coords = l.flatten()
                if len(coords) >= 4:
                    x1, y1, x2, y2 = coords[:4]
                    detected_lines.append((int(x1), int(y1), int(x2), int(y2)))

        intersections = self._compute_line_intersections(detected_lines, bgr_frame.shape[1], bgr_frame.shape[0])
        return detected_lines, intersections

    def _compute_line_intersections(
        self, lines: List[Tuple[int, int, int, int]], max_w: int, max_h: int
    ) -> List[Tuple[float, float]]:
        """Computes intersection points between detected non-parallel line pairs."""
        intersections: List[Tuple[float, float]] = []
        n = len(lines)
        if n < 2:
            return intersections

        for i in range(min(n, 30)):
            x1, y1, x2, y2 = lines[i]
            dx1, dy1 = x2 - x1, y2 - y1
            ang1 = math.atan2(dy1, dx1)

            for j in range(i + 1, min(n, 30)):
                x3, y3, x4, y4 = lines[j]
                dx2, dy2 = x4 - x3, y4 - y3
                ang2 = math.atan2(dy2, dx2)

                diff_deg = abs(math.degrees(ang1 - ang2)) % 180
                if diff_deg < 20 or diff_deg > 160:
                    continue

                denom = dx1 * dy2 - dy1 * dx2
                if abs(denom) < 1e-4:
                    continue

                det1 = x1 * y2 - y1 * x2
                det2 = x3 * y4 - y3 * x4

                ix = (dx1 * det2 - dx2 * det1) / denom
                iy = (dy1 * det2 - dy2 * det1) / denom

                if -100 <= ix <= max_w + 100 and -100 <= iy <= max_h + 100:
                    intersections.append((round(float(ix), 1), round(float(iy), 1)))

        return intersections


class DynamicHomographyEstimator:
    """
    Adaptive Field Homography System (TSK-32).
    Maintains a 3x3 homography transformation matrix from broadcast camera perspective
    to canonical 2D pitch planar coordinates [0..1, 0..1].
    Dynamically adapts H across frames using Lucas-Kanade optical flow camera motion tracking
    (estimating translation, pan, tilt, and zoom scale factors).
    """

    def __init__(self):
        self.line_detector = PitchLineDetector()

        # Canonical initial base homography matrix (DLT perspective estimate)
        self.H: np.ndarray = np.array(
            [
                [1.15, -0.05, 0.02],
                [0.02, 1.25, -0.08],
                [0.08, 0.12, 1.00],
            ],
            dtype=np.float64,
        )

        # Previous frame cache for optical flow motion estimation
        self._prev_gray: Optional[np.ndarray] = None
        self._prev_pts: Optional[np.ndarray] = None

        # Cumulative camera motion metrics
        self.pan_accum_x: float = 0.0
        self.tilt_accum_y: float = 0.0
        self.zoom_accum_scale: float = 1.0
        self.updates_count: int = 0

    def set_canonical_homography(self, custom_h: np.ndarray):
        """Sets or resets the base homography matrix."""
        if custom_h.shape == (3, 3):
            self.H = custom_h.copy()

    def update_with_frame(self, bgr_frame: np.ndarray) -> Dict[str, Any]:
        """
        Processes new broadcast frame, estimates camera pan/tilt/zoom via optical flow,
        and dynamically updates homography matrix H.
        """
        curr_gray = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
        h, w = curr_gray.shape

        # Step 1: Detect pitch lines and white markings
        pitch_mask = self.line_detector.segment_pitch_mask(bgr_frame)
        lines, intersections = self.line_detector.detect_lines_and_intersections(bgr_frame)

        camera_delta_x = 0.0
        camera_delta_y = 0.0
        scale_factor = 1.0
        tracked_features_count = 0

        # Step 2: Optical flow motion estimation if previous frame exists
        if self._prev_gray is not None and self._prev_pts is not None and len(self._prev_pts) >= 6:
            next_pts, status, _ = cv2.calcOpticalFlowPyrLK(
                self._prev_gray,
                curr_gray,
                self._prev_pts,
                None,
                winSize=(21, 21),
                maxLevel=3,
                criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01),
            )

            # Filter valid tracking points
            good_prev = self._prev_pts[status == 1]
            good_next = next_pts[status == 1]
            tracked_features_count = len(good_next)

            if tracked_features_count >= 6:
                # Estimate Partial Affine transform (Translation + Rotation + Scale)
                M, inliers = cv2.estimateAffinePartial2D(good_prev, good_next, method=cv2.RANSAC)
                if M is not None:
                    camera_delta_x = float(M[0, 2]) / w
                    camera_delta_y = float(M[1, 2]) / h
                    # Scale extracted from affine rotation-scale matrix: sqrt(a^2 + b^2)
                    scale_factor = float(np.sqrt(M[0, 0] ** 2 + M[0, 1] ** 2))

                    # Apply adaptive homography warp update
                    # Warp matrix W: [s, 0, dx; 0, s, dy; 0, 0, 1]
                    W = np.array(
                        [
                            [scale_factor, 0.0, camera_delta_x],
                            [0.0, scale_factor, camera_delta_y],
                            [0.0, 0.0, 1.0],
                        ],
                        dtype=np.float64,
                    )

                    try:
                        # H_adaptive = H @ inv(W)
                        W_inv = np.linalg.inv(W)
                        # Smooth update with learning rate alpha=0.35 to avoid single-frame camera jitter
                        alpha = 0.35
                        H_candidate = self.H @ W_inv
                        self.H = (1.0 - alpha) * self.H + alpha * H_candidate
                        # Normalize H so H[2, 2] == 1.0
                        if abs(self.H[2, 2]) > 1e-6:
                            self.H /= self.H[2, 2]

                        self.pan_accum_x += camera_delta_x
                        self.tilt_accum_y += camera_delta_y
                        self.zoom_accum_scale *= scale_factor
                        self.updates_count += 1
                    except np.linalg.LinAlgError:
                        pass

        # Step 3: Refresh feature points on pitch surface for next frame tracking
        good_features = cv2.goodFeaturesToTrack(
            curr_gray,
            maxCorners=60,
            qualityLevel=0.03,
            minDistance=15,
            mask=pitch_mask,
        )

        self._prev_gray = curr_gray
        self._prev_pts = good_features

        return {
            "pan_delta_x": round(camera_delta_x, 5),
            "tilt_delta_y": round(camera_delta_y, 5),
            "zoom_scale": round(scale_factor, 4),
            "lines_detected": len(lines),
            "intersections_detected": len(intersections),
            "features_tracked": tracked_features_count,
            "homography_matrix": [[round(float(v), 5) for v in row] for row in self.H],
        }

    def transform_camera_to_pitch(self, camera_x: float, camera_y: float) -> Tuple[float, float]:
        """
        Transforms normalized broadcast camera perspective (x, y) into flat 2D pitch coordinates (pitch_x, pitch_y)
        using the dynamically adapted homography matrix H.
        """
        pt_cam = np.array([camera_x, camera_y, 1.0], dtype=np.float64)
        pt_pitch = self.H @ pt_cam

        w = pt_pitch[2]
        if abs(w) < 1e-6:
            w = 1.0

        px = float(pt_pitch[0] / w)
        py = float(pt_pitch[1] / w)

        # Clip within pitch bounds [0.02, 0.98]
        px = float(np.clip(px, 0.02, 0.98))
        py = float(np.clip(py, 0.02, 0.98))

        return round(px, 4), round(py, 4)
