from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
import asyncio
import json
import math
import os
import shutil
try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None
import numpy as np
from app.core.config import settings
from app.services.video_tracker import (
    TacticalVideoTracker,
    generate_synthetic_soccer_video,
    compute_tactical_metrics,
    ULTRALYTICS_AVAILABLE,
)
from app.services.field_homography import DynamicHomographyEstimator, PitchLineDetector

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
    camera_x: Optional[float] = None
    camera_y: Optional[float] = None
    bbox: Optional[List[float]] = None
    confidence: Optional[float] = None


class FramePayload(BaseModel):
    sessionId: str
    timestampMs: int
    frameNumber: int
    entities: List[TrackingEntity]
    tacticalMetrics: Optional[Dict[str, float]] = None


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

        # Compute modern real-time tactical kinematics
        h_pts = [{"x": e.x, "y": e.y} for e in entities_in_frame if e.team == "home"]
        a_pts = [{"x": e.x, "y": e.y} for e in entities_in_frame if e.team == "away"]
        metrics = compute_tactical_metrics(h_pts, a_pts)

        payload = FramePayload(
            sessionId=session_id,
            timestampMs=timestamp_ms,
            frameNumber=frame_idx,
            entities=entities_in_frame,
            tacticalMetrics=metrics,
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


@router.post("/upload-video")
@router.post("/tracking/upload-video")
async def upload_video_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    fps_sample_rate: Optional[int] = Form(10),
    max_frames: Optional[int] = Form(None),
    save_annotated_video: Optional[bool] = Form(False),
):
    """
    Direct multipart/form-data MP4 video upload endpoint.
    Saves uploaded file to disk and runs YOLOv8 + ByteTrack computer vision tracking in background.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No video file provided.")

    clean_session_id = session_id or f"upload-{int(asyncio.get_event_loop().time() * 1000)}"
    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "uploads"))
    os.makedirs(uploads_dir, exist_ok=True)

    safe_filename = f"{clean_session_id}_{os.path.basename(file.filename)}"
    destination = os.path.join(uploads_dir, safe_filename)

    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(destination)

    # Dispatch YOLOv8 tracking in background
    background_tasks.add_task(
        run_video_tracking_worker,
        video_path=destination,
        session_id=clean_session_id,
        fps_sample_rate=fps_sample_rate or 10,
        max_frames=max_frames,
        save_annotated_video=save_annotated_video or False,
    )

    return {
        "status": "PROCESSING",
        "session_id": clean_session_id,
        "video_path": destination,
        "filename": file.filename,
        "size_bytes": file_size,
        "tracker": "yolov8_bytetrack",
        "message": f"Video {file.filename} uploaded successfully. YOLOv8 + ByteTrack tracking running in background.",
    }


class DirectTrackVideoResponse(BaseModel):
    session_id: str
    status: str
    video_path: str
    frames_processed: int
    unique_tracks_count: int
    tracker: str
    team_summary: Optional[Dict[str, Any]] = None
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
    is_adaptive: bool = True
    homography_matrix: Optional[List[List[float]]] = None


# Persistent adaptive homography engine instance (TSK-32)
adaptive_homography_engine = DynamicHomographyEstimator()


def apply_camera_homography_transform(camera_x: float, camera_y: float) -> tuple[float, float]:
    """
    Field Homography Transformation (TSK-20 & TSK-32)
    Maps raw broadcast camera coordinates onto canonical 2D planar pitch coordinates [0..1, 0..1]
    using the adaptive homography engine.
    """
    return adaptive_homography_engine.transform_camera_to_pitch(camera_x, camera_y)


@router.post("/homography-transform", response_model=HomographyTransformResponse)
async def transform_camera_to_pitch(payload: HomographyTransformRequest):
    """
    Field Homography Endpoint (TSK-20 & TSK-32)
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
    h_matrix = [[round(float(v), 5) for v in row] for row in adaptive_homography_engine.H]
    return HomographyTransformResponse(
        planar_coordinates=results,
        is_adaptive=True,
        homography_matrix=h_matrix,
    )


class Point2D(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)


