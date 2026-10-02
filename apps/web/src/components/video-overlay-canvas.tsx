'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket, joinTrackingSession, leaveTrackingSession } from '@/lib/socket';
import type { TrackingFramePayload, TrackingEntity } from '@tactiq/shared-types';
import { Activity, Radio, Play, Pause, RotateCcw, Video, Eye, Award, Crosshair } from 'lucide-react';

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
  { minute: 24, label: 'McAtee Post Shot', type: 'chance', timestampMs: 2400 },
  { minute: 54, label: 'Bruno Curler (Offside)', type: 'shot', timestampMs: 5400 },
  { minute: 75, label: 'Rashford Hits Post', type: 'chance', timestampMs: 7500 },
  { minute: 82, label: 'Garnacho Solo Goal (0-1)', type: 'goal', timestampMs: 8200 },
  { minute: 89, label: 'Bernardo Header Goal (1-1)', type: 'goal', timestampMs: 8900 },
  { minute: 90, label: 'Penalty Shootout', type: 'shot', timestampMs: 9000 },
];

const SPAIN_CROATIA_EVENTS: MatchEventMoment[] = [
  { minute: 29, label: 'Morata 1-0 Goal', type: 'goal', timestampMs: 2900 },
  { minute: 32, label: 'Fabián Ruiz Solo Goal', type: 'goal', timestampMs: 3200 },
  { minute: 45, label: 'Yamal Assist to Carvajal', type: 'goal', timestampMs: 4500 },
  { minute: 55, label: 'Livaković Double Save', type: 'chance', timestampMs: 5500 },
  { minute: 80, label: 'Unai Simón Penalty Save', type: 'chance', timestampMs: 8000 },
];

const PREMIER_LEAGUE_EVENTS: MatchEventMoment[] = [
  { minute: 14, label: 'Saka Cut-back Cross', type: 'chance', timestampMs: 1400 },
  { minute: 28, label: 'Haaland Counter Goal', type: 'goal', timestampMs: 2800 },
  { minute: 42, label: 'Saliba Tactical Foul', type: 'card', timestampMs: 4200 },
  { minute: 67, label: 'De Bruyne Volley Shot', type: 'shot', timestampMs: 6700 },
  { minute: 88, label: 'Raya Critical Save', type: 'chance', timestampMs: 8800 },
];

