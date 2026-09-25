from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
import asyncio
import json
import math
import os
try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None
import numpy as np
from app.core.config import settings
from app.services.video_tracker import (
    TacticalVideoTracker,
    generate_synthetic_soccer_video,
    ULTRALYTICS_AVAILABLE,
)

router = APIRouter()


class TrackingStartRequest(BaseModel):
    youtube_url: Optional[str] = Field(None, example="https://www.youtube.com/watch?v=sample_match")
    video_path: Optional[str] = Field(None, example="data/sample_crossing.mp4", description="Local MP4 video path for YOLOv8+ByteTrack tracking")
    session_id: str = Field(..., example="demo-session-tactical-001")
    fps_sample_rate: Optional[int] = Field(10, ge=1, le=30, description="Processing sample rate in FPS")
    max_frames: Optional[int] = Field(None, description="Maximum frames to process (None for full video)")
    save_annotated_video: Optional[bool] = Field(False, description="Whether to write annotated debug MP4 to disk")


class TrackingStartResponse(BaseModel):
    status: str
    session_id: str
    message: str
    estimated_frames: int
    tracker: str = "bytetrack"
    mode: str = "simulation"


class TrackingEntity(BaseModel):
    id: int
    team: Literal["home", "away", "ball"]
    x: float
    y: float
    speedKmh: Optional[float] = 0.0
    jerseyNumber: Optional[int] = None


class FramePayload(BaseModel):
    sessionId: str
    timestampMs: int
    frameNumber: int
    entities: List[TrackingEntity]


async def run_tracking_simulation(session_id: str, total_frames: int = 100):
    """
    Background worker simulating YOLOv8/ByteTrack computer vision detection & coordinate extraction.
    Generates realistic 2D tactical tracking payloads at 10 frames/sec and streams directly to Redis Pub/Sub.
    """
    print(f"🎯 [CV Worker] Commencing tactical vision tracking for session: {session_id}")

    redis_client = None
    redis_client = None
    if aioredis is not None:
        try:
            redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await redis_client.ping()
            print(f"📡 [CV Worker] Connected to Redis stream bus at {settings.REDIS_URL}")
        except Exception as exc:
            print(f"⚠️ [CV Worker] Redis not connected ({exc}). Simulating local worker execution.")
            redis_client = None
    else:
        print("ℹ️ [CV Worker] redis-py not installed in current environment. Simulating tracking coordinates locally.")

    # Base formation entities: 6 home, 6 away, 1 ball
    base_players = [
        {"id": 1, "team": "home", "x": 0.12, "y": 0.50, "vx": 0.001, "vy": 0.000, "num": 1},
        {"id": 2, "team": "home", "x": 0.28, "y": 0.22, "vx": 0.003, "vy": 0.001, "num": 2},
        {"id": 3, "team": "home", "x": 0.26, "y": 0.50, "vx": 0.002, "vy": -0.001, "num": 3},
        {"id": 4, "team": "home", "x": 0.28, "y": 0.78, "vx": 0.003, "vy": -0.001, "num": 4},
        {"id": 5, "team": "home", "x": 0.44, "y": 0.50, "vx": 0.004, "vy": 0.002, "num": 16},
        {"id": 6, "team": "home", "x": 0.62, "y": 0.45, "vx": 0.005, "vy": -0.002, "num": 9},

        {"id": 11, "team": "away", "x": 0.88, "y": 0.50, "vx": -0.001, "vy": 0.000, "num": 22},
        {"id": 12, "team": "away", "x": 0.72, "y": 0.28, "vx": -0.002, "vy": 0.001, "num": 2},
        {"id": 13, "team": "away", "x": 0.70, "y": 0.50, "vx": -0.002, "vy": -0.001, "num": 6},
        {"id": 14, "team": "away", "x": 0.72, "y": 0.72, "vx": -0.002, "vy": -0.001, "num": 4},
        {"id": 15, "team": "away", "x": 0.54, "y": 0.48, "vx": -0.003, "vy": 0.002, "num": 8},
        {"id": 16, "team": "away", "x": 0.48, "y": 0.25, "vx": -0.002, "vy": 0.003, "num": 7},

        {"id": 99, "team": "ball", "x": 0.46, "y": 0.49, "vx": 0.007, "vy": -0.004, "num": 0},
    ]

    for frame_idx in range(total_frames):
        timestamp_ms = frame_idx * 100  # 10 fps -> 100ms per frame

        entities_in_frame: List[TrackingEntity] = []

        for p in base_players:
            # Kinematics + Perlin-like pseudo sinusoidal sway
            sway_x = math.sin((frame_idx * 0.2) + p["id"]) * 0.006
            sway_y = math.cos((frame_idx * 0.2) + p["id"]) * 0.006

            curr_x = min(0.96, max(0.04, p["x"] + (p["vx"] * frame_idx * 0.4) + sway_x))
            curr_y = min(0.96, max(0.04, p["y"] + (p["vy"] * frame_idx * 0.4) + sway_y))

            # Calculate simulated instant speed (km/h)
            speed = 0.0
            if p["team"] == "ball":
                speed = round(18.0 + abs(math.sin(frame_idx * 0.3) * 45.0), 1)
            else:
                speed = round(12.0 + abs(math.sin(frame_idx * 0.15 + p["id"]) * 18.0), 1)

            entities_in_frame.append(
                TrackingEntity(
                    id=p["id"],
                    team=p["team"],
                    x=round(curr_x, 4),
                    y=round(curr_y, 4),
                    speedKmh=speed,
                    jerseyNumber=p.get("num")
                )
            )

        payload = FramePayload(
            sessionId=session_id,
            timestampMs=timestamp_ms,
            frameNumber=frame_idx,
            entities=entities_in_frame
        )

        # Publish payload to Redis Pub/Sub channel
        if redis_client:
            try:
                await redis_client.publish(settings.REDIS_CHANNEL, json.dumps(payload.dict()))
            except Exception as publish_err:
                print(f"⚠️ [CV Worker] Redis publish error: {publish_err}")

        # Sleep 100ms to throttle at 10 frames per second
        await asyncio.sleep(0.1)

    if redis_client:
        await redis_client.close()

    print(f"🏁 [CV Worker] Finished streaming {total_frames} tracking frames for session: {session_id}")


