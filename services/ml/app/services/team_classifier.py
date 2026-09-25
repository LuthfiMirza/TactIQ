"""
TactIQ Automated Jersey Color & Team Classifier (TSK-31)
Uses computer vision torso cropping, pitch-grass masking, and K-Means Clustering
to automatically classify players into Home vs. Away teams without manual tagging.
"""

import cv2
import numpy as np
import logging
from typing import List, Dict, Tuple, Optional, Any
from sklearn.cluster import KMeans, MiniBatchKMeans

logger = logging.getLogger("tactiq.team_classifier")


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Converts RGB integers to hexadecimal color string."""
    return f"#{int(r):02x}{int(g):02x}{int(b):02x}".upper()


class JerseyColorExtractor:
    """
    Extracts the dominant jersey/shirt color of a soccer player from a bounding box.
    Crops the torso region (avoiding face/hair and shorts/grass) and masks out
    residual pitch grass colors.
    """

    def __init__(self, n_clusters: int = 2):
        self.n_clusters = n_clusters

    def crop_torso(self, frame: np.ndarray, bbox: Tuple[float, float, float, float]) -> Optional[np.ndarray]:
        """
        Crops torso region:
        - Vertical: 20% to 55% of bbox height (shirt area)
        - Horizontal: 15% to 85% of bbox width (avoids surrounding background)
        """
        x1, y1, x2, y2 = [int(v) for v in bbox]
        h = y2 - y1
        w = x2 - x1

        if h < 20 or w < 10:
            return None

        # Clamp boundaries to frame dimensions
        frame_h, frame_w = frame.shape[:2]
        torso_y1 = max(0, min(frame_h - 1, y1 + int(h * 0.20)))
        torso_y2 = max(0, min(frame_h, y1 + int(h * 0.55)))
        torso_x1 = max(0, min(frame_w - 1, x1 + int(w * 0.15)))
        torso_x2 = max(0, min(frame_w, x1 + int(w * 0.85)))

        if torso_y2 <= torso_y1 or torso_x2 <= torso_x1:
            return None

        return frame[torso_y1:torso_y2, torso_x1:torso_x2]

    def remove_grass_background(self, bgr_crop: np.ndarray) -> np.ndarray:
        """
        Filters out green soccer pitch background pixels using HSV color thresholding.
        """
        hsv = cv2.cvtColor(bgr_crop, cv2.COLOR_BGR2HSV)
        # Soccer green grass range: Hue ~35-85, Saturation ~35-255, Value ~35-255
        lower_green = np.array([35, 35, 35], dtype=np.uint8)
        upper_green = np.array([85, 255, 255], dtype=np.uint8)

        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        non_green_mask = cv2.bitwise_not(green_mask)

        # Extract RGB pixels where mask is true
        rgb_crop = cv2.cvtColor(bgr_crop, cv2.COLOR_BGR2RGB)
        valid_pixels = rgb_crop[non_green_mask > 0]

        # If grass filter eliminated too many pixels (e.g. green jerseys), return all pixels
        if len(valid_pixels) < 25:
            return rgb_crop.reshape(-1, 3)

        return valid_pixels

    def extract_dominant_color(self, frame: np.ndarray, bbox: Tuple[float, float, float, float]) -> Optional[Tuple[int, int, int]]:
        """
        Extracts dominant (R, G, B) jersey color for a player bounding box.
        """
        torso = self.crop_torso(frame, bbox)
        if torso is None or torso.size == 0:
            return None

        pixels = self.remove_grass_background(torso)
        if len(pixels) < 10:
            return None

        try:
            # Use MiniBatchKMeans for fast, low-latency color extraction
            kmeans = MiniBatchKMeans(
                n_clusters=min(self.n_clusters, len(pixels)),
                random_state=42,
                batch_size=256,
                n_init=3,
            )
            kmeans.fit(pixels)

            # Find the largest cluster
            counts = np.bincount(kmeans.labels_)
            dominant_idx = np.argmax(counts)
            dominant_rgb = kmeans.cluster_centers_[dominant_idx].astype(int)

            return (int(dominant_rgb[0]), int(dominant_rgb[1]), int(dominant_rgb[2]))
        except Exception as exc:
            logger.debug(f"Dominant color extraction fallback: {exc}")
            # Mean RGB fallback
            mean_rgb = np.mean(pixels, axis=0).astype(int)
            return (int(mean_rgb[0]), int(mean_rgb[1]), int(mean_rgb[2]))


class TeamKMeansClassifier:
    """
    Groups players into Home vs. Away teams by clustering their extracted jersey colors.
    """

    def __init__(self):
        self.color_extractor = JerseyColorExtractor(n_clusters=2)
        self.kmeans: Optional[KMeans] = None
        self.home_color_rgb: Optional[Tuple[int, int, int]] = None
        self.away_color_rgb: Optional[Tuple[int, int, int]] = None
        self.is_fitted: bool = False

        # Cache of track_id -> List of observed dominant RGB colors
        self.player_color_history: Dict[int, List[Tuple[int, int, int]]] = {}
        # Final assigned team: track_id -> "home" | "away"
        self.player_team_assignments: Dict[int, str] = {}

    def record_player_color(self, track_id: int, frame: np.ndarray, bbox: Tuple[float, float, float, float]) -> Optional[Tuple[int, int, int]]:
        """
        Extracts and registers player jersey color into tracking memory.
        """
        color = self.color_extractor.extract_dominant_color(frame, bbox)
        if color is not None:
            if track_id not in self.player_color_history:
                self.player_color_history[track_id] = []
            self.player_color_history[track_id].append(color)
            # Retain maximum 15 recent color observations per player
            if len(self.player_color_history[track_id]) > 15:
                self.player_color_history[track_id].pop(0)
        return color

    def fit_teams(self, min_players: int = 2) -> bool:
        """
        Performs K-Means (k=2) clustering on average jersey colors of all detected players
        to discover the two distinct team palettes.
        """
        if len(self.player_color_history) < min_players:
            return False

        player_ids = []
        player_avg_colors = []

        for p_id, colors in self.player_color_history.items():
            if colors:
                avg_rgb = np.mean(colors, axis=0)
                player_ids.append(p_id)
                player_avg_colors.append(avg_rgb)

        if len(player_avg_colors) < 2:
            return False

        X = np.array(player_avg_colors)

        # Run K-Means with k=2
        self.kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
        labels = self.kmeans.fit_predict(X)

        centers = self.kmeans.cluster_centers_.astype(int)
        self.home_color_rgb = (int(centers[0][0]), int(centers[0][1]), int(centers[0][2]))
        self.away_color_rgb = (int(centers[1][0]), int(centers[1][1]), int(centers[1][2]))

        # Assign team labels to each player
        for p_id, label in zip(player_ids, labels):
            self.player_team_assignments[p_id] = "home" if label == 0 else "away"

        self.is_fitted = True
        logger.info(
            f"🎯 [TeamClassifier] Successfully clustered {len(player_ids)} players! "
            f"Home color: {rgb_to_hex(*self.home_color_rgb)}, Away color: {rgb_to_hex(*self.away_color_rgb)}"
        )
        return True

    def classify_player(
        self, track_id: int, frame: np.ndarray, bbox: Tuple[float, float, float, float], x_norm: float
    ) -> str:
        """
        Returns 'home' or 'away' for a player.
        Extracts jersey color, records it, and if K-Means is fitted, predicts team.
        """
        color = self.record_player_color(track_id, frame, bbox)

        # If already classified and confident
        if track_id in self.player_team_assignments and self.is_fitted:
            return self.player_team_assignments[track_id]

        # Attempt to fit if we have accumulated enough players
        if not self.is_fitted and len(self.player_color_history) >= 4:
            self.fit_teams()

        # If fitted, predict using nearest cluster centroid
        if self.is_fitted and self.kmeans is not None:
            if color is not None:
                label = self.kmeans.predict([color])[0]
                team = "home" if label == 0 else "away"
                self.player_team_assignments[track_id] = team
                return team

        # Fallback heuristic until clustering is ready: field hemisphere
        team = "home" if x_norm < 0.50 else "away"
        self.player_team_assignments[track_id] = team
        return team

    def get_team_summary(self) -> Dict[str, Any]:
        """Returns metadata regarding detected team colors and player counts."""
        home_count = sum(1 for t in self.player_team_assignments.values() if t == "home")
        away_count = sum(1 for t in self.player_team_assignments.values() if t == "away")

        return {
            "is_fitted": self.is_fitted,
            "total_players_classified": len(self.player_team_assignments),
            "home": {
                "count": home_count,
                "color_rgb": list(self.home_color_rgb) if self.home_color_rgb else [220, 20, 20],
                "color_hex": rgb_to_hex(*self.home_color_rgb) if self.home_color_rgb else "#DC1414",
            },
            "away": {
                "count": away_count,
                "color_rgb": list(self.away_color_rgb) if self.away_color_rgb else [20, 50, 220],
                "color_hex": rgb_to_hex(*self.away_color_rgb) if self.away_color_rgb else "#1432DC",
            },
        }
