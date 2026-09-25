'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket, joinTrackingSession, leaveTrackingSession } from '@/lib/socket';
import type { TrackingFramePayload, TrackingEntity } from '@tactiq/shared-types';
import { Activity, Radio, Play, Pause, RotateCcw } from 'lucide-react';

interface VideoOverlayCanvasProps {
  sessionId?: string;
  youtubeUrl?: string;
  className?: string;
  onFrameUpdate?: (frame: TrackingFramePayload) => void;
}

export const VideoOverlayCanvas: React.FC<VideoOverlayCanvasProps> = ({
  sessionId = 'demo-session-tactical-001',
  youtubeUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
  className = '',
  onFrameUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentFrame, setCurrentFrame] = useState<TrackingFramePayload | null>(null);
  const [fps, setFps] = useState<number>(10);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isSimulatingLocal, setIsSimulatingLocal] = useState<boolean>(false);
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
  const drawPitch = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Pitch background with subtle dark grass stripe texture
    ctx.fillStyle = '#0B1410';
    ctx.fillRect(0, 0, width, height);

    // Subtle stripes
    const stripeCount = 10;
    const stripeWidth = width / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.025)';
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, height);
      }
    }

    // Pitch Line Styles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
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

    // Left Goal
    ctx.strokeRect(padX - 8, padY + (pHeight - penH * 0.4) / 2, 8, penH * 0.4);
    // Right Goal
    ctx.strokeRect(padX + pWidth, padY + (pHeight - penH * 0.4) / 2, 8, penH * 0.4);
  };

  // Render tracking entities onto canvas
  const renderFrame = useCallback((frame: TrackingFramePayload) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw pitch foundation
    drawPitch(ctx, width, height);

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

      // Update historic trail for smooth tactical tails
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
            ? 'rgba(56, 189, 248, 0.25)'
            : entity.team === 'away'
            ? 'rgba(244, 63, 94, 0.25)'
            : 'rgba(250, 204, 21, 0.4)';
        ctx.lineWidth = entity.team === 'ball' ? 2 : 1.5;
        ctx.stroke();
      }

      // Draw Entity Circle
      if (entity.team === 'ball') {
        // Glowing Neon Ball
        ctx.save();
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else {
        const isHome = entity.team === 'home';
        const primaryColor = isHome ? '#38BDF8' : '#F43F5E';
        const glowColor = isHome ? 'rgba(56, 189, 248, 0.4)' : 'rgba(244, 63, 94, 0.4)';

        // Subtle glow halo
        ctx.save();
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Inner core border
        ctx.strokeStyle = '#0B0E14';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Jersey / ID label inside entity
        ctx.fillStyle = '#0B0E14';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = entity.jerseyNumber ? String(entity.jerseyNumber) : String(entity.id);
        ctx.fillText(label, px, py);

        // Velocity / Speed badge underneath
        if (entity.speedKmh && entity.speedKmh > 18) {
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.roundRect(px - 14, py + 12, 28, 12, 3);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '8px Inter, sans-serif';
          ctx.fillText(`${Math.round(entity.speedKmh)}k`, px, py + 18);
        }
      }
    });

    setEntityStats({ homeCount: homeC, awayCount: awayC, ballSpeed: bSpeed });
  }, []);

  // Socket.io Connection & Streaming listener
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

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
        renderFrame(payload);
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
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('frame_update', handleFrame);
      leaveTrackingSession(sessionId);
    };
  }, [sessionId, handleResize, renderFrame, onFrameUpdate]);

  // Client-side simulation fallback generator for offline preview
  const generateSimulatedFrame = (fIdx: number): TrackingFramePayload => {
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
  };

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
        renderFrame(frame);
        if (onFrameUpdate) onFrameUpdate(frame);
      }, 100);
    }
  };

  const resetSimulation = () => {
    localFrameCounterRef.current = 0;
    trailsRef.current.clear();
    const frame = generateSimulatedFrame(0);
    setCurrentFrame(frame);
    renderFrame(frame);
  };

  return (
    <div className={`relative flex flex-col w-full bg-tactiq-card border border-tactiq-border rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Top Stream Status Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-tactiq-card/90 border-b border-tactiq-border backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isLiveConnected || isSimulatingLocal ? 'bg-tactiq-emerald animate-ping' : 'bg-tactiq-muted'}`} />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {isLiveConnected ? 'Live Socket.io Stream' : isSimulatingLocal ? 'Local Simulation (10 FPS)' : 'Stream Idle'}
            </span>
          </div>
          <span className="text-xs text-tactiq-muted font-mono">Room: session_{sessionId}</span>
        </div>

        {/* Entity Telemetry Counters */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-tactiq-home">
            <span className="w-2 h-2 rounded-full bg-tactiq-home" />
            <span>Home: {entityStats.homeCount}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-tactiq-away">
            <span className="w-2 h-2 rounded-full bg-tactiq-away" />
            <span>Away: {entityStats.awayCount}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-tactiq-ball">
            <span className="w-2 h-2 rounded-full bg-tactiq-ball" />
            <span>Ball: {entityStats.ballSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* 16:9 Aspect Ratio Container */}
      <div ref={containerRef} className="relative w-full aspect-video bg-tactiq-bg flex items-center justify-center overflow-hidden">
        {/* Fallback Tactical Video Layer or Background Pattern */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Absolutely positioned HTML5 Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full cursor-crosshair"
        />

        {/* HUD Watermark & Timestamp */}
        <div className="absolute bottom-3 left-4 z-20 flex items-center space-x-3 pointer-events-none">
          <div className="px-2.5 py-1 bg-black/60 border border-white/10 rounded-md backdrop-blur-md">
            <span className="text-[11px] font-mono text-tactiq-cyan">
              Frame: {currentFrame?.frameNumber ?? 0} | T: {((currentFrame?.timestampMs ?? 0) / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-tactiq-surface/80 border-t border-tactiq-border text-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              isSimulatingLocal
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-tactiq-emerald/20 text-tactiq-emerald border border-tactiq-emerald/30 hover:bg-tactiq-emerald/30'
            }`}
          >
            {isSimulatingLocal ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulatingLocal ? 'Pause Simulated Stream' : 'Run Simulated Tracking'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-tactiq-card border border-tactiq-border text-slate-300 hover:text-white transition-colors"
            title="Reset simulation loop"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-tactiq-muted">
          <Activity size={14} className="text-tactiq-emerald" />
          <span>Real-time YOLOv8 Computer Vision Pipeline</span>
        </div>
      </div>
    </div>
  );
};