export const VideoOverlayCanvas: React.FC<VideoOverlayCanvasProps> = ({
  sessionId = 'session-mun-mci-community-shield-2024',
  youtubeUrl = 'https://www.youtube.com/embed/X0we8220k74?autoplay=1&mute=1&controls=0&loop=1&playlist=X0we8220k74',
  videoSrc,
  className = '',
  initialVideoMode = true,
  onFrameUpdate,
  showFieldLines = false,
  showIntersections = false,
  showCameraFov = true,
  fieldLines = [],
  intersections = [],
  onOpenCalibrationModal,
  homeCode = 'MUN',
  awayCode = 'MCI',
  homeName = 'Man United',
  awayName = 'Man City',
  score = '1 — 1',
  statusBadge = "82' GARNACHO 1-0",
  homeColor = '#DA291C',
  awayColor = '#6CABDD',
  trackedFrames,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showCanvasOverlay, setShowCanvasOverlay] = useState<boolean>(false);
  const [currentFrame, setCurrentFrame] = useState<TrackingFramePayload | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isSimulatingLocal, setIsSimulatingLocal] = useState<boolean>(true);
  const [showVideoBackground, setShowVideoBackground] = useState<boolean>(initialVideoMode || Boolean(videoSrc));
  const [activeMoment, setActiveMoment] = useState<MatchEventMoment | null>(null);
  const [entityStats, setEntityStats] = useState<{ homeCount: number; awayCount: number; ballSpeed: number }>({
    homeCount: 11,
    awayCount: 11,
    ballSpeed: 28.5,
  });

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.5);
  const playbackSpeedRef = useRef<number>(1.5);
  playbackSpeedRef.current = playbackSpeed;

  const trailsRef = useRef<Map<number, Array<{ x: number; y: number }>>>(new Map());
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localFrameCounterRef = useRef<number>(0);

  const timelineMoments =
    homeCode === 'MUN' || (homeCode === 'MCI' && awayCode === 'MUN')
      ? [
          { minute: 24, label: 'McAtee Post Shot', type: 'chance' as const, timestampMs: 5000 },
          { minute: 54, label: 'Bruno Curler (Offside)', type: 'shot' as const, timestampMs: 15000 },
          { minute: 75, label: 'Rashford Hits Post', type: 'chance' as const, timestampMs: 30000 },
          { minute: 82, label: 'Garnacho Solo Goal (0-1)', type: 'goal' as const, timestampMs: 42000 },
          { minute: 89, label: 'Bernardo Header Goal (1-1)', type: 'goal' as const, timestampMs: 52000 },
          { minute: 90, label: 'Penalty Shootout', type: 'shot' as const, timestampMs: 58000 },
        ]
      : homeCode === 'ESP'
      ? SPAIN_CROATIA_EVENTS
      : PREMIER_LEAGUE_EVENTS;

  // Resize canvas according to container aspect ratio
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    canvasRef.current.width = clientWidth;
    canvasRef.current.height = clientHeight;
  }, []);

  // Draw Tactical Football Pitch Lines (only for 2D Canvas mode, NOT broadcast video)
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

    // 1. Draw pitch foundation ONLY when video is not active (pure 2D tactical pitch view)
    if (!isVideoBg) {
      drawPitch(ctx, width, height, false);
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
    let bSpeed = 28.5;

    frame.entities.forEach((entity) => {
      if (entity.team === 'home') homeC++;
      if (entity.team === 'away') awayC++;
      if (entity.team === 'ball') bSpeed = entity.speedKmh || 28.5;
    });

    setEntityStats({ homeCount: homeC, awayCount: awayC, ballSpeed: bSpeed });

    // If video background is active and overlay is turned off, keep broadcast video clean
    if (isVideoBg && !showCanvasOverlay) {
      return;
    }

    // 3. Render entities (players & ball)
    frame.entities.forEach((entity: TrackingEntity) => {
      // In video overlay mode, if entity has cam_x/cam_y use camera coordinates, else pitch coordinates
      const hasCamCoords = (entity as any).cam_x !== undefined && (entity as any).cam_y !== undefined;
      const posX = (isVideoBg && hasCamCoords) ? (entity as any).cam_x : entity.x;
      const posY = (isVideoBg && hasCamCoords) ? (entity as any).cam_y : entity.y;

      const px = posX * width;
      const py = posY * height;

      if (entity.team === 'home') homeC++;
      if (entity.team === 'away') awayC++;
      if (entity.team === 'ball') bSpeed = entity.speedKmh || 28.5;

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
            ? (homeColor ? `${homeColor}66` : 'rgba(239, 1, 7, 0.4)')
            : entity.team === 'away'
            ? (awayColor ? `${awayColor}66` : 'rgba(108, 171, 221, 0.4)')
            : 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = entity.team === 'ball' ? 2.5 : 1.5;
        ctx.stroke();
      }

      // Draw Entity Circle / Bounding Halo
      if (entity.team === 'ball') {
        ctx.save();
        ctx.shadowColor = '#00DF59';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00DF59';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      } else {
        const isHome = entity.team === 'home';
        const primaryColor = isHome ? homeColor : awayColor;

        // Tactical Pitch Ring
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

        // Speed badge
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
  }, [homeColor, awayColor, showFieldLines, fieldLines, showIntersections, intersections]);

  // Client-side simulation fallback generator for 11v11 match
  const generateSimulatedFrame = useCallback((fIdx: number): TrackingFramePayload => {
    // If real tracked frames from the video are provided, cycle through them!
    if (trackedFrames && trackedFrames.length > 0) {
      const frameIdx = fIdx % trackedFrames.length;
      return trackedFrames[frameIdx];
    }

    // Adaptive 11v11 player setups
    const isMunMci = homeCode === 'MUN' || (homeCode === 'MCI' && awayCode === 'MUN');
    const isSpainCroatia = homeCode === 'ESP';

    const baseHome = isMunMci
      ? [
          { id: 1, num: 1, x: 0.08, y: 0.50 },   // Onana
          { id: 20, num: 20, x: 0.22, y: 0.24 }, // Dalot
          { id: 5, num: 5, x: 0.20, y: 0.50 },   // Maguire
          { id: 6, num: 6, x: 0.22, y: 0.76 },   // Martinez
          { id: 18, num: 18, x: 0.38, y: 0.38 }, // Casemiro
          { id: 37, num: 37, x: 0.38, y: 0.62 }, // Mainoo
          { id: 16, num: 16, x: 0.62, y: 0.16 }, // Amad Diallo
          { id: 8, num: 8, x: 0.58, y: 0.40 },   // Bruno Fernandes
          { id: 10, num: 10, x: 0.58, y: 0.60 }, // Rashford
          { id: 17, num: 17, x: 0.62, y: 0.84 }, // Garnacho
          { id: 9, num: 9, x: 0.74, y: 0.50 },   // Hojlund
        ]
      : isSpainCroatia
      ? [
          { id: 23, num: 23, x: 0.08, y: 0.50 }, // Unai Simón (GK)
          { id: 2, num: 2, x: 0.28, y: 0.16 },   // Dani Carvajal (RB)
          { id: 3, num: 3, x: 0.22, y: 0.36 },   // Robin Le Normand (CB)
          { id: 4, num: 4, x: 0.22, y: 0.64 },   // Nacho (CB)
          { id: 24, num: 24, x: 0.28, y: 0.84 }, // Marc Cucurella (LB)
          { id: 16, num: 16, x: 0.44, y: 0.50 }, // Rodri (DM)
          { id: 20, num: 20, x: 0.54, y: 0.34 }, // Pedri (CM)
          { id: 8, num: 8, x: 0.54, y: 0.66 },   // Fabián Ruiz (CM)
          { id: 19, num: 19, x: 0.70, y: 0.24 }, // Lamine Yamal (RW)
          { id: 7, num: 7, x: 0.76, y: 0.50 },   // Álvaro Morata (CF)
          { id: 17, num: 17, x: 0.70, y: 0.76 }, // Nico Williams (LW)
        ]
      : [
          { id: 1, num: 1, x: 0.08, y: 0.50 },
          { id: 2, num: 2, x: 0.25, y: 0.20 },
          { id: 3, num: 3, x: 0.22, y: 0.40 },
          { id: 4, num: 4, x: 0.22, y: 0.60 },
          { id: 5, num: 5, x: 0.25, y: 0.80 },
          { id: 6, num: 16, x: 0.42, y: 0.50 },
          { id: 7, num: 8, x: 0.55, y: 0.35 },
          { id: 8, num: 10, x: 0.55, y: 0.65 },
          { id: 9, num: 7, x: 0.72, y: 0.20 },
          { id: 10, num: 9, x: 0.75, y: 0.50 },
          { id: 11, num: 11, x: 0.72, y: 0.80 },
        ];

    const baseAway = isMunMci
      ? [
          { id: 31, num: 31, x: 0.92, y: 0.50 },  // Ederson
          { id: 82, num: 82, x: 0.78, y: 0.20 }, // Lewis
          { id: 25, num: 25, x: 0.76, y: 0.40 }, // Akanji
          { id: 3, num: 3, x: 0.76, y: 0.60 },   // Dias
          { id: 24, num: 24, x: 0.78, y: 0.80 }, // Gvardiol
          { id: 52, num: 52, x: 0.55, y: 0.22 }, // Bobb
          { id: 8, num: 8, x: 0.52, y: 0.42 },   // Kovacic
          { id: 17, num: 17, x: 0.52, y: 0.58 }, // De Bruyne
          { id: 11, num: 11, x: 0.55, y: 0.78 }, // Doku
          { id: 9, num: 9, x: 0.42, y: 0.46 },   // Haaland
          { id: 20, num: 20, x: 0.42, y: 0.54 }, // Bernardo Silva
        ]
      : isSpainCroatia
      ? [
          { id: 1, num: 1, x: 0.92, y: 0.50 },   // Dominik Livaković (GK)
          { id: 22, num: 2, x: 0.74, y: 0.20 },  // Josip Stanišić (RB)
          { id: 6, num: 6, x: 0.78, y: 0.38 },   // Josip Šutalo (CB)
          { id: 33, num: 3, x: 0.78, y: 0.62 },  // Marin Pongračić (CB)
          { id: 44, num: 4, x: 0.72, y: 0.80 },  // Joško Gvardiol (LB)
          { id: 11, num: 11, x: 0.58, y: 0.50 }, // Marcelo Brozović (DM)
          { id: 10, num: 10, x: 0.48, y: 0.36 }, // Luka Modrić (CM)
          { id: 88, num: 8, x: 0.48, y: 0.64 },  // Mateo Kovačić (CM)
          { id: 77, num: 7, x: 0.42, y: 0.22 },  // Lovro Majer (RW)
          { id: 9, num: 9, x: 0.38, y: 0.50 },   // Andrej Kramarić (CF)
          { id: 14, num: 14, x: 0.42, y: 0.78 }, // Ante Budimir (LW)
        ]
      : [
          { id: 31, num: 31, x: 0.92, y: 0.50 },
          { id: 25, num: 2, x: 0.75, y: 0.20 },
          { id: 13, num: 3, x: 0.78, y: 0.40 },
          { id: 14, num: 6, x: 0.78, y: 0.60 },
          { id: 15, num: 24, x: 0.75, y: 0.80 },
          { id: 16, num: 16, x: 0.58, y: 0.50 },
          { id: 17, num: 17, x: 0.50, y: 0.40 },
          { id: 18, num: 20, x: 0.50, y: 0.60 },
          { id: 19, num: 47, x: 0.45, y: 0.25 },
          { id: 20, num: 9, x: 0.40, y: 0.50 },
          { id: 21, num: 11, x: 0.45, y: 0.75 },
        ];

    const entities: TrackingEntity[] = [];

    // Home players
    baseHome.forEach((b) => {
      const swayX = Math.sin((fIdx * 0.12) + b.id) * 0.03;
      const swayY = Math.cos((fIdx * 0.12) + b.id) * 0.025;
      const x = Math.min(0.96, Math.max(0.04, b.x + swayX));
      const y = Math.min(0.96, Math.max(0.04, b.y + swayY));
      const speedKmh = 14 + Math.abs(Math.sin(fIdx * 0.15 + b.id) * 12);
      entities.push({
        id: b.id,
        team: 'home',
        x: parseFloat(x.toFixed(3)),
        y: parseFloat(y.toFixed(3)),
        speedKmh: parseFloat(speedKmh.toFixed(1)),
        jerseyNumber: b.num,
      });
    });

    // Away players
    baseAway.forEach((b) => {
      const swayX = Math.sin((fIdx * 0.12) + b.id) * 0.03;
      const swayY = Math.cos((fIdx * 0.12) + b.id) * 0.025;
      const x = Math.min(0.96, Math.max(0.04, b.x + swayX));
      const y = Math.min(0.96, Math.max(0.04, b.y + swayY));
      const speedKmh = 14 + Math.abs(Math.sin(fIdx * 0.15 + b.id) * 12);
      entities.push({
        id: b.id + 100,
        team: 'away',
        x: parseFloat(x.toFixed(3)),
        y: parseFloat(y.toFixed(3)),
        speedKmh: parseFloat(speedKmh.toFixed(1)),
        jerseyNumber: b.num,
      });
    });

    // Match Ball (Dynamic movement)
    const ballSwayX = Math.sin(fIdx * 0.2) * 0.15;
    const ballSwayY = Math.cos(fIdx * 0.2) * 0.15;
    const ballBaseX = isSpainCroatia ? 0.65 : 0.52;
    const ballBaseY = isSpainCroatia ? 0.35 : 0.48;
    const ballSpeed = 25.0 + Math.abs(Math.sin(fIdx * 0.3) * 35);
    entities.push({
      id: 999,
      team: 'ball',
      x: parseFloat(Math.min(0.95, Math.max(0.05, ballBaseX + ballSwayX)).toFixed(3)),
      y: parseFloat(Math.min(0.95, Math.max(0.05, ballBaseY + ballSwayY)).toFixed(3)),
      speedKmh: parseFloat(ballSpeed.toFixed(1)),
    });

    return {
      sessionId,
      timestampMs: fIdx * 100,
      frameNumber: fIdx,
      entities,
    };
  }, [sessionId, homeCode, trackedFrames]);

  const onFrameUpdateRef = useRef(onFrameUpdate);
  onFrameUpdateRef.current = onFrameUpdate;

  const renderFrameRef = useRef(renderFrame);
  renderFrameRef.current = renderFrame;

  const generateSimulatedFrameRef = useRef(generateSimulatedFrame);
  generateSimulatedFrameRef.current = generateSimulatedFrame;

  const showVideoBackgroundRef = useRef(showVideoBackground);
  showVideoBackgroundRef.current = showVideoBackground;

  // Socket.io Connection & Streaming listener
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial mount: generate and render initial frame immediately
    const initFrame = generateSimulatedFrameRef.current(localFrameCounterRef.current);
    setCurrentFrame(initFrame);
    renderFrameRef.current(initFrame, showVideoBackgroundRef.current);
    if (onFrameUpdateRef.current) onFrameUpdateRef.current(initFrame);

    // Auto-start continuous simulated stream so tactical board is alive immediately
    if (isSimulatingLocal) {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      const intervalMs = Math.max(20, Math.round(50 / playbackSpeedRef.current));
      localTimerRef.current = setInterval(() => {
        localFrameCounterRef.current += 1;
        const frame = generateSimulatedFrameRef.current(localFrameCounterRef.current);
        setCurrentFrame(frame);
        renderFrameRef.current(frame, showVideoBackgroundRef.current);
        if (onFrameUpdateRef.current) onFrameUpdateRef.current(frame);
      }, intervalMs);
    }

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
        renderFrameRef.current(payload, showVideoBackgroundRef.current);
        if (onFrameUpdateRef.current) onFrameUpdateRef.current(payload);
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
  }, [sessionId, isSimulatingLocal, handleResize, playbackSpeed]);

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    playbackSpeedRef.current = speed;
    if (isSimulatingLocal) {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      const intervalMs = Math.max(20, Math.round(50 / speed));
      localTimerRef.current = setInterval(() => {
        localFrameCounterRef.current += 1;
        const frame = generateSimulatedFrameRef.current(localFrameCounterRef.current);
        setCurrentFrame(frame);
        renderFrameRef.current(frame, showVideoBackgroundRef.current);
        if (onFrameUpdateRef.current) onFrameUpdateRef.current(frame);
      }, intervalMs);
    }
  };

  const toggleSimulation = () => {
    if (isSimulatingLocal) {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
      setIsSimulatingLocal(false);
    } else {
      setIsSimulatingLocal(true);
      const intervalMs = Math.max(20, Math.round(50 / playbackSpeedRef.current));
      localTimerRef.current = setInterval(() => {
        localFrameCounterRef.current += 1;
        const frame = generateSimulatedFrame(localFrameCounterRef.current);
        setCurrentFrame(frame);
        renderFrame(frame, showVideoBackground);
        if (onFrameUpdate) onFrameUpdate(frame);
      }, intervalMs);
    }
  };

  const resetSimulation = () => {
    localFrameCounterRef.current = 0;
    trailsRef.current.clear();
    const frame = generateSimulatedFrame(0);
    setCurrentFrame(frame);
    renderFrame(frame, showVideoBackground);
    if (onFrameUpdate) onFrameUpdate(frame);
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
      {/* Top Stream Status Header with Dynamic Club Matchup */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-[#18181C] border-b border-slate-200/80 dark:border-[#27272A] gap-2">
        {/* Matchup & Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-semibold hidden sm:inline">{statusBadge || 'YOLOv8 TRACKING'}</span>
            <span className="font-semibold sm:hidden">TRACKED</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white font-mono shrink-0">
            <span className="px-1.5 py-0.5 rounded text-white text-[9px] sm:text-[10px]" style={{ backgroundColor: homeColor }}>
              {homeCode}
            </span>
            <span className="tabular-nums font-mono">{score}</span>
            <span className="px-1.5 py-0.5 rounded text-white text-[9px] sm:text-[10px]" style={{ backgroundColor: awayColor }}>
              {awayCode}
            </span>
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
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[32px] cursor-pointer ${
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
                  : 'High-Cam Broadcast'
                : '2D Pitch Plane'}
            </span>
            <span className="sm:hidden">{showVideoBackground ? 'Cam Video' : '2D Plane'}</span>
          </button>

          {/* Overlay Bidak Toggle on Video */}
          {showVideoBackground && (
            <button
              onClick={() => {
                const nextOverlay = !showCanvasOverlay;
                setShowCanvasOverlay(nextOverlay);
                if (currentFrame) renderFrameRef.current(currentFrame, true);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold font-mono transition-all shrink-0 min-h-[32px] cursor-pointer ${
                showCanvasOverlay
                  ? 'bg-emerald-500 text-white font-extrabold shadow-xs'
                  : 'bg-[#18181C] text-zinc-400 border border-[#27272A] hover:text-white'
              }`}
              title="Tampilkan / Sembunyikan Bidak Overlay di atas Video Broadcast"
            >
              <Crosshair size={13} />
              <span className="hidden sm:inline">Overlay Bidak: {showCanvasOverlay ? 'ON' : 'OFF'}</span>
              <span className="sm:hidden">Overlay: {showCanvasOverlay ? 'ON' : 'OFF'}</span>
            </button>
          )}

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

          {/* Dynamic Entity Telemetry Counters */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: homeColor }} />
              <span>{homeCode}: {entityStats.homeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: awayColor }} />
              <span>{awayCode}: {entityStats.awayCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Est. Ball: {entityStats.ballSpeed} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 16:9 Aspect Ratio Container with Clean Pitch Display */}
      <div ref={containerRef} className="relative w-full aspect-video bg-[#0F2C1F] flex items-center justify-center overflow-hidden rounded-b-none">
        {/* Underlying Video Player (HTML5 Video or YouTube Embed) */}
        {showVideoBackground && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {videoSrc ? (
              <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover opacity-85"
              />
            ) : (
              <iframe
                className="w-full h-full scale-[1.05] opacity-80"
                src={youtubeUrl}
                title="Tactical Match Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
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
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{showVideoBackground ? 'Match Broadcast' : '2D Radar'}</span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-400 font-bold">{statusBadge || 'YOLOv8 TRACKING'}</span>
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
          {timelineMoments.map((moment) => (
            <button
              key={moment.minute}
              onClick={() => seekToMoment(moment)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
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
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer ${
              isSimulatingLocal
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-[#CEFF00] hover:bg-[#b8e600] text-black font-black shadow-xs shadow-[#CEFF00]/20'
            }`}
          >
            {isSimulatingLocal ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulatingLocal ? 'Pause Stream' : 'Play Live Stream'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1A1A1E] transition-colors text-xs font-mono shadow-xs cursor-pointer"
            title="Reset tracking stream"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Radar Speed Selector */}
          <div className="flex items-center gap-1.5 bg-[#18181C] border border-[#27272A] rounded-lg px-2 py-1">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Tempo:</span>
            {[1, 1.5, 2, 3].map((spd) => (
              <button
                key={spd}
                onClick={() => changePlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-[#CEFF00] text-black shadow-xs font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Atur kecepatan pergerakan bidak ke ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 font-mono text-[11px] hidden sm:flex">
          <Activity size={14} className="text-[#CEFF00]" />
          <span>TactIQ Vision Stream ({homeName} vs {awayName})</span>
        </div>
      </div>
    </div>
  );
};
