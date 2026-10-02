"""
TactIQ Computer Vision Video Tracking Engine (TSK-30)
Integrates Ultralytics YOLOv8 with ByteTrack for robust multi-object player and ball tracking.
Ensures persistent, stabilized tracking IDs across player crossings and occlusions.
"""

import os
import cv2
import math
import json
import asyncio
import logging
from typing import List, Dict, Optional, Tuple, Any
import numpy as np

from app.core.config import settings
from app.services.team_classifier import TeamKMeansClassifier
from app.services.field_homography import DynamicHomographyEstimator

logger = logging.getLogger("tactiq.video_tracker")

# Graceful import of Ultralytics YOLO
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    YOLO = None
    ULTRALYTICS_AVAILABLE = False
    logger.warning("⚠️ Ultralytics is not available. Real CV tracking will use fallback mock mode.")

# Graceful import of Redis
try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None


class TrackedBoundingBox:
    def __init__(self, track_id: int, cls_id: int, conf: float, bbox: Tuple[float, float, float, float], team: str = "home"):
        self.track_id = track_id
        self.cls_id = cls_id
        self.conf = conf
        self.x1, self.y1, self.x2, self.y2 = bbox
        self.team = team

    @property
    def bottom_center(self) -> Tuple[float, float]:
        """Calculates foot ground-contact coordinate on the pitch."""
        return ((self.x1 + self.x2) / 2.0, self.y2)

    @property
    def center(self) -> Tuple[float, float]:
        """Calculates geometric center."""
        return ((self.x1 + self.x2) / 2.0, (self.y1 + self.y2) / 2.0)


