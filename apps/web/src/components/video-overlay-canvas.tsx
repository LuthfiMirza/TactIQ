'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket, joinTrackingSession, leaveTrackingSession } from '@/lib/socket';
import type { TrackingFramePayload, TrackingEntity } from '@tactiq/shared-types';
import { Activity, Radio, Play, Pause, RotateCcw, Video, Eye, Flag, Target, Award } from 'lucide-react';

interface VideoOverlayCanvasProps {
  sessionId?: string;
  youtubeUrl?: string;
  className?: string;
  onFrameUpdate?: (frame: TrackingFramePayload) => void;
}

interface MatchEventMoment {
  minute: number;
  label: string;
  type: 'goal' | 'shot' | 'card' | 'chance';
  timestampMs: number;
}

const MATCH_TIMELINE_EVENTS: MatchEventMoment[] = [
  { minute: 14, label: 'Saka Cut-back Cross', type: 'chance', timestampMs: 1400 },
  { minute: 28, label: 'Haaland Counter Goal', type: 'goal', timestampMs: 2800 },
  { minute: 42, label: 'Saliba Tactical Foul', type: 'card', timestampMs: 4200 },
  { minute: 67, label: 'De Bruyne Volley Shot', type: 'shot', timestampMs: 6700 },
  { minute: 88, label: 'Raya Critical Save', type: 'chance', timestampMs: 8800 },
];