async def run_video_tracking_worker(
    video_path: str,
    session_id: str,
    fps_sample_rate: int = 10,
    max_frames: Optional[int] = None,
    save_annotated_video: bool = False,
):
    """
    Background worker running YOLOv8 + ByteTrack multi-object tracking (TSK-30)
    on local MP4 video file and streaming stabilized 2D tracking payloads to Redis Pub/Sub.
    """
    output_path = None
    if save_annotated_video:
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "data")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"annotated_{session_id}.mp4")

    tracker = TacticalVideoTracker()
    try:
        await tracker.stream_video_tracking(
            video_path=video_path,
            session_id=session_id,
            fps_sample_rate=fps_sample_rate,
            stream_to_redis=True,
            max_frames=max_frames,
            output_annotated_path=output_path,
        )
    except Exception as exc:
        print(f"❌ [VideoTrackingWorker] Tracking error for session {session_id}: {exc}")


@router.post("/start-tracking", response_model=TrackingStartResponse)
async def start_tracking_pipeline(payload: TrackingStartRequest, background_tasks: BackgroundTasks):
    """
    Accepts video_path (or youtube_url) and session_id.
    If a local MP4 video is provided, runs YOLOv8 + ByteTrack multi-object tracking (TSK-30).
    Otherwise, runs realistic tactical simulation streaming at 10 FPS to Redis.
    """
    if payload.video_path:
        target_video = payload.video_path
        if not os.path.isabs(target_video):
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            candidate = os.path.join(base_dir, target_video)
            if os.path.exists(candidate):
                target_video = candidate

        if os.path.exists(target_video):
            background_tasks.add_task(
                run_video_tracking_worker,
                video_path=target_video,
                session_id=payload.session_id,
                fps_sample_rate=payload.fps_sample_rate or 10,
                max_frames=payload.max_frames,
                save_annotated_video=payload.save_annotated_video or False,
            )
            return TrackingStartResponse(
                status="PROCESSING",
                session_id=payload.session_id,
                message=f"YOLOv8 + ByteTrack tracking worker dispatched on {os.path.basename(target_video)}.",
                estimated_frames=payload.max_frames or 100,
                tracker="bytetrack",
                mode="yolov8_bytetrack",
            )

    # Fallback to simulation if no local video provided or file not found
    background_tasks.add_task(run_tracking_simulation, payload.session_id, total_frames=100)

    return TrackingStartResponse(
        status="PROCESSING",
        session_id=payload.session_id,
        message="Computer vision tactical tracking worker dispatched in background. Streaming at 10 FPS.",
        estimated_frames=100,
        tracker="simulation",
        mode="simulation",
    )


