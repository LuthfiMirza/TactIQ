'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket, joinTrackingSession, leaveTrackingSession } from '@/lib/socket';
import type { TrackingFramePayload, TrackingEntity, TacticalMetricsDTO } from '@tactiq/shared-types';
import {
  Activity,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Video,
  Eye,
  Award,
  Crosshair,
  FastForward,
  Gauge,
  Compass,
  Pencil,
  ArrowUpRight,
  Circle,
  Square,
  Trash2,
  Undo,
  Download,
  FileText,
  X,
} from 'lucide-react';
import { generate600FrameSequence, calculateTacticalMetrics } from '@/lib/tactical-600-sequence';

export interface TacticalDrawing {
  id: string;
  type: 'arrow' | 'spotlight' | 'zone' | 'pen';
  color: string;
  points: Array<{ x: number; y: number }>;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface VideoOverlayCanvasProps {
  sessionId?: string;
  youtubeUrl?: string;
  videoSrc?: string;
  className?: string;
  initialVideoMode?: boolean;
  onFrameUpdate?: (frame: TrackingFramePayload) => void;
  // TSK-31 Homography Overlays
  showFieldLines?: boolean;
  showIntersections?: boolean;
  showCameraFov?: boolean;
  fieldLines?: Array<{ x1: number; y1: number; x2: number; y2: number; type?: string }>;
  intersections?: Array<{ x: number; y: number; confidence?: number }>;
  onOpenCalibrationModal?: () => void;
  // Dynamic Team & Video Config
  homeCode?: string;
  awayCode?: string;
  homeName?: string;
  awayName?: string;
  score?: string;
  statusBadge?: string;
  homeColor?: string;
  awayColor?: string;
  trackedFrames?: TrackingFramePayload[];
}

interface MatchEventMoment {
  minute: number;
  label: string;
  type: 'goal' | 'shot' | 'card' | 'chance';
  timestampMs: number;
}

const COMMUNITY_SHIELD_EVENTS: MatchEventMoment[] = [
  { minute: 14, label: 'Casemiro Deep Build-up', type: 'chance', timestampMs: 1400 },
  { minute: 24, label: 'McAtee Post Shot', type: 'chance', timestampMs: 2400 },
  { minute: 54, label: 'Bruno Curler (Offside)', type: 'shot', timestampMs: 5400 },
  { minute: 75, label: 'Rashford Hits Post', type: 'chance', timestampMs: 7500 },
  { minute: 82, label: 'Garnacho Solo Goal (0-1)', type: 'goal', timestampMs: 8200 },
  { minute: 89, label: 'Bernardo Header Goal (1-1)', type: 'goal', timestampMs: 8900 },
  { minute: 90, label: 'Penalty Shootout', type: 'shot', timestampMs: 9000 },
];

const SPAIN_CROATIA_EVENTS: MatchEventMoment[] = [
  { minute: 29, label: 'Morata Goal (1-0)', type: 'goal', timestampMs: 2900 },
  { minute: 32, label: 'Fabián Ruiz Goal (2-0)', type: 'goal', timestampMs: 3200 },
  { minute: 45, label: 'Carvajal Goal (3-0)', type: 'goal', timestampMs: 4500 },
  { minute: 80, label: 'Petković Penalty Save', type: 'chance', timestampMs: 8000 },
];

export const VideoOverlayCanvas: React.FC<VideoOverlayCanvasProps> = ({
  sessionId = 'demo-session-tactical-001',
  youtubeUrl = 'https://www.youtube.com/embed/z4B7hN5sE_s?autoplay=1&mute=1&controls=0&loop=1&playlist=z4B7hN5sE_s',
  videoSrc,
  className = '',
  initialVideoMode = true,
  onFrameUpdate,
  showFieldLines = true,
  showIntersections = true,
  showCameraFov = true,
  fieldLines,
  intersections,
  onOpenCalibrationModal,
  homeCode = 'MUN',
  awayCode = 'MCI',
  homeName = 'Man United',
  awayName = 'Man City',
  score = '1 — 1',
  statusBadge = 'COMMUNITY SHIELD',
  homeColor = '#DA291C',
  awayColor = '#6CABDD',
  trackedFrames,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const [currentFrame, setCurrentFrame] = useState<TrackingFramePayload | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [tempo, setTempo] = useState<number>(1); // 0.5x, 1x, 1.5x, 2x
  const [showVideoBackground, setShowVideoBackground] = useState<boolean>(initialVideoMode);
  const [showCanvasOverlay, setShowCanvasOverlay] = useState<boolean>(true);
  const [showTacticalTrails, setShowTacticalTrails] = useState<boolean>(true);
  const [showKinematicsHUD, setShowKinematicsHUD] = useState<boolean>(true);
  const [isYtReady, setIsYtReady] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(60);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);

  // Telestrator Drawing Tools
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [drawTool, setDrawTool] = useState<'arrow' | 'spotlight' | 'zone' | 'pen'>('arrow');
  const [drawColor, setDrawColor] = useState<string>('#CEFF00');
  const [drawings, setDrawings] = useState<TacticalDrawing[]>([]);
  const drawingsRef = useRef<TacticalDrawing[]>([]);
  const isMouseDownRef = useRef<boolean>(false);
  const currentDrawingRef = useRef<TacticalDrawing | null>(null);

  // Tactical Dossier Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportImageUri, setExportImageUri] = useState<string | null>(null);

  const [entityStats, setEntityStats] = useState<{
    homeCount: number;
    awayCount: number;
    ballSpeed: number;
  }>({
    homeCount: 11,
    awayCount: 11,
    ballSpeed: 24.2,
  });

  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localFrameCounterRef = useRef<number>(0);
  const playbackSpeedRef = useRef<number>(1);

  // Keep drawings ref in sync
  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  // Keep playback speed in sync
  useEffect(() => {
    playbackSpeedRef.current = tempo;
  }, [tempo]);

  // Compute live kinematics metrics from current frame
  const liveMetrics: TacticalMetricsDTO = calculateTacticalMetrics(currentFrame?.entities || []);

  // Frame generator
  const getFrameAtStep = useCallback((frameIdx: number): TrackingFramePayload => {
    if (trackedFrames && trackedFrames.length > 0) {
      return trackedFrames[frameIdx % trackedFrames.length];
    }
    return generate600FrameSequence(frameIdx, sessionId);
  }, [trackedFrames, sessionId]);

  // ── Render Frame on Canvas ───────────────────────────────────────────────
  const renderFrame = useCallback((frame: TrackingFramePayload, isVideoUnderneath: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // If overlay is disabled, just clear
    if (!showCanvasOverlay) {
      return;
    }

    // If video is NOT underneath, paint authentic stadium pitch texture
    if (!isVideoUnderneath) {
      ctx.fillStyle = '#0F2C1F';
      ctx.fillRect(0, 0, width, height);

      // Pitch lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(width / 2, 16);
      ctx.lineTo(width / 2, height - 16);
      ctx.stroke();

      // Center circle
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, height * 0.18, 0, Math.PI * 2);
      ctx.stroke();

      // Center spot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1.5 TSK-31: Render Detected Field Lines Overlay
    if (showFieldLines && fieldLines && fieldLines.length > 0) {
      fieldLines.forEach((l) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(l.x1 * width, l.y1 * height);
        ctx.lineTo(l.x2 * width, l.y2 * height);
        ctx.strokeStyle =
          l.type === 'touchline'
            ? 'rgba(0, 255, 204, 0.85)'
            : l.type === 'halfway'
            ? 'rgba(56, 189, 248, 0.90)'
            : 'rgba(206, 255, 0, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = l.type === 'touchline' ? '#00FFCC' : '#CEFF00';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 1.6 TSK-31: Render Detected Keypoint Intersections Overlay
    if (showIntersections && intersections && intersections.length > 0) {
      intersections.forEach((pt) => {
        const ix = pt.x * width;
        const iy = pt.y * height;
        ctx.save();
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(ix, iy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ix, iy, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ix - 8, iy);
        ctx.lineTo(ix + 8, iy);
        ctx.moveTo(ix, iy - 8);
        ctx.lineTo(ix, iy + 8);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 2. Track entity counts
    let homeC = 0;
    let awayC = 0;
    let bSpeed = 24.2;

    frame.entities.forEach((entity) => {
      if (entity.team === 'home') homeC++;
      if (entity.team === 'away') awayC++;
      if (entity.team === 'ball' && entity.speedKmh) bSpeed = entity.speedKmh;

      const px = entity.x * width;
      const py = entity.y * height;

      if (entity.team === 'ball') {
        // Ball: Glowing Amber Core
        ctx.save();
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Speed label
        if (entity.speedKmh) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(entity.speedKmh)} km/h`, px, py - 9);
        }
      } else {
        const isHome = entity.team === 'home';
        const primaryColor = isHome ? homeColor : awayColor;

        // Tactical Pitch Ring
        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Inner translucent fill
        ctx.fillStyle = primaryColor === '#DA291C' ? 'rgba(218, 41, 28, 0.45)' : 'rgba(108, 171, 221, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Jersey Number / ID Inside Ring
        const displayNum = entity.jerseyNumber ?? entity.id;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(displayNum), px, py);

        // Speed badge if sprinting
        if (entity.speedKmh && entity.speedKmh > 18) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(px - 10, py + 12, 20, 9);
          ctx.fillStyle = '#CEFF00';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(entity.speedKmh)}k`, px, py + 18);
        }
      }
    });

    // 4. Render User Tactical Drawings & Annotations (TSK-PRO)
    const allDrawings = [...drawingsRef.current];
    if (currentDrawingRef.current) {
      allDrawings.push(currentDrawingRef.current);
    }

    allDrawings.forEach((d) => {
      if (!d.points || d.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.fillStyle = d.color;
      ctx.lineWidth = 2.5;

      if (d.type === 'arrow' && d.points.length >= 2) {
        const p1 = { x: d.points[0].x * width, y: d.points[0].y * height };
        const p2 = { x: d.points[1].x * width, y: d.points[1].y * height };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const angle = Math.atan2(dy, dx);
        const headLen = 14;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (d.type === 'spotlight' && d.points.length >= 1) {
        const c = { x: d.points[0].x * width, y: d.points[0].y * height };
        let radius = 26;
        if (d.points.length >= 2) {
          const p2 = { x: d.points[1].x * width, y: d.points[1].y * height };
          radius = Math.max(16, Math.hypot(p2.x - c.x, p2.y - c.y));
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = d.color === '#CEFF00' ? 'rgba(206, 255, 0, 0.18)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.setLineDash([4, 3]);
        ctx.stroke();
      } else if (d.type === 'zone' && d.points.length >= 2) {
        const p1 = { x: d.points[0].x * width, y: d.points[0].y * height };
        const p2 = { x: d.points[1].x * width, y: d.points[1].y * height };
        const xMin = Math.min(p1.x, p2.x);
        const yMin = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);

        ctx.fillStyle = d.color === '#CEFF00' ? 'rgba(206, 255, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(xMin, yMin, w, h);
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(xMin, yMin, w, h);
      } else if (d.type === 'pen' && d.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(d.points[0].x * width, d.points[0].y * height);
        for (let i = 1; i < d.points.length; i++) {
          ctx.lineTo(d.points[i].x * width, d.points[i].y * height);
        }
        ctx.stroke();
      }
      ctx.restore();
    });

    setEntityStats({ homeCount: homeC, awayCount: awayC, ballSpeed: bSpeed });
  }, [
    showCanvasOverlay,
    homeColor,
    awayColor,
    showFieldLines,
    fieldLines,
    showIntersections,
    intersections,
  ]);

  // ── Auto-Resize & High-DPI Canvas ────────────────────────────────────────
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (currentFrame) {
        renderFrame(currentFrame, showVideoBackground);
      }
    }
  }, [currentFrame, renderFrame, showVideoBackground]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // ── YouTube IFrame API Synchronization ───────────────────────────────────
  useEffect(() => {
    if (!youtubeUrl || videoSrc) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      ytPlayerRef.current = new window.YT.Player('tactiq-yt-iframe', {
        events: {
          onReady: () => {
            setIsYtReady(true);
            try {
              const dur = ytPlayerRef.current.getDuration();
              if (dur > 0) setVideoDuration(dur);
            } catch {}
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) setIsPlaying(true);
            else if (event.data === 2) setIsPlaying(false);
          },
        },
      });
    };

    return () => {
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, [youtubeUrl, videoSrc]);

  // ── Continuous Playback Loop (Synchronized with 10 FPS Simulation) ────────
  useEffect(() => {
    const initFrame = getFrameAtStep(0);
    setCurrentFrame(initFrame);
    renderFrame(initFrame, showVideoBackground);
    if (onFrameUpdate) onFrameUpdate(initFrame);

    if (localTimerRef.current) clearInterval(localTimerRef.current);

    if (isPlaying) {
      const intervalMs = Math.max(25, Math.round(100 / playbackSpeedRef.current));
      localTimerRef.current = setInterval(() => {
        localFrameCounterRef.current += 1;
        const frame = getFrameAtStep(localFrameCounterRef.current);
        setCurrentFrame(frame);
        renderFrame(frame, showVideoBackground);
        if (onFrameUpdate) onFrameUpdate(frame);

        // Update progress bar
        const simulatedSeconds = (localFrameCounterRef.current * 0.1) % 60;
        setCurrentVideoTime(simulatedSeconds);
      }, intervalMs);
    }

    return () => {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [sessionId, isPlaying, tempo, showVideoBackground, renderFrame, onFrameUpdate, getFrameAtStep]);

  // ── WebSocket Subscription for Live Streams ──────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    joinTrackingSession(sessionId);

    const handleSocketFrame = (payload: TrackingFramePayload) => {
      if (payload.sessionId === sessionId) {
        setCurrentFrame(payload);
        renderFrame(payload, showVideoBackground);
        if (onFrameUpdate) onFrameUpdate(payload);
      }
    };

    socket.on('frame_update', handleSocketFrame);

    return () => {
      socket.off('frame_update', handleSocketFrame);
      leaveTrackingSession(sessionId);
    };
  }, [sessionId, renderFrame, showVideoBackground, onFrameUpdate]);

  // ── Play/Pause & Speed Controls ──────────────────────────────────────────
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (ytPlayerRef.current?.pauseVideo) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }
      if (videoElementRef.current) videoElementRef.current.pause();
    } else {
      setIsPlaying(true);
      if (ytPlayerRef.current?.playVideo) {
        try {
          ytPlayerRef.current.playVideo();
        } catch {}
      }
      if (videoElementRef.current) videoElementRef.current.play().catch(() => {});
    }
  };

