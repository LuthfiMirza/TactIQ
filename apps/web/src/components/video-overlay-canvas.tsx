'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket, joinTrackingSession, leaveTrackingSession } from '@/lib/socket';
import type { TrackingFramePayload, TrackingEntity, TacticalMetricsDTO } from '@tactiq/shared-types';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Video,
  Eye,
  Award,
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
}

interface MatchEventMoment {
  minute: number;
  label: string;
  type: 'goal' | 'shot' | 'card' | 'chance';
  timestampMs: number;
}

const MATCH_TIMELINE_EVENTS: MatchEventMoment[] = [
  { minute: 14, label: 'Casemiro Deep Build-up', type: 'chance', timestampMs: 7000 },
  { minute: 28, label: 'Bruno Fernandes Zone 14 Pass', type: 'chance', timestampMs: 21000 },
  { minute: 54, label: 'Haaland Drag-Run & Shot', type: 'shot', timestampMs: 32000 },
  { minute: 82, label: 'Garnacho Cut-Inside Goal', type: 'goal', timestampMs: 42000 },
  { minute: 89, label: 'Bernardo Silva Equalizer Header', type: 'goal', timestampMs: 53000 },
];

/**
 * Extracts YouTube video ID from various standard YouTube URL formats.
 */
function extractYouTubeVideoId(url: string): string {
  if (!url) return 'z4B7hN5sE_s';
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : 'z4B7hN5sE_s';
}