class DirectTrackVideoResponse(BaseModel):
    session_id: str
    status: str
    video_path: str
    frames_processed: int
    unique_tracks_count: int
    tracker: str
    annotated_output: Optional[str] = None


@router.post("/track-video", response_model=DirectTrackVideoResponse)
async def track_video_endpoint(
    video_path: str,
    session_id: str = "tactiq-session-direct",
    fps_sample_rate: int = 10,
    max_frames: Optional[int] = 50,
    save_annotated: bool = False,
):
    """
    Direct synchronous endpoint for YOLOv8 + ByteTrack video tracking (TSK-30).
    Processes video and returns tracking execution summary.
    """
    target_video = video_path
    if not os.path.isabs(target_video):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        candidate = os.path.join(base_dir, target_video)
        if os.path.exists(candidate):
            target_video = candidate

    if not os.path.exists(target_video):
        raise HTTPException(status_code=404, detail=f"Video file not found at: {video_path}")

    out_annotated = None
    if save_annotated:
        data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")
        os.makedirs(data_dir, exist_ok=True)
        out_annotated = os.path.join(data_dir, f"annotated_{session_id}.mp4")

    tracker = TacticalVideoTracker()
    summary = await tracker.stream_video_tracking(
        video_path=target_video,
        session_id=session_id,
        fps_sample_rate=fps_sample_rate,
        stream_to_redis=False,
        max_frames=max_frames,
        output_annotated_path=out_annotated,
    )

    return DirectTrackVideoResponse(**summary)


@router.post("/generate-sample-match-video")
async def generate_sample_video_endpoint(duration_sec: int = 4, fps: int = 20):
    """
    Generates a synthetic MP4 soccer video with players crossing paths on the pitch.
    Useful for testing ByteTrack ID persistence and occlusion recovery locally.
    """
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, "sample_crossing.mp4")
    generate_synthetic_soccer_video(out_path, duration_sec=duration_sec, fps=fps)
    return {
        "status": "SUCCESS",
        "message": "Sample crossing MP4 video generated successfully.",
        "video_path": out_path,
        "duration_sec": duration_sec,
        "fps": fps,
    }


class HomographyPoint(BaseModel):
    camera_x: float = Field(..., ge=0.0, le=1.0, description="Normalized camera perspective X")
    camera_y: float = Field(..., ge=0.0, le=1.0, description="Normalized camera perspective Y")


class HomographyTransformRequest(BaseModel):
    points: List[HomographyPoint]


class PlanarPitchCoordinate(BaseModel):
    pitch_x_norm: float
    pitch_y_norm: float
    pitch_x_meters: float
    pitch_y_meters: float


class HomographyTransformResponse(BaseModel):
    planar_coordinates: List[PlanarPitchCoordinate]
    pitch_dimensions: str = "105m x 68m (FIFA Standard)"


def apply_camera_homography_transform(camera_x: float, camera_y: float) -> tuple[float, float]:
    """
    Field Homography Transformation (TSK-20)
    Maps raw broadcast camera coordinates (with perspective distortion)
    onto canonical 2D planar pitch coordinates [0..1, 0..1].
    """
    h11, h12, h13 = 1.15, -0.05, 0.02
    h21, h22, h23 = 0.02, 1.25, -0.08
    h31, h32, h33 = 0.08, 0.12, 1.00

    denom = (h31 * camera_x) + (h32 * camera_y) + h33
    if abs(denom) < 1e-6:
        denom = 1.0

    planar_x = ((h11 * camera_x) + (h12 * camera_y) + h13) / denom
    planar_y = ((h21 * camera_x) + (h22 * camera_y) + h23) / denom

    planar_x = float(np.clip(planar_x, 0.02, 0.98))
    planar_y = float(np.clip(planar_y, 0.02, 0.98))

    return round(planar_x, 4), round(planar_y, 4)


@router.post("/homography-transform", response_model=HomographyTransformResponse)
async def transform_camera_to_pitch(payload: HomographyTransformRequest):
    """
    Field Homography Endpoint (TSK-20)
    Converts a batch of camera 3D/perspective coordinates into flat 2D pitch coordinates.
    """
    results: List[PlanarPitchCoordinate] = []
    for pt in payload.points:
        px, py = apply_camera_homography_transform(pt.camera_x, pt.camera_y)
        results.append(
            PlanarPitchCoordinate(
                pitch_x_norm=px,
                pitch_y_norm=py,
                pitch_x_meters=round(px * 105.0, 2),
                pitch_y_meters=round(py * 68.0, 2),
            )
        )
    return HomographyTransformResponse(planar_coordinates=results)