export const VideoOverlayCanvas: React.FC<VideoOverlayCanvasProps> = ({
  sessionId = 'demo-session-tactical-001',
  youtubeUrl = 'https://www.youtube.com/embed/z4B7hN5sE_s?autoplay=1&mute=1&controls=0&loop=1&playlist=z4B7hN5sE_s',
  className = '',
  onFrameUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentFrame, setCurrentFrame] = useState<TrackingFramePayload | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isSimulatingLocal, setIsSimulatingLocal] = useState<boolean>(false);
  const [showVideoBackground, setShowVideoBackground] = useState<boolean>(false);
  const [activeMoment, setActiveMoment] = useState<MatchEventMoment | null>(null);
  const [entityStats, setEntityStats] = useState<{ homeCount: number; awayCount: number; ballSpeed: number }>({
    homeCount: 0,
    awayCount: 0,
    ballSpeed: 0,
  });

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
      // Pitch background with rich stadium grass texture
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
    ctx.strokeStyle = isTransparent ? 'rgba(255, 255, 255, 0.50)' : 'rgba(255, 255, 255, 0.60)';
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
        ctx.shadowBlur = 14;
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
        const primaryColor = isHome ? '#0284C7' : '#EF4444';

        // Flat Tactical Pitch Ring (Crisp Solid, No Blur/Glow)
        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, py + 4, 13, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Player Circle Dot
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Jersey / ID label inside entity
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = entity.jerseyNumber ? String(entity.jerseyNumber) : String(entity.id);
        ctx.fillText(label, px, py);

        // Speed badge (Solid flat tag)
        if (entity.speedKmh && entity.speedKmh > 18) {
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
  }, []);

  // Client-side simulation fallback generator
  const generateSimulatedFrame = useCallback((fIdx: number): TrackingFramePayload => {
    const base = [
      { id: 1, team: 'home' as const, x: 0.12, y: 0.50, num: 1 },
      { id: 2, team: 'home' as const, x: 0.28, y: 0.25, num: 2 },
      { id: 3, team: 'home' as const, x: 0.27, y: 0.50, num: 3 },
      { id: 4, team: 'home' as const, x: 0.28, y: 0.75, num: 4 },
      { id: 5, team: 'home' as const, x: 0.45, y: 0.48, num: 16 },
      { id: 6, team: 'home' as const, x: 0.60, y: 0.40, num: 9 },

      { id: 11, team: 'away' as const, x: 0.88, y: 0.50, num: 22 },
      { id: 12, team: 'away' as const, x: 0.72, y: 0.28, num: 2 },
      { id: 13, team: 'away' as const, x: 0.70, y: 0.50, num: 6 },
      { id: 14, team: 'away' as const, x: 0.72, y: 0.72, num: 4 },
      { id: 15, team: 'away' as const, x: 0.55, y: 0.52, num: 8 },
      { id: 16, team: 'away' as const, x: 0.48, y: 0.30, num: 7 },

      { id: 99, team: 'ball' as const, x: 0.48, y: 0.46, num: 0 },
    ];

    const entities: TrackingEntity[] = base.map((b) => {
      const swayX = Math.sin((fIdx * 0.15) + b.id) * 0.05;
      const swayY = Math.cos((fIdx * 0.15) + b.id) * 0.04;
      const x = Math.min(0.95, Math.max(0.05, b.x + swayX));
      const y = Math.min(0.95, Math.max(0.05, b.y + swayY));
      const speedKmh = b.team === 'ball' ? 32.5 : 16 + Math.abs(Math.sin(fIdx * 0.2 + b.id) * 14);

      return {
        id: b.id,
        team: b.team,
        x,
        y,
        speedKmh: parseFloat(speedKmh.toFixed(1)),
        jerseyNumber: b.num,
      };
    });

    return {
      sessionId,
      timestampMs: fIdx * 100,
      frameNumber: fIdx,
      entities,
    };
  }, [sessionId]);

  // Socket.io Connection & Streaming listener
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial mount: generate and render initial frame immediately
    const initFrame = generateSimulatedFrame(0);
    setCurrentFrame(initFrame);
    renderFrame(initFrame, showVideoBackground);
    if (onFrameUpdate) onFrameUpdate(initFrame);

    // Auto-start continuous simulated stream so tactical board is alive immediately
    setIsSimulatingLocal(true);
    localTimerRef.current = setInterval(() => {
      localFrameCounterRef.current += 1;
      const frame = generateSimulatedFrame(localFrameCounterRef.current);
      setCurrentFrame(frame);
      renderFrame(frame, showVideoBackground);
      if (onFrameUpdate) onFrameUpdate(frame);
    }, 100);

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
      window.removeEventListener('resize', handleResize);
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('frame_update', handleFrame);
      leaveTrackingSession(sessionId);
    };
  }, [sessionId, handleResize, renderFrame, showVideoBackground, onFrameUpdate, generateSimulatedFrame]);

  const toggleSimulation = () => {
    if (isSimulatingLocal) {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      setIsSimulatingLocal(false);
    } else {
      setIsSimulatingLocal(true);
      localTimerRef.current = setInterval(() => {
        localFrameCounterRef.current += 1;
        const frame = generateSimulatedFrame(localFrameCounterRef.current);
        setCurrentFrame(frame);
        renderFrame(frame, showVideoBackground);
        if (onFrameUpdate) onFrameUpdate(frame);
      }, 100);
    }
  };

  const resetSimulation = () => {
    localFrameCounterRef.current = 0;
    trailsRef.current.clear();
    const frame = generateSimulatedFrame(0);
    setCurrentFrame(frame);
    renderFrame(frame, showVideoBackground);
  };

  const seekToMoment = (moment: MatchEventMoment) => {
    setActiveMoment(moment);
    localFrameCounterRef.current = Math.floor(moment.timestampMs / 100);
    const frame = generateSimulatedFrame(localFrameCounterRef.current);
    setCurrentFrame(frame);
    renderFrame(frame, showVideoBackground);
    if (onFrameUpdate) onFrameUpdate(frame);
  };

  return (
    <div className={`relative flex flex-col w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl overflow-hidden shadow-xs transition-colors ${className}`}>
      {/* Top Stream Status Header with Club Matchup */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-[#18181C] border-b border-slate-200/80 dark:border-[#27272A] gap-2">
        {/* Matchup & Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 text-[10px] font-mono shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="font-semibold hidden sm:inline">LIVE CV STREAM</span>
            <span className="font-semibold sm:hidden">LIVE</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white font-mono shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-[#DA291C] text-white text-[9px] sm:text-[10px]">MUN</span>
            <span className="tabular-nums">7 — 0</span>
            <span className="px-1.5 py-0.5 rounded bg-[#6CABDD] text-white text-[9px] sm:text-[10px]">MCI</span>
          </div>
        </div>

        {/* View Mode Toggle: Pitch vs Video Stream */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => {
              const nextState = !showVideoBackground;
              setShowVideoBackground(nextState);
              if (currentFrame) renderFrame(currentFrame, nextState);
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[32px] ${
              showVideoBackground
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A] hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
            }`}
          >
            {showVideoBackground ? <Video size={13} /> : <Eye size={13} />}
            <span className="hidden sm:inline">{showVideoBackground ? 'High-Cam Broadcast' : '2D Pitch Plane'}</span>
            <span className="sm:hidden">{showVideoBackground ? 'High-Cam' : '2D Plane'}</span>
          </button>

          {/* Entity Telemetry Counters */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#DA291C]" />
              <span>MUN: {entityStats.homeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
              <span>MCI: {entityStats.awayCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Ball: {entityStats.ballSpeed} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 16:9 Aspect Ratio Container with Clean Pitch Display */}
      <div ref={containerRef} className="relative w-full aspect-video bg-[#0F2C1F] flex items-center justify-center overflow-hidden rounded-b-none">
        {/* Underlying YouTube Embed Video Player (if enabled) */}
        {showVideoBackground && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <iframe
              className="w-full h-full scale-[1.05] opacity-80"
              src={youtubeUrl}
              title="Tactical Match Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Absolutely positioned HTML5 Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        />

        {/* Clean Live Status Pill in Viewport */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 border border-white/10 text-[11px] font-mono text-white backdrop-blur-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>2D Radar</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">Live</span>
          </span>
        </div>

        {/* Frame & Active Moment Pill */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-2">
          <div className="px-2.5 py-1 bg-black/75 border border-white/10 rounded-md text-[11px] font-mono text-slate-300 backdrop-blur-xs">
            Frame {currentFrame?.frameNumber ?? 0}
          </div>
          {activeMoment && (
            <div className="px-2.5 py-1 bg-black/80 border border-white/10 rounded-md text-[11px] text-white font-mono font-medium flex items-center gap-1 backdrop-blur-xs">
              <Award size={12} className="text-amber-400" />
              <span>{activeMoment.minute}&apos; {activeMoment.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Event Timeline Bar */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-[#18181C] border-t border-slate-200/80 dark:border-[#27272A] flex items-center justify-between text-xs gap-2 sm:gap-3 transition-colors">
        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase font-mono tracking-wider shrink-0 hidden sm:inline">
          Moments:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pr-1 no-scrollbar">
          {MATCH_TIMELINE_EVENTS.map((moment) => (
            <button
              key={moment.minute}
              onClick={() => seekToMoment(moment)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
                activeMoment?.minute === moment.minute
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                  : 'bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-white shadow-xs'
              }`}
            >
              <span className="font-bold">{moment.minute}&apos;</span>
              <span className="font-sans font-medium">{moment.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#121215] border-t border-slate-200 dark:border-[#27272A] text-xs transition-colors gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-xs ${
              isSimulatingLocal
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white'
            }`}
          >
            {isSimulatingLocal ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulatingLocal ? 'Pause Radar' : 'Run Simulated Tracking'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1A1A1E] transition-colors text-xs font-mono shadow-xs"
            title="Reset simulation loop"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 font-mono text-[11px] hidden sm:flex">
          <Activity size={14} className="text-slate-500 dark:text-zinc-400" />
          <span>TactIQ Live Tracking Engine</span>
        </div>
      </div>
    </div>
  );
};