export const VideoOverlayCanvas: React.FC<VideoOverlayCanvasProps> = ({
  sessionId = 'demo-session-tactical-001',
  youtubeUrl = 'https://www.youtube.com/embed/z4B7hN5sE_s?autoplay=1&mute=1&controls=1&loop=1&playlist=z4B7hN5sE_s',
  videoSrc,
  className = '',
  initialVideoMode = false,
  onFrameUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [currentFrame, setCurrentFrame] = useState<TrackingFramePayload | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [tempo, setTempo] = useState<number>(1); // 1x, 1.5x, 2x, 3x
  const [showVideoBackground, setShowVideoBackground] = useState<boolean>(initialVideoMode || Boolean(videoSrc));
  const [activeMoment, setActiveMoment] = useState<MatchEventMoment | null>(null);
  const [entityStats, setEntityStats] = useState<{ homeCount: number; awayCount: number; ballSpeed: number }>({
    homeCount: 11,
    awayCount: 11,
    ballSpeed: 24.2,
  });
  const [tacticalMetrics, setTacticalMetrics] = useState<TacticalMetricsDTO | null>(null);
  const [isYtReady, setIsYtReady] = useState<boolean>(false);

  // Tactical Annotation & Drawing States (TSK-PRO)
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [activeDrawTool, setActiveDrawTool] = useState<'arrow' | 'spotlight' | 'zone' | 'pen'>('arrow');
  const [drawColor, setDrawColor] = useState<string>('#CEFF00');
  const [drawings, setDrawings] = useState<TacticalDrawing[]>([]);
  const drawingsRef = useRef<TacticalDrawing[]>([]);
  const currentDrawingRef = useRef<TacticalDrawing | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  // Tactical Dossier Export Modal State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);

  const trailsRef = useRef<Map<number, Array<{ x: number; y: number }>>>(new Map());
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localFrameCounterRef = useRef<number>(0);

  // Resize canvas according to container aspect ratio
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    canvasRef.current.width = clientWidth;
    canvasRef.current.height = clientHeight;
  }, []);

  // Draw Tactical Football Pitch Lines
  const drawPitch = (ctx: CanvasRenderingContext2D, width: number, height: number, isTransparent: boolean) => {
    if (!isTransparent) {
      // Pitch background with stadium grass texture
      ctx.fillStyle = '#0F2C1F';
      ctx.fillRect(0, 0, width, height);

      const stripeCount = 10;
      const stripeWidth = width / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(0, 223, 89, 0.04)';
          ctx.fillRect(i * stripeWidth, 0, stripeWidth, height);
        }
      }
    }

    // Pitch Line Styles (crisp white markings with high legibility)
    ctx.strokeStyle = isTransparent ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.60)';
    ctx.lineWidth = 1.5;

    const padX = width * 0.04;
    const padY = height * 0.05;
    const pWidth = width - padX * 2;
    const pHeight = height - padY * 2;

    // Outer Boundary
    ctx.strokeRect(padX, padY, pWidth, pHeight);

    // Halfway Line
    const midX = padX + pWidth / 2;
    ctx.beginPath();
    ctx.moveTo(midX, padY);
    ctx.lineTo(midX, padY + pHeight);
    ctx.stroke();

    // Center Circle
    const radius = Math.min(pWidth, pHeight) * 0.16;
    ctx.beginPath();
    ctx.arc(midX, padY + pHeight / 2, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Center Dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(midX, padY + pHeight / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Left Penalty Box
    const penW = pWidth * 0.16;
    const penH = pHeight * 0.52;
    const penY = padY + (pHeight - penH) / 2;
    ctx.strokeRect(padX, penY, penW, penH);

    // Right Penalty Box
    ctx.strokeRect(padX + pWidth - penW, penY, penW, penH);
  };

  // Render tracking entities onto canvas
  const renderFrame = useCallback((frame: TrackingFramePayload, isVideoBg: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw pitch foundation
    drawPitch(ctx, width, height, isVideoBg);

    // 2. Track entity counts
    let homeC = 0;
    let awayC = 0;
    let bSpeed = 0;

    // 3. Render entities (players & ball)
    frame.entities.forEach((entity: TrackingEntity) => {
      const px = entity.x * width;
      const py = entity.y * height;

      if (entity.team === 'home') homeC++;
      if (entity.team === 'away') awayC++;
      if (entity.team === 'ball') bSpeed = entity.speedKmh || 22.4;

      // Update historic trail
      let trail = trailsRef.current.get(entity.id);
      if (!trail) {
        trail = [];
        trailsRef.current.set(entity.id, trail);
      }
      trail.push({ x: px, y: py });
      if (trail.length > 8) trail.shift();

      // Draw historic trail
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle =
          entity.team === 'home'
            ? 'rgba(239, 1, 7, 0.4)'
            : entity.team === 'away'
            ? 'rgba(108, 171, 221, 0.4)'
            : 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = entity.team === 'ball' ? 2.5 : 1.5;
        ctx.stroke();
      }

      // Draw Entity Circle / Bounding Halo
      if (entity.team === 'ball') {
        ctx.save();
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      } else {
        const isHome = entity.team === 'home';
        const primaryColor = isHome ? '#DA291C' : '#6CABDD';

        // Flat Tactical Pitch Ring
        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, py + 4, 12, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Player Circle Dot
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(px, py, 8.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Jersey / ID label inside entity
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8.5px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = entity.jerseyNumber ? String(entity.jerseyNumber) : String(entity.id);
        ctx.fillText(label, px, py);

        // Speed badge if sprinting
        if (entity.speedKmh && entity.speedKmh > 20) {
          ctx.fillStyle = '#121820';
          ctx.strokeStyle = '#253142';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(px - 14, py + 12, 28, 12, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '8px Inter, sans-serif';
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
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        ctx.fillStyle = d.color + '26';
        ctx.fill();
      } else if (d.type === 'zone' && d.points.length >= 2) {
        const p1 = { x: d.points[0].x * width, y: d.points[0].y * height };
        const p2 = { x: d.points[1].x * width, y: d.points[1].y * height };
        const minX = Math.min(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);

        ctx.fillStyle = d.color + '22';
        ctx.fillRect(minX, minY, w, h);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(minX, minY, w, h);

        ctx.fillStyle = d.color;
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillText('TACTICAL ZONE', minX + 6, minY + 14);
      } else if (d.type === 'pen' && d.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(d.points[0].x * width, d.points[0].y * height);
        for (let i = 1; i < d.points.length; i++) {
          ctx.lineTo(d.points[i].x * width, d.points[i].y * height);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    });

    setEntityStats({ homeCount: homeC, awayCount: awayC, ballSpeed: bSpeed });
    if (frame.tacticalMetrics) {
      setTacticalMetrics(frame.tacticalMetrics);
    }
  }, []);

  // Sync to a specific frame counter index and re-render
  const syncToFrameIndex = useCallback((frameIdx: number) => {
    localFrameCounterRef.current = frameIdx % 600;
    const frame = generate600FrameSequence(localFrameCounterRef.current, sessionId);
    setCurrentFrame(frame);
    renderFrame(frame, showVideoBackground);
    if (onFrameUpdate) onFrameUpdate(frame);
  }, [sessionId, renderFrame, showVideoBackground, onFrameUpdate]);

  // ─── 1. YouTube IFrame API Integration (window.YT.Player) ──────────────
  const ytVideoId = extractYouTubeVideoId(youtubeUrl);
  const ytPlayerContainerId = `yt-player-${sessionId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    // If videoSrc is used, skip YouTube initialization
    if (videoSrc) return;

    let isMounted = true;

    const setupYTPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      const containerEl = document.getElementById(ytPlayerContainerId);
      if (!containerEl) return;

      try {
        if (ytPlayerRef.current) {
          ytPlayerRef.current.destroy?.();
          ytPlayerRef.current = null;
        }

        ytPlayerRef.current = new window.YT.Player(ytPlayerContainerId, {
          videoId: ytVideoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 1,
            loop: 1,
            playlist: ytVideoId,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsYtReady(true);
              event.target.playVideo();
              event.target.setPlaybackRate(tempo);
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              if (event.data === 1) {
                setIsPlaying(true);
                // Start active high-frequency polling to synchronize 2D radar bidak with YouTube currentTime
                if (ytSyncIntervalRef.current) clearInterval(ytSyncIntervalRef.current);
                ytSyncIntervalRef.current = setInterval(() => {
                  if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
                    const currentSec = ytPlayerRef.current.getCurrentTime();
                    const targetFrame = Math.floor(currentSec * 10);
                    if (targetFrame !== localFrameCounterRef.current) {
                      syncToFrameIndex(targetFrame);
                    }
                  }
                }, 80);
              } else if (event.data === 2) {
                setIsPlaying(false);
                if (ytSyncIntervalRef.current) clearInterval(ytSyncIntervalRef.current);
                if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
                  const currentSec = ytPlayerRef.current.getCurrentTime();
                  syncToFrameIndex(Math.floor(currentSec * 10));
                }
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube IFrame API initialization error:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setupYTPlayer();
    } else {
      // Load official YouTube IFrame API script
      const existingScript = document.getElementById('yt-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        if (isMounted) setupYTPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (ytSyncIntervalRef.current) clearInterval(ytSyncIntervalRef.current);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy?.();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [ytVideoId, ytPlayerContainerId, videoSrc, syncToFrameIndex, tempo]);

  // ─── 2. Internal Simulation Timer Fallback ──────────────────────────────
  // If YouTube is not actively driving the timer, or during initial mount
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial frame mount
    const initFrame = generate600FrameSequence(0, sessionId);
    setCurrentFrame(initFrame);
    renderFrame(initFrame, showVideoBackground);
    if (onFrameUpdate) onFrameUpdate(initFrame);

    // If local video or iframe API not controlling playback, run fallback timer
    if (!videoSrc && !isYtReady && isPlaying) {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      localTimerRef.current = setInterval(() => {
        syncToFrameIndex(localFrameCounterRef.current + 1);
      }, Math.max(25, Math.floor(100 / tempo)));
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [sessionId, handleResize, renderFrame, showVideoBackground, onFrameUpdate, isYtReady, isPlaying, tempo, videoSrc, syncToFrameIndex]);

  // ─── 3. Socket.io Live Stream Connection ───────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsLiveConnected(true);
      joinTrackingSession(sessionId);
    };

    const handleDisconnect = () => {
      setIsLiveConnected(false);
    };

    const handleFrame = (payload: TrackingFramePayload) => {
      if (payload.sessionId === sessionId) {
        setCurrentFrame(payload);
        renderFrame(payload, showVideoBackground);
        if (onFrameUpdate) onFrameUpdate(payload);
      }
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('frame_update', handleFrame);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('frame_update', handleFrame);
      leaveTrackingSession(sessionId);
    };
  }, [sessionId, renderFrame, showVideoBackground, onFrameUpdate]);

  // ─── 4. Play / Pause Control Synchronization ───────────────────────────
  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      if (ytSyncIntervalRef.current) clearInterval(ytSyncIntervalRef.current);
      if (ytPlayerRef.current?.pauseVideo) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }
      if (videoElementRef.current) {
        videoElementRef.current.pause();
      }
    } else {
      // Play
      setIsPlaying(true);
      if (ytPlayerRef.current?.playVideo) {
        try {
          ytPlayerRef.current.playVideo();
        } catch {}
      }
      if (videoElementRef.current) {
        videoElementRef.current.play();
      }
      // Start timer if video isn't driving events
      if (!videoSrc && !isYtReady) {
        if (localTimerRef.current) clearInterval(localTimerRef.current);
        localTimerRef.current = setInterval(() => {
          syncToFrameIndex(localFrameCounterRef.current + 1);
        }, Math.max(25, Math.floor(100 / tempo)));
      }
    }
  };

  const resetSimulation = () => {
    localFrameCounterRef.current = 0;
    trailsRef.current.clear();
    if (ytPlayerRef.current?.seekTo) {
      try {
        ytPlayerRef.current.seekTo(0, true);
      } catch {}
    }
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = 0;
    }
    syncToFrameIndex(0);
  };

  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);
    if (ytPlayerRef.current?.setPlaybackRate) {
      try {
        ytPlayerRef.current.setPlaybackRate(newTempo);
      } catch {}
    }
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = newTempo;
    }
    // Update local timer if running
    if (isPlaying && !videoSrc && !isYtReady) {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      localTimerRef.current = setInterval(() => {
        syncToFrameIndex(localFrameCounterRef.current + 1);
      }, Math.max(25, Math.floor(100 / newTempo)));
    }
  };

  const seekToMoment = (moment: MatchEventMoment) => {
    setActiveMoment(moment);
    const targetSeconds = moment.timestampMs / 1000.0;
    const targetFrame = Math.floor(targetSeconds * 10);

    if (ytPlayerRef.current?.seekTo) {
      try {
        ytPlayerRef.current.seekTo(targetSeconds, true);
        if (isPlaying) ytPlayerRef.current.playVideo();
      } catch {}
    }
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = targetSeconds;
      if (isPlaying) videoElementRef.current.play();
    }
    syncToFrameIndex(targetFrame);
  };

  // ─── 5. HTML5 <video> Timeupdate Handler for Local Video MP4 ───────────
  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const curTime = video.currentTime;
    const targetFrame = Math.floor(curTime * 10);
    if (Math.abs(targetFrame - localFrameCounterRef.current) >= 1) {
      syncToFrameIndex(targetFrame);
    }
  };

  // ─── 6. Tactical Canvas Drawing & Pointer Handlers (TSK-PRO) ──────────
  const getCanvasRelativePoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawMode) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    const pt = getCanvasRelativePoint(e);

    const newDrawing: TacticalDrawing = {
      id: `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: activeDrawTool,
      color: drawColor,
      points: [pt],
    };
    currentDrawingRef.current = newDrawing;
    if (currentFrame) renderFrame(currentFrame, showVideoBackground);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawMode || !isPointerDownRef.current || !currentDrawingRef.current) return;
    const pt = getCanvasRelativePoint(e);

    if (activeDrawTool === 'pen') {
      currentDrawingRef.current.points.push(pt);
    } else {
      if (currentDrawingRef.current.points.length === 1) {
        currentDrawingRef.current.points.push(pt);
      } else {
        currentDrawingRef.current.points[1] = pt;
      }
    }
    if (currentFrame) renderFrame(currentFrame, showVideoBackground);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawMode || !isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (currentDrawingRef.current) {
      const d = currentDrawingRef.current;
      if (d.type === 'pen' && d.points.length > 1) {
        const nextDrawings = [...drawingsRef.current, d];
        setDrawings(nextDrawings);
        drawingsRef.current = nextDrawings;
      } else if (d.points.length >= 2 || (d.type === 'spotlight' && d.points.length >= 1)) {
        const nextDrawings = [...drawingsRef.current, d];
        setDrawings(nextDrawings);
        drawingsRef.current = nextDrawings;
      }
      currentDrawingRef.current = null;
      if (currentFrame) renderFrame(currentFrame, showVideoBackground);
    }
  };

  const handleUndoDrawing = () => {
    const nextDrawings = drawingsRef.current.slice(0, -1);
    setDrawings(nextDrawings);
    drawingsRef.current = nextDrawings;
    if (currentFrame) renderFrame(currentFrame, showVideoBackground);
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    drawingsRef.current = [];
    currentDrawingRef.current = null;
    if (currentFrame) renderFrame(currentFrame, showVideoBackground);
  };

  // ─── 7. Tactical Dossier Export Handlers (TSK-PRO) ─────────────────────
  const handleExportDossier = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setExportedImageUrl(dataUrl);
      setShowExportModal(true);
    } catch (err) {
      console.error('Failed to export canvas snapshot:', err);
    }
  };

  const handleDownloadPng = () => {
    if (!exportedImageUrl) return;
    const a = document.createElement('a');
    a.href = exportedImageUrl;
    const frameNum = (currentFrame?.frameNumber ?? 0) % 600;
    a.download = `TactIQ_Tactical_Dossier_Frame_${frameNum}_FA_Shield_2024.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className={`relative flex flex-col w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl overflow-hidden shadow-xs transition-colors ${className}`}>
      
      {/* Top Stream Status Header with Club Matchup */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-[#18181C] border-b border-slate-200/80 dark:border-[#27272A] gap-2">
        {/* Matchup & Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#CEFF00]/10 border border-[#CEFF00]/30 text-[#CEFF00] text-[10px] font-mono shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] animate-pulse" />
            <span className="font-bold hidden sm:inline">
              {videoSrc ? 'LOCAL MP4 SYNC' : isYtReady ? 'YOUTUBE SYNC 10FPS' : '600-FRAME CONTINUOUS'}
            </span>
            <span className="font-bold sm:hidden">SYNC 10FPS</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white font-mono shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-[#DA291C] text-white text-[9px] sm:text-[10px]">MUN</span>
            <span className="tabular-nums">1 — 1</span>
            <span className="px-1.5 py-0.5 rounded bg-[#6CABDD] text-white text-[9px] sm:text-[10px]">MCI</span>
          </div>
        </div>

        {/* View Mode & Tempo Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Tempo Selector (1x, 1.5x, 2x, 3x) */}
          <div className="flex items-center bg-[#121215] border border-[#27272A] rounded-lg p-0.5 text-[10px] font-mono">
            {[1, 1.5, 2, 3].map((rate) => (
              <button
                key={rate}
                onClick={() => handleTempoChange(rate)}
                className={`px-1.5 sm:px-2 py-0.5 rounded transition-all font-bold ${
                  tempo === rate
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Playback Speed ${rate}x`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Toggle Video vs 2D Pitch Canvas */}
          <button
            onClick={() => {
              const nextState = !showVideoBackground;
              setShowVideoBackground(nextState);
              if (currentFrame) renderFrame(currentFrame, nextState);
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[30px] ${
              showVideoBackground
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-xs'
                : 'bg-[#121215] text-zinc-300 border border-[#27272A] hover:bg-[#1A1A1E]'
            }`}
          >
            {showVideoBackground ? <Video size={13} /> : <Eye size={13} />}
            <span className="hidden sm:inline">
              {showVideoBackground
                ? videoSrc
                  ? 'Local Video MP4'
                  : 'YouTube High-Cam'
                : '2D Pitch Plane'}
            </span>
            <span className="sm:hidden">{showVideoBackground ? 'Cam Video' : '2D Plane'}</span>
          </button>

          {/* Tactical Drawing Toolbar Toggle */}
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[30px] ${
              isDrawMode
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-xs'
                : 'bg-[#121215] text-zinc-300 border border-[#27272A] hover:bg-[#1A1A1E]'
            }`}
            title="Tactical Telestrator / Canvas Drawing Tools"
          >
            <Pencil size={13} />
            <span className="hidden sm:inline">Coret Taktik</span>
            <span className="sm:hidden">Draw</span>
            {drawings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-bold">
                {drawings.length}
              </span>
            )}
          </button>

          {/* Export Tactical Dossier Button */}
          <button
            onClick={handleExportDossier}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[30px] bg-[#121215] text-zinc-300 border border-[#27272A] hover:text-[#CEFF00] hover:border-[#CEFF00]/40"
            title="Ekspor Dossier Taktis (PDF / PNG)"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Ekspor Dossier</span>
            <span className="sm:hidden">Export</span>
          </button>

          {/* Telemetry Entity Counters */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#DA291C]" />
              <span>MUN: {entityStats.homeCount}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
              <span>MCI: {entityStats.awayCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telestrator Drawing Toolbar (When isDrawMode is active) */}
      {isDrawMode && (
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 bg-[#1A1A22] border-b border-zinc-700/40 text-xs font-mono gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider hidden md:inline">
              TELESTRATOR:
            </span>

            {/* Tool Selection Buttons */}
            <div className="flex items-center bg-[#121215] border border-[#27272A] rounded-lg p-0.5">
              <button
                onClick={() => setActiveDrawTool('arrow')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  activeDrawTool === 'arrow'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Panah Lari / Movement Arrow"
              >
                <ArrowUpRight size={13} />
                <span className="hidden sm:inline">Panah</span>
              </button>

              <button
                onClick={() => setActiveDrawTool('spotlight')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  activeDrawTool === 'spotlight'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Player Spotlight / Halo Ring"
              >
                <Circle size={13} />
                <span className="hidden sm:inline">Spotlight</span>
              </button>

              <button
                onClick={() => setActiveDrawTool('zone')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  activeDrawTool === 'zone'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Tactical Zone / Half-space Box"
              >
                <Square size={13} />
                <span className="hidden sm:inline">Zone Box</span>
              </button>

              <button
                onClick={() => setActiveDrawTool('pen')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  activeDrawTool === 'pen'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Freehand Pen"
              >
                <Pencil size={13} />
                <span className="hidden sm:inline">Freehand</span>
              </button>
            </div>

            {/* Color Palette */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-700/60">
              {[
                { name: 'Volt', color: '#CEFF00' },
                { name: 'Cyan', color: '#00F0FF' },
                { name: 'Red', color: '#FF3B30' },
                { name: 'Emerald', color: '#00E676' },
                { name: 'White', color: '#FFFFFF' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setDrawColor(c.color)}
                  style={{ backgroundColor: c.color }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    drawColor === c.color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1A1A22]' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Undo & Clear Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndoDrawing}
              disabled={drawings.length === 0}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#121215] border border-[#27272A] text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none text-[11px]"
              title="Batalkan coretan terakhir (Undo)"
            >
              <Undo size={12} />
              <span>Undo</span>
            </button>

            <button
              onClick={handleClearDrawings}
              disabled={drawings.length === 0}
              className="flex items-center gap-1 px-2 py-1 rounded bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/60 disabled:opacity-40 disabled:pointer-events-none text-[11px]"
              title="Hapus semua coretan"
            >
              <Trash2 size={12} />
              <span>Bersihkan</span>
            </button>

            <button
              onClick={() => setIsDrawMode(false)}
              className="p-1 rounded text-zinc-400 hover:text-white"
              title="Tutup Mode Coret"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 16:9 Aspect Ratio Container with Canvas & Underlying Video */}
      <div ref={containerRef} className="relative w-full aspect-video bg-[#0F2C1F] flex items-center justify-center overflow-hidden rounded-b-none">
        
        {/* Underlying Video Player (HTML5 Video or YouTube IFrame API Container) */}
        <div className={`absolute inset-0 z-0 overflow-hidden ${showVideoBackground ? 'opacity-85' : 'opacity-0 pointer-events-none'}`}>
          {videoSrc ? (
            <video
              ref={videoElementRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full overflow-hidden">
              <div
                id={ytPlayerContainerId}
                className="w-full h-full scale-[1.05]"
              />
            </div>
          )}
        </div>

        {/* HTML5 Overlay Canvas for 2D Pitch & Player Bounding Circles */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`absolute inset-0 z-10 w-full h-full ${
            isDrawMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
          }`}
        />

        {/* Live Status Pill in Viewport */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 border border-white/10 text-[11px] font-mono text-white backdrop-blur-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>2D Optical Radar</span>
            <span className="text-zinc-500">·</span>
            <span className="text-emerald-400 font-bold">11v11 CANONICAL</span>
          </span>
        </div>

        {/* Dynamic Tactical Metrics Ribbon inside Viewport */}
        {tacticalMetrics && (
          <div className="absolute top-3 right-3 z-20 pointer-events-none hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/85 border border-white/10 text-[10px] font-mono text-zinc-300 backdrop-blur-xs shadow-xs">
              <Compass size={11} className="text-[#CEFF00]" />
              <span>Def Line:</span>
              <span className="text-red-400 font-bold">MUN {tacticalMetrics.homeDefensiveLineMeters}m</span>
              <span className="text-zinc-600">|</span>
              <span className="text-sky-400 font-bold">MCI {tacticalMetrics.awayDefensiveLineMeters}m</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/85 border border-white/10 text-[10px] font-mono text-zinc-300 backdrop-blur-xs shadow-xs">
              <Gauge size={11} className="text-amber-400" />
              <span>Compact:</span>
              <span className="text-amber-300 font-bold">{tacticalMetrics.homeCompactnessAreaM2} m²</span>
            </div>
          </div>
        )}

        {/* Frame & Active Moment Pill */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-2">
          <div className="px-2.5 py-1 bg-black/80 border border-white/10 rounded-md text-[11px] font-mono text-zinc-300 backdrop-blur-xs">
            Frame {(currentFrame?.frameNumber ?? 0) % 600} / 600 ({(((currentFrame?.frameNumber ?? 0) % 600) * 0.1).toFixed(1)}s)
          </div>
          {activeMoment && (
            <div className="px-2.5 py-1 bg-black/85 border border-white/10 rounded-md text-[11px] text-white font-mono font-medium flex items-center gap-1 backdrop-blur-xs">
              <Award size={12} className="text-amber-400" />
              <span>{activeMoment.minute}&apos; {activeMoment.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Event Timeline Bar */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-[#18181C] border-t border-slate-200/80 dark:border-[#27272A] flex items-center justify-between text-xs gap-2 sm:gap-3 transition-colors">
        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase font-mono tracking-wider shrink-0 hidden sm:inline">
          FA Shield Key Moments:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pr-1 no-scrollbar">
          {MATCH_TIMELINE_EVENTS.map((moment) => (
            <button
              key={moment.minute}
              onClick={() => seekToMoment(moment)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
                activeMoment?.minute === moment.minute
                  ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                  : 'bg-[#121215] border border-[#27272A] text-zinc-300 hover:border-zinc-700 hover:text-white shadow-xs'
              }`}
            >
              <span className="font-bold">{moment.minute}&apos;</span>
              <span className="font-sans font-medium">{moment.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#121215] border-t border-[#27272A] text-xs transition-colors gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-xs ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-[#CEFF00] hover:bg-[#b8e600] text-black font-black shadow-xs shadow-[#CEFF00]/20'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause Tracker' : 'Play Tracker'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1A1A1E] transition-colors text-xs font-mono shadow-xs"
            title="Reset video playback to frame 0"
          >
            <RotateCcw size={13} />
            <span>Reset (0s)</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-[#CEFF00]" />
            <span>Sync: {videoSrc ? 'HTML5 timeupdate' : 'YouTube IFrame API'}</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span>Tempo: {tempo}x</span>
        </div>
      </div>

      {/* Tactical Dossier Export Modal (TSK-PRO) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#121215] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181C]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-[#CEFF00]">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Dossier Analisis Taktis Pertandingan
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    FA Community Shield 2024 · MUN vs MCI · Laporan Resmi Tim Analis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Report Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Captured Canvas Snapshot */}
              {exportedImageUrl && (
                <div className="rounded-xl overflow-hidden border border-[#27272A] bg-[#0A0A0C]">
                  <img
                    src={exportedImageUrl}
                    alt="Tactical Canvas Snapshot"
                    className="w-full aspect-video object-contain"
                  />
                </div>
              )}

              {/* Match Moment & Phase Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#18181C] border border-[#27272A]">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">FASE LAGA</span>
                  <div className="text-white font-bold text-sm">
                    {activeMoment ? `${activeMoment.minute}' ${activeMoment.label}` : 'Continuous Match Play'}
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                    Frame {(currentFrame?.frameNumber ?? 0) % 600} / 600
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#18181C] border border-[#27272A]">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">GARIS PERTAHANAN (DEF LINE)</span>
                  <div className="flex items-center gap-2 text-white font-bold text-sm font-mono">
                    <span className="text-red-400">MUN {tacticalMetrics?.homeDefensiveLineMeters ?? 41.2}m</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-sky-400">MCI {tacticalMetrics?.awayDefensiveLineMeters ?? 48.5}m</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
                    Struktur Kompak ({tacticalMetrics?.homeCompactnessAreaM2 ?? 482} m²)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#18181C] border border-[#27272A]">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">STATUS ANOTASI</span>
                  <div className="text-[#CEFF00] font-bold text-sm font-mono">
                    {drawings.length} Corekan Aktif
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">
                    {drawings.filter(d => d.type === 'arrow').length} Panah · {drawings.filter(d => d.type === 'spotlight').length} Spotlight · {drawings.filter(d => d.type === 'zone').length} Zone
                  </span>
                </div>
              </div>

              {/* Coaching Staff Tactical Dossier Summary Note */}
              <div className="p-4 rounded-xl bg-[#CEFF00]/5 border border-[#CEFF00]/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#CEFF00] uppercase font-mono">
                  <Activity size={14} />
                  <span>Catatan Taktis Staf Pelatih (Tactical Dossier Debrief)</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Berdasarkan pelacakan pergerakan pemain di frame ini, transisi balik Manchester United memanfaatkan celah half-space kiri melalui overlapping run. Garis pertahanan Manchester City naik setinggi {tacticalMetrics?.awayDefensiveLineMeters ?? 48.5}m, menciptakan ruang 28.4m di belakang garis bek tengah untuk bola terobosan diagonal.
                </p>
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272A] bg-[#18181C]">
              <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                TactIQ Pro Analytics Engine v2.4
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#27272A] hover:bg-[#323238] text-white font-medium text-xs transition-colors"
                >
                  <FileText size={14} />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={handleDownloadPng}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#CEFF00] hover:bg-[#b8e600] text-black font-bold text-xs transition-all shadow-xs shadow-[#CEFF00]/20"
                >
                  <Download size={14} />
                  <span>Unduh Gambar PNG</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
