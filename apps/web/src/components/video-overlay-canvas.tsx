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
} from 'lucide-react';
import { generate600FrameSequence, calculateTacticalMetrics } from '@/lib/tactical-600-sequence';

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
                    ? 'bg-[#CEFF00] text-black shadow-xs'
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
                ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
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
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        />

        {/* Live Status Pill in Viewport */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 border border-white/10 text-[11px] font-mono text-white backdrop-blur-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse" />
            <span>2D Optical Radar</span>
            <span className="text-zinc-500">·</span>
            <span className="text-[#CEFF00] font-bold">11v11 COMMUNITY SHIELD</span>
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

    </div>
  );
};