class Calibrate4PointsRequest(BaseModel):
    camera_points: List[Point2D] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="4 normalized camera coordinates in order [Top-Left, Top-Right, Bottom-Right, Bottom-Left]"
    )
    pitch_points: Optional[List[Point2D]] = Field(
        None,
        description="Optional 4 target pitch canonical coordinates [0..1, 0..1]. Defaults to standard field rectangle."
    )


class Calibrate4PointsResponse(BaseModel):
    status: str
    message: str
    homography_matrix: List[List[float]]
    reprojection_error: float
    is_active: bool


@router.post("/calibrate-homography-4points", response_model=Calibrate4PointsResponse)
async def calibrate_homography_4points_endpoint(payload: Calibrate4PointsRequest):
    """
    [TSK-20, TSK-42 / DEF-08]
    Direct 4-point homography estimation endpoint for broadcast camera perspectives.
    Calculates 3x3 homography matrix via Direct Linear Transformation and updates active engine.
    """
    if len(payload.camera_points) != 4:
        raise HTTPException(status_code=400, detail="Exactly 4 camera coordinate points are required [TL, TR, BR, BL].")

    cam_pts = [(pt.x, pt.y) for pt in payload.camera_points]
    pitch_pts = [(pt.x, pt.y) for pt in payload.pitch_points] if payload.pitch_points else None

    try:
        new_H = adaptive_homography_engine.calibrate_from_4points(cam_pts, pitch_pts)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Homography calibration failed: {exc}")

    # Evaluate reprojection error across calibration points
    target_pitch = pitch_pts or [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    errors = []
    for (cx, cy), (tx, ty) in zip(cam_pts, target_pitch):
        px, py = adaptive_homography_engine.transform_camera_to_pitch(cx, cy)
        dist = math.hypot(px - tx, py - ty)
        errors.append(dist)
    mean_err = float(np.mean(errors))

    h_matrix = [[round(float(v), 5) for v in row] for row in new_H]
    return Calibrate4PointsResponse(
        status="SUCCESS",
        message="4-point broadcast perspective homography calibrated successfully.",
        homography_matrix=h_matrix,
        reprojection_error=round(mean_err, 5),
        is_active=True,
    )


class FieldLineDetectionRequest(BaseModel):
    video_path: Optional[str] = Field("data/sample_crossing.mp4", description="Path to MP4 video")
    frame_index: Optional[int] = Field(0, description="Frame index to analyze")


class FieldLineDetectionResponse(BaseModel):
    status: str
    video_path: str
    frame_index: int
    lines_detected: int
    intersections_detected: int
    pan_delta_x: float
    tilt_delta_y: float
    zoom_scale: float
    features_tracked: int
    homography_matrix: List[List[float]]


@router.post("/detect-field-lines", response_model=FieldLineDetectionResponse)
async def detect_field_lines_endpoint(payload: FieldLineDetectionRequest):
    """
    Dynamic Field Line & Homography Adaptation Endpoint (TSK-32).
    Inspects broadcast video frame, isolates pitch surface, detects line markings & intersections,
    and updates adaptive homography matrix.
    """
    import cv2
    target_video = payload.video_path or "data/sample_crossing.mp4"
    if not os.path.isabs(target_video):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        candidate = os.path.join(base_dir, target_video)
        if os.path.exists(candidate):
            target_video = candidate

    if not os.path.exists(target_video):
        raise HTTPException(status_code=404, detail=f"Video file not found at: {payload.video_path}")

    cap = cv2.VideoCapture(target_video)
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Failed to open video file")

    target_idx = max(0, payload.frame_index or 0)
    cap.set(cv2.CAP_PROP_POS_FRAMES, target_idx)
    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        raise HTTPException(status_code=400, detail=f"Could not read frame at index {target_idx}")

    stats = adaptive_homography_engine.update_with_frame(frame)

    return FieldLineDetectionResponse(
        status="SUCCESS",
        video_path=payload.video_path or target_video,
        frame_index=target_idx,
        lines_detected=stats["lines_detected"],
        intersections_detected=stats["intersections_detected"],
        pan_delta_x=stats["pan_delta_x"],
        tilt_delta_y=stats["tilt_delta_y"],
        zoom_scale=stats["zoom_scale"],
        features_tracked=stats["features_tracked"],
        homography_matrix=stats["homography_matrix"],
    )