  const handleReset = () => {
    localFrameCounterRef.current = 0;
    setCurrentVideoTime(0);
    if (ytPlayerRef.current?.seekTo) {
      try {
        ytPlayerRef.current.seekTo(0, true);
      } catch {}
    }
    if (videoElementRef.current) videoElementRef.current.currentTime = 0;

    const frame = getFrameAtStep(0);
    setCurrentFrame(frame);
    renderFrame(frame, showVideoBackground);
    if (onFrameUpdate) onFrameUpdate(frame);
  };

  const changeTempo = (newTempo: number) => {
    setTempo(newTempo);
    playbackSpeedRef.current = newTempo;
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = newTempo;
    }
    if (ytPlayerRef.current?.setPlaybackRate) {
      try {
        ytPlayerRef.current.setPlaybackRate(newTempo);
      } catch {}
    }
  };

  // ── Telestrator Mouse Drawing Handlers ───────────────────────────────────
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawMode) return;
    isMouseDownRef.current = true;
    const pt = getCanvasCoordinates(e);

    currentDrawingRef.current = {
      id: `draw-${Date.now()}`,
      type: drawTool,
      color: drawColor,
      points: [pt],
    };

    if (currentFrame) renderFrame(currentFrame, showVideoBackground);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawMode || !isMouseDownRef.current || !currentDrawingRef.current) return;
    const pt = getCanvasCoordinates(e);

    if (drawTool === 'pen') {
      currentDrawingRef.current.points.push(pt);
    } else {
      // For arrow, spotlight, zone: update endpoint
      if (currentDrawingRef.current.points.length === 1) {
        currentDrawingRef.current.points.push(pt);
      } else {
        currentDrawingRef.current.points[1] = pt;
      }
    }

    if (currentFrame) renderFrame(currentFrame, showVideoBackground);
  };

  const handleMouseUp = () => {
    if (!isDrawMode || !isMouseDownRef.current) return;
    isMouseDownRef.current = false;

    if (currentDrawingRef.current && currentDrawingRef.current.points.length > 0) {
      setDrawings((prev) => [...prev, currentDrawingRef.current!]);
      currentDrawingRef.current = null;
    }

    if (currentFrame) renderFrame(currentFrame, showVideoBackground);
  };

  const handleUndoDrawing = () => {
    setDrawings((prev) => prev.slice(0, -1));
    setTimeout(() => {
      if (currentFrame) renderFrame(currentFrame, showVideoBackground);
    }, 20);
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    currentDrawingRef.current = null;
    setTimeout(() => {
      if (currentFrame) renderFrame(currentFrame, showVideoBackground);
    }, 20);
  };

  // ── Tactical Dossier Export ──────────────────────────────────────────────
  const handleExportDossier = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUri = canvas.toDataURL('image/png');
      setExportImageUri(dataUri);
      setIsExportModalOpen(true);
    } catch (err) {
      console.error('Failed to export canvas:', err);
    }
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-2xl overflow-hidden shadow-xs transition-colors ${className}`}>
      {/* ── Top Match Header & Telemetry Bar ─────────────────────────────── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-[#18181C] border-b border-slate-200 dark:border-[#27272A] flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {homeCode} <span className="text-tactiq-coral">{score}</span> {awayCode}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#CEFF00]/15 text-[#CEFF00] border border-[#CEFF00]/30 hidden sm:inline">
            {statusBadge}
          </span>
        </div>

        {/* Action Controls & Calibration */}
        <div className="flex items-center gap-2">
          {/* TSK-31 Homography Calibration Button */}
          {onOpenCalibrationModal && (
            <button
              onClick={onOpenCalibrationModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono bg-[#18181C] hover:bg-[#222228] text-white border border-[#27272A] hover:border-[#CEFF00] transition-colors shrink-0 min-h-[32px] cursor-pointer"
              title="Buka Kalibrasi Homografi Garis Lapangan (TSK-31)"
            >
              <Crosshair size={13} className="text-[#CEFF00]" />
              <span className="hidden sm:inline">Kalibrasi Garis (TSK-31)</span>
              <span className="sm:hidden">Kalibrasi</span>
            </button>
          )}

          {/* Telestrator Drawing Toggle */}
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[32px] cursor-pointer ${
              isDrawMode
                ? 'bg-[#CEFF00] text-black shadow-xs font-bold'
                : 'bg-white dark:bg-[#18181C] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A] hover:border-[#CEFF00]'
            }`}
            title="Aktifkan alat telestrator anotasi video pelatih"
          >
            <Pencil size={13} />
            <span className="hidden sm:inline">{isDrawMode ? 'Drawing ON' : 'Telestrator'}</span>
          </button>

          {/* Export Tactical Dossier Button */}
          <button
            onClick={handleExportDossier}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono bg-white dark:bg-[#18181C] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A] hover:border-emerald-400 transition-colors shrink-0 min-h-[32px] cursor-pointer"
            title="Download snapshot taktis & dossier PDF/PNG"
          >
            <Download size={13} className="text-emerald-400" />
            <span className="hidden md:inline">Export Dossier</span>
          </button>

          {/* Video / Pitch Background Toggle */}
          <button
            onClick={() => setShowVideoBackground(!showVideoBackground)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[32px] cursor-pointer ${
              showVideoBackground
                ? 'bg-[#18181C] text-[#CEFF00] border border-[#CEFF00]/40'
                : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <Video size={13} />
            <span className="hidden md:inline">{showVideoBackground ? 'Video ON' : '2D Pitch'}</span>
          </button>
        </div>
      </div>

      {/* ── Telestrator Toolbar (When in draw mode) ───────────────────────── */}
      {isDrawMode && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-100 dark:bg-[#16161A] border-b border-slate-200 dark:border-[#27272A] text-xs font-mono flex-wrap gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-slate-500 dark:text-zinc-400 text-[10px] uppercase font-bold mr-1">Tool:</span>
            <button
              onClick={() => setDrawTool('arrow')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer ${
                drawTool === 'arrow' ? 'bg-[#CEFF00] text-black font-bold' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              <ArrowUpRight size={13} />
              <span>Arrow</span>
            </button>
            <button
              onClick={() => setDrawTool('spotlight')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer ${
                drawTool === 'spotlight' ? 'bg-[#CEFF00] text-black font-bold' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              <Circle size={13} />
              <span>Spotlight</span>
            </button>
            <button
              onClick={() => setDrawTool('zone')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer ${
                drawTool === 'zone' ? 'bg-[#CEFF00] text-black font-bold' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              <Square size={13} />
              <span>Zone</span>
            </button>
            <button
              onClick={() => setDrawTool('pen')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer ${
                drawTool === 'pen' ? 'bg-[#CEFF00] text-black font-bold' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              <Pencil size={13} />
              <span>Freehand</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Color Swatches */}
            <div className="flex items-center gap-1 mr-2">
              {['#CEFF00', '#EF4444', '#38BDF8', '#F59E0B', '#FFFFFF'].map((c) => (
                <button
                  key={c}
                  onClick={() => setDrawColor(c)}
                  className={`w-5 h-5 rounded-full border cursor-pointer ${
                    drawColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Undo & Clear */}
            <button
              onClick={handleUndoDrawing}
              disabled={drawings.length === 0}
              className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Undo last drawing"
            >
              <Undo size={14} />
            </button>
            <button
              onClick={handleClearDrawings}
              disabled={drawings.length === 0}
              className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-red-400 disabled:opacity-30 cursor-pointer"
              title="Clear all drawings"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Viewport: Video Canvas Layer ─────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-[#0F2C1F] flex items-center justify-center overflow-hidden"
      >
        {/* Underneath Video / YouTube Player */}
        {showVideoBackground && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {videoSrc ? (
              <video
                ref={videoElementRef}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover opacity-85"
              />
            ) : youtubeUrl ? (
              <iframe
                id="tactiq-yt-iframe"
                src={youtubeUrl}
                title="Tactical YouTube Broadcast"
                className="w-full h-full border-0 pointer-events-none opacity-85"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : null}
          </div>
        )}

        {/* Foreground Interactive Canvas */}
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`absolute inset-0 w-full h-full z-10 ${
            isDrawMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* Real-time Kinematics Floating HUD */}
        {showKinematicsHUD && (
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-1.5 font-mono text-[10px]">
            <div className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs border border-white/10 text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00]" />
              <span>DEF LINE:</span>
              <span style={{ color: homeColor }}>{homeCode} {liveMetrics.homeDefensiveLineMeters}m</span>
              <span className="text-zinc-500">/</span>
              <span style={{ color: awayColor }}>{awayCode} {liveMetrics.awayDefensiveLineMeters}m</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs border border-white/10 text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>HULL AREA:</span>
              <span style={{ color: homeColor }}>{liveMetrics.homeCompactnessAreaM2}m²</span>
              <span className="text-zinc-500">/</span>
              <span style={{ color: awayColor }}>{liveMetrics.awayCompactnessAreaM2}m²</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Playback Controls Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-[#18181C] border-t border-slate-200 dark:border-[#27272A] flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#CEFF00] text-black shadow-xs'
                : 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200'
            }`}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-white cursor-pointer"
            title="Reset ke awal (0:00)"
          >
            <RotateCcw size={13} />
          </button>

          {/* Tempo Controls */}
          <div className="flex items-center gap-1 ml-2">
            {[0.5, 1.0, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => changeTempo(rate)}
                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                  tempo === rate
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Match Key Moments Timeline Shortcuts */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px]">
          <span className="text-zinc-400 mr-1 font-bold">Key Moments:</span>
          {(homeCode === 'ESP' ? SPAIN_CROATIA_EVENTS : COMMUNITY_SHIELD_EVENTS).slice(0, 4).map((evt) => (
            <button
              key={evt.minute}
              onClick={() => {
                localFrameCounterRef.current = evt.minute * 6;
                const frame = getFrameAtStep(localFrameCounterRef.current);
                setCurrentFrame(frame);
                renderFrame(frame, showVideoBackground);
              }}
              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-[#CEFF00] hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {evt.minute}' {evt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Export Dossier Modal ─────────────────────────────────────────── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#141418] border border-slate-200 dark:border-[#27272A] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#CEFF00]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-mono">
                  Tactical Dossier Export
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Preview Image */}
            {exportImageUri && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#27272A] aspect-video">
                <img src={exportImageUri} alt="Tactical Canvas Snapshot" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#18181C]">
              <div>
                <span className="text-[10px] text-zinc-400 block">Matchup</span>
                <span className="font-bold text-slate-900 dark:text-white">{homeCode} vs {awayCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Defensive Line</span>
                <span className="font-bold text-[#CEFF00]">{liveMetrics.homeDefensiveLineMeters}m / {liveMetrics.awayDefensiveLineMeters}m</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">Hull Area</span>
                <span className="font-bold text-sky-400">{liveMetrics.homeCompactnessAreaM2}m²</span>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              {exportImageUri && (
                <a
                  href={exportImageUri}
                  download={`tactiq-dossier-${homeCode}-${awayCode}-${Date.now()}.png`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-black text-xs font-mono font-black rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Snapshot PNG</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