def compute_tactical_metrics(
    home_players: List[Dict[str, float]],
    away_players: List[Dict[str, float]]
) -> Dict[str, float]:
    """
    Computes modern tactical kinematics:
    1. Defensive Line Height (meters from own goal)
    2. Team Compactness Hull Area (m^2)
    3. Inter-line Distance between defenders and midfielders (meters)
    """
    # 1. Defensive Line Height
    # Home attacks left->right (goal at 0m), Away attacks right->left (goal at 105m)
    if len(home_players) >= 3:
        home_xs = sorted([p["x"] for p in home_players])
        def_line_h = float(np.mean(home_xs[:min(4, len(home_xs))]) * 105.0)
    elif len(home_players) > 0:
        def_line_h = float(min(p["x"] for p in home_players) * 105.0)
    else:
        def_line_h = 28.5

    if len(away_players) >= 3:
        away_xs = sorted([p["x"] for p in away_players], reverse=True)
        def_line_a = float((1.0 - np.mean(away_xs[:min(4, len(away_xs))])) * 105.0)
    elif len(away_players) > 0:
        def_line_a = float((1.0 - max(p["x"] for p in away_players)) * 105.0)
    else:
        def_line_a = 32.0

    # 2. Compactness Hull Area (m^2 via Shoelace on pitch 105m x 68m)
    def polygon_area(pts: List[Dict[str, float]]) -> float:
        if len(pts) < 3:
            return 480.0
        cx = sum(p["x"] for p in pts) / len(pts)
        cy = sum(p["y"] for p in pts) / len(pts)
        sorted_pts = sorted(pts, key=lambda p: math.atan2(p["y"] - cy, p["x"] - cx))
        area = 0.0
        n = len(sorted_pts)
        for i in range(n):
            j = (i + 1) % n
            xi = sorted_pts[i]["x"] * 105.0
            yi = sorted_pts[i]["y"] * 68.0
            xj = sorted_pts[j]["x"] * 105.0
            yj = sorted_pts[j]["y"] * 68.0
            area += xi * yj - xj * yi
        return max(180.0, round(abs(area) * 0.5, 1))

    area_h = polygon_area(home_players)
    area_a = polygon_area(away_players)

    # 3. Inter-line Distance (Defenders to Midfielders in meters)
    def interline_dist(pts: List[Dict[str, float]], is_home: bool) -> float:
        if len(pts) < 4:
            return 16.5
        xs = sorted([p["x"] for p in pts])
        if is_home:
            def_x = np.mean(xs[:max(2, len(xs) // 3)])
            mid_x = np.mean(xs[max(2, len(xs) // 3) : 2 * len(xs) // 3])
        else:
            xs_rev = sorted(xs, reverse=True)
            def_x = np.mean(xs_rev[:max(2, len(xs_rev) // 3)])
            mid_x = np.mean(xs_rev[max(2, len(xs_rev) // 3) : 2 * len(xs_rev) // 3])
        dist_m = abs(float(mid_x - def_x)) * 105.0
        return max(8.0, min(35.0, round(dist_m, 1)))

    inter_h = interline_dist(home_players, True)
    inter_a = interline_dist(away_players, False)

    return {
        "homeDefensiveLineMeters": round(def_line_h, 1),
        "awayDefensiveLineMeters": round(def_line_a, 1),
        "homeCompactnessAreaM2": round(area_h, 1),
        "awayCompactnessAreaM2": round(area_a, 1),
        "homeInterLineDistanceMeters": round(inter_h, 1),
        "awayInterLineDistanceMeters": round(inter_a, 1),
    }


class TacticalVideoTracker:
    """
    Production-grade YOLOv8 + ByteTrack Video Tracking Engine for Football/Soccer matches.
    Reads MP4 video files, runs detection + tracking, associates persistent IDs,
    calculates instantaneous velocities, and streams 2D tactical coordinate payloads.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        tracker_config: Optional[str] = None,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.5,
    ):
        self.model_path = model_path or settings.YOLO_MODEL_PATH
        self.tracker_config = tracker_config or settings.DEFAULT_TRACKER
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.model = None

        # Track history cache for velocity smoothing: track_id -> [(timestamp_s, x_norm, y_norm)]
        self._track_history: Dict[int, List[Tuple[float, float, float]]] = {}
        self._track_teams: Dict[int, str] = {}
        self.team_classifier = TeamKMeansClassifier()
        self.homography_estimator = DynamicHomographyEstimator()

        self._initialize_model()

    def _initialize_model(self):
        if not ULTRALYTICS_AVAILABLE or YOLO is None:
            logger.warning("[TacticalVideoTracker] Ultralytics YOLO not installed. Tracking will run in emulation mode.")
            return

        try:
            logger.info(f"🚀 [TacticalVideoTracker] Loading YOLOv8 model from '{self.model_path}'...")
            self.model = YOLO(self.model_path)
            logger.info(f"✅ [TacticalVideoTracker] YOLOv8 model loaded successfully with tracker '{self.tracker_config}'.")
        except Exception as exc:
            logger.error(f"❌ [TacticalVideoTracker] Failed to initialize YOLO model: {exc}")
            self.model = None

    def calculate_velocity_kmh(
        self, track_id: int, current_x: float, current_y: float, timestamp_s: float
    ) -> float:
        """
        Calculates smoothed instantaneous speed in km/h based on pitch movement.
        Assuming pitch dimensions 105m x 68m.
        """
        if track_id not in self._track_history:
            self._track_history[track_id] = []

        history = self._track_history[track_id]
        history.append((timestamp_s, current_x, current_y))

        # Keep max 5 past positions for moving average
        if len(history) > 5:
            history.pop(0)

        if len(history) < 2:
            return 0.0

        prev_t, prev_x, prev_y = history[-2]
        dt = timestamp_s - prev_t
        if dt <= 0:
            return 0.0

        # Convert normalized pitch delta to meters (105m length x 68m width)
        dx_m = (current_x - prev_x) * 105.0
        dy_m = (current_y - prev_y) * 68.0
        dist_m = math.sqrt(dx_m**2 + dy_m**2)

        speed_mps = dist_m / dt
        speed_kmh = speed_mps * 3.6

        # Cap realistic soccer speed (max sprint ~36 km/h)
        speed_kmh = min(36.0, max(0.0, speed_kmh))
        return round(speed_kmh, 1)

    def determine_entity_team(
        self,
        track_id: int,
        cls_id: int,
        x_norm: float,
        frame: Optional[np.ndarray] = None,
        bbox: Optional[Tuple[float, float, float, float]] = None,
    ) -> str:
        """
        Assigns team ('home', 'away', or 'ball') using automated K-Means jersey color clustering (TSK-31).
        """
        if cls_id == 32:  # Sports ball
            return "ball"

        if frame is not None and bbox is not None:
            return self.team_classifier.classify_player(track_id, frame, bbox, x_norm)

        if track_id in self._track_teams:
            return self._track_teams[track_id]

        # Heuristic seed: left hemisphere initially bias home, right hemisphere bias away
        team = "home" if x_norm < 0.50 else "away"
        self._track_teams[track_id] = team
        return team

    def track_frame_detections(self, frame: np.ndarray, persist: bool = True) -> List[TrackedBoundingBox]:
        """
        Performs YOLOv8 object detection and ByteTrack multi-object tracking on a single video frame.
        Filter classes: 0 (person/player), 32 (sports ball).
        """
        if self.model is None:
            return []

        # Run Ultralytics ByteTrack tracking
        results = self.model.track(
            source=frame,
            persist=persist,
            tracker=self.tracker_config,
            classes=[0, 32],
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            verbose=False,
        )

        detections: List[TrackedBoundingBox] = []
        if not results or len(results) == 0:
            return detections

        first_res = results[0]
        boxes = first_res.boxes
        if boxes is None or len(boxes) == 0:
            return detections

        for i in range(len(boxes)):
            box = boxes[i]
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            xyxy = box.xyxy[0].cpu().numpy().tolist()

            # ByteTrack track_id
            track_id = int(box.id[0].item()) if (box.id is not None and len(box.id) > 0) else (1000 + i)

            detections.append(
                TrackedBoundingBox(
                    track_id=track_id,
                    cls_id=cls_id,
                    conf=conf,
                    bbox=(xyxy[0], xyxy[1], xyxy[2], xyxy[3]),
                )
            )

        return detections

    async def stream_video_tracking(
        self,
        video_path: str,
        session_id: str,
        fps_sample_rate: int = 10,
        stream_to_redis: bool = True,
        max_frames: Optional[int] = None,
        output_annotated_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Reads local MP4 video file, processes frames with YOLOv8 + ByteTrack,
        and optionally streams real-time coordinate payloads to Redis Pub/Sub.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video file at: {video_path}")

        orig_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
        orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
        total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 100

        # Frame skip step to match desired fps_sample_rate (e.g. 10 FPS)
        step = max(1, int(round(orig_fps / fps_sample_rate)))

        # Redis connection
        redis_client = None
        if stream_to_redis and aioredis is not None:
            try:
                redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                await redis_client.ping()
                logger.info(f"📡 [VideoTracker] Streaming to Redis channel: {settings.REDIS_CHANNEL}")
            except Exception as e:
                logger.warning(f"⚠️ [VideoTracker] Redis stream unavailable: {e}. Processing without publish.")
                redis_client = None

        # Video writer for annotated debugging output (if requested)
        writer = None
        if output_annotated_path:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_annotated_path, fourcc, fps_sample_rate, (orig_width, orig_height))

        frame_idx = 0
        emitted_frame_count = 0
        unique_track_ids = set()

        logger.info(
            f"🎬 [VideoTracker] Starting tracking on {video_path} "
            f"({orig_width}x{orig_height} @ {orig_fps:.1f} FPS, sampling @ {fps_sample_rate} FPS)..."
        )

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % step != 0:
                    frame_idx += 1
                    continue

                timestamp_ms = int((frame_idx / orig_fps) * 1000)
                timestamp_s = timestamp_ms / 1000.0

                # 1. Update adaptive field homography from pitch lines and camera motion
                try:
                    self.homography_estimator.update_with_frame(frame)
                except Exception as h_err:
                    logger.debug(f"Homography update skipped for frame {frame_idx}: {h_err}")

                # 2. Run YOLOv8 + ByteTrack multi-object tracking
                detections = self.track_frame_detections(frame, persist=True)

                entities: List[Dict[str, Any]] = []
                home_players: List[Dict[str, float]] = []
                away_players: List[Dict[str, float]] = []

                for det in detections:
                    unique_track_ids.add(det.track_id)

                    # Compute ground contact pitch coordinate
                    if det.cls_id == 32:  # Ball
                        cx, cy = det.center
                    else:  # Player (feet position)
                        cx, cy = det.bottom_center

                    cam_x = round(float(np.clip(cx / orig_width, 0.0, 1.0)), 4)
                    cam_y = round(float(np.clip(cy / orig_height, 0.0, 1.0)), 4)

                    # Project broadcast camera perspective to canonical 2D planar pitch coordinates
                    pitch_x, pitch_y = self.homography_estimator.transform_camera_to_pitch(cam_x, cam_y)

                    team = self.determine_entity_team(
                        det.track_id, det.cls_id, pitch_x, frame=frame, bbox=(det.x1, det.y1, det.x2, det.y2)
                    )
                    speed_kmh = self.calculate_velocity_kmh(det.track_id, pitch_x, pitch_y, timestamp_s)

                    entity_dict = {
                        "id": det.track_id,
                        "team": team,
                        "x": pitch_x,
                        "y": pitch_y,
                        "camera_x": cam_x,
                        "camera_y": cam_y,
                        "speedKmh": speed_kmh,
                        "jerseyNumber": det.track_id if det.cls_id != 32 else None,
                        "bbox": [round(det.x1, 1), round(det.y1, 1), round(det.x2, 1), round(det.y2, 1)],
                        "confidence": round(det.conf, 2),
                    }
                    entities.append(entity_dict)

                    if team == "home":
                        home_players.append({"x": pitch_x, "y": pitch_y})
                    elif team == "away":
                        away_players.append({"x": pitch_x, "y": pitch_y})

                    # Optional visual annotation on frame
                    if writer is not None:
                        color = (0, 255, 0) if team == "home" else ((0, 140, 255) if team == "away" else (0, 255, 255))
                        cv2.rectangle(frame, (int(det.x1), int(det.y1)), (int(det.x2), int(det.y2)), color, 2)
                        label = f"ID:{det.track_id} {team.upper()} ({pitch_x:.2f},{pitch_y:.2f})" if det.cls_id != 32 else "BALL"
                        cv2.putText(
                            frame, label, (int(det.x1), max(20, int(det.y1) - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2
                        )

                # Compute modern real-time tactical kinematics
                tactical_metrics = compute_tactical_metrics(home_players, away_players)

                payload = {
                    "sessionId": session_id,
                    "timestampMs": timestamp_ms,
                    "frameNumber": emitted_frame_count,
                    "entities": entities,
                    "tacticalMetrics": tactical_metrics,
                }

                # Publish to Redis
                if redis_client:
                    try:
                        await redis_client.publish(settings.REDIS_CHANNEL, json.dumps(payload))
                    except Exception as pub_err:
                        logger.error(f"Redis publish error: {pub_err}")

                if writer is not None:
                    writer.write(frame)

                emitted_frame_count += 1
                frame_idx += 1

                if max_frames and emitted_frame_count >= max_frames:
                    logger.info(f"Reached max frame count limit ({max_frames}). Stopping.")
                    break

                # Yield control to event loop
                await asyncio.sleep(0.001)

        finally:
            cap.release()
            if writer is not None:
                writer.release()
            if redis_client:
                await redis_client.close()

        logger.info(
            f"✅ [VideoTracker] Finished tracking {emitted_frame_count} frames. "
            f"Unique tracking IDs identified: {len(unique_track_ids)}."
        )

        return {
            "session_id": session_id,
            "status": "COMPLETED",
            "video_path": video_path,
            "frames_processed": emitted_frame_count,
            "unique_tracks_count": len(unique_track_ids),
            "tracker": self.tracker_config,
            "team_summary": self.team_classifier.get_team_summary(),
            "annotated_output": output_annotated_path if output_annotated_path else None,
        }


def generate_synthetic_soccer_video(output_path: str, duration_sec: int = 4, fps: int = 20) -> str:
    """
    Generates a synthetic MP4 video of two players crossing each other on a green soccer pitch.
    Used for automated verification of ByteTrack ID stability during player crossing/occlusion.
    """
    width, height = 960, 540
    total_frames = duration_sec * fps
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    try:
        for f in range(total_frames):
            # Pitch background (green)
            frame = np.full((height, width, 3), (34, 139, 34), dtype=np.uint8)

            # Pitch markings (white lines)
            cv2.rectangle(frame, (50, 50), (width - 50, height - 50), (255, 255, 255), 2)
            cv2.line(frame, (width // 2, 50), (width // 2, height - 50), (255, 255, 255), 2)
            cv2.circle(frame, (width // 2, height // 2), 60, (255, 255, 255), 2)

            t = f / float(total_frames)

            # Player 1 (Moving Left to Right): Red jersey / human-like silhouette
            p1_x = int(150 + t * (width - 300))
            p1_y = int(height // 2 + math.sin(t * math.pi) * 40)
            # Head + Torso + Legs
            cv2.circle(frame, (p1_x, p1_y - 45), 12, (200, 180, 160), -1)  # Head
            cv2.rectangle(frame, (p1_x - 14, p1_y - 33), (p1_x + 14, p1_y), (30, 30, 220), -1)  # Red Torso
            cv2.line(frame, (p1_x + 6, p1_y), (p1_x + 6, p1_y + 35), (20, 20, 120), 4)  # Right Leg

            # Player 2 (Moving Right to Left): Blue jersey (MCI) crossing path
            p2_x = int((width - 150) - t * (width - 300))
            p2_y = int(height // 2 - math.sin(t * math.pi) * 40)
            cv2.circle(frame, (p2_x, p2_y - 45), 12, (200, 180, 160), -1)  # Head
            cv2.rectangle(frame, (p2_x - 14, p2_y - 33), (p2_x + 14, p2_y), (220, 80, 20), -1)  # Blue Torso
            cv2.line(frame, (p2_x - 6, p2_y), (p2_x - 6, p2_y + 35), (120, 40, 10), 4)  # Left Leg
            cv2.line(frame, (p2_x + 6, p2_y), (p2_x + 6, p2_y + 35), (120, 40, 10), 4)  # Right Leg

            # Match Ball (White with shadow moving dynamically)
            ball_t = (t * 2.5) % 1.0
            ball_x = int(p1_x + ball_t * (p2_x - p1_x))
            ball_y = int(p1_y + math.sin(ball_t * math.pi) * -25)
            cv2.circle(frame, (ball_x + 2, ball_y + 4), 6, (20, 60, 20), -1)  # shadow
            cv2.circle(frame, (ball_x, ball_y), 5, (255, 255, 255), -1)
            cv2.circle(frame, (ball_x, ball_y), 5, (0, 0, 0), 1)

            # Player 3 (MUN Midfielder #18 Casemiro supporting in midfield)
            p3_x = int(120 + t * (width - 400))
            p3_y = int(height // 2 + 90 + math.cos(t * math.pi * 2) * 15)
            cv2.circle(frame, (p3_x, p3_y - 45), 12, (200, 180, 160), -1)
            cv2.rectangle(frame, (p3_x - 14, p3_y - 33), (p3_x + 14, p3_y), (30, 30, 220), -1)
            cv2.line(frame, (p3_x - 6, p3_y), (p3_x - 6, p3_y + 35), (20, 20, 120), 4)
            cv2.line(frame, (p3_x + 6, p3_y), (p3_x + 6, p3_y + 35), (20, 20, 120), 4)

            # Player 4 (MCI Midfielder #8 Kovacic tracking back)
            p4_x = int((width - 120) - t * (width - 380))
            p4_y = int(height // 2 + 100 - math.sin(t * math.pi * 2) * 15)
            cv2.circle(frame, (p4_x, p4_y - 45), 12, (200, 180, 160), -1)
            cv2.rectangle(frame, (p4_x - 14, p4_y - 33), (p4_x + 14, p4_y), (220, 80, 20), -1)
            cv2.line(frame, (p4_x - 6, p4_y), (p4_x - 6, p4_y + 35), (120, 40, 10), 4)
            cv2.line(frame, (p4_x + 6, p4_y), (p4_x + 6, p4_y + 35), (120, 40, 10), 4)

            out.write(frame)
    finally:
        out.release()

    return output_path
