'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { TrackingEntity } from '@tactiq/shared-types';
import { Compass } from 'lucide-react';

export interface TacticalMinimapProps {
  entities?: TrackingEntity[];
  selectedEntityId?: number | null;
  onSelectEntity?: (id: number | null) => void;
  className?: string;
  homeCode?: string;
  awayCode?: string;
  homeName?: string;
  awayName?: string;
  homeColor?: string;
  awayColor?: string;
  homePhase?: string;
  awayPhase?: string;
  statusBadge?: string;
  isLiveTracking?: boolean;
  cameraFovQuad?: number[][];
  sourceLabel?: string;
}

// ─── Spain vs Croatia 11v11 Tactical Setup (4-3-3 vs 4-3-3) ───────────────────
export const SPAIN_CROATIA_DEFAULT_ENTITIES: TrackingEntity[] = [
  // Spain (Home - Red) 4-3-3
  { id: 23, team: 'home', x: 0.08, y: 0.50, jerseyNumber: 23, speedKmh: 4.2 }, // Unai Simón (GK)
  { id: 2, team: 'home', x: 0.28, y: 0.16, jerseyNumber: 2, speedKmh: 14.5 },   // Dani Carvajal (RB)
  { id: 3, team: 'home', x: 0.22, y: 0.36, jerseyNumber: 3, speedKmh: 12.0 },   // Robin Le Normand (CB)
  { id: 4, team: 'home', x: 0.22, y: 0.64, jerseyNumber: 4, speedKmh: 11.8 },   // Nacho Fernández (CB)
  { id: 24, team: 'home', x: 0.28, y: 0.84, jerseyNumber: 24, speedKmh: 15.2 }, // Marc Cucurella (LB)
  { id: 16, team: 'home', x: 0.44, y: 0.50, jerseyNumber: 16, speedKmh: 16.8 }, // Rodri (DM)
  { id: 20, team: 'home', x: 0.54, y: 0.34, jerseyNumber: 20, speedKmh: 18.4 }, // Pedri (CM)
  { id: 8, team: 'home', x: 0.54, y: 0.66, jerseyNumber: 8, speedKmh: 17.5 },   // Fabián Ruiz (CM)
  { id: 19, team: 'home', x: 0.70, y: 0.24, jerseyNumber: 19, speedKmh: 24.8 }, // Lamine Yamal (RW)
  { id: 7, team: 'home', x: 0.76, y: 0.50, jerseyNumber: 7, speedKmh: 21.0 },   // Álvaro Morata (CF)
  { id: 17, team: 'home', x: 0.70, y: 0.76, jerseyNumber: 17, speedKmh: 23.5 }, // Nico Williams (LW)

  // Croatia (Away - Sky Blue/White) 4-3-3
  { id: 1, team: 'away', x: 0.92, y: 0.50, jerseyNumber: 1, speedKmh: 3.8 },    // Dominik Livaković (GK)
  { id: 22, team: 'away', x: 0.74, y: 0.20, jerseyNumber: 2, speedKmh: 14.0 },  // Josip Stanišić (RB)
  { id: 6, team: 'away', x: 0.78, y: 0.38, jerseyNumber: 6, speedKmh: 13.5 },   // Josip Šutalo (CB)
  { id: 33, team: 'away', x: 0.78, y: 0.62, jerseyNumber: 3, speedKmh: 12.8 },  // Marin Pongračić (CB)
  { id: 44, team: 'away', x: 0.72, y: 0.80, jerseyNumber: 4, speedKmh: 15.0 },  // Joško Gvardiol (LB)
  { id: 11, team: 'away', x: 0.58, y: 0.50, jerseyNumber: 11, speedKmh: 16.5 }, // Marcelo Brozović (DM)
  { id: 10, team: 'away', x: 0.48, y: 0.36, jerseyNumber: 10, speedKmh: 18.2 }, // Luka Modrić (CM)
  { id: 88, team: 'away', x: 0.48, y: 0.64, jerseyNumber: 8, speedKmh: 17.4 },  // Mateo Kovačić (CM)
  { id: 77, team: 'away', x: 0.42, y: 0.22, jerseyNumber: 7, speedKmh: 18.5 },  // Lovro Majer (RW)
  { id: 9, team: 'away', x: 0.38, y: 0.50, jerseyNumber: 9, speedKmh: 16.0 },    // Andrej Kramarić (CF)
  { id: 14, team: 'away', x: 0.42, y: 0.78, jerseyNumber: 14, speedKmh: 17.8 }, // Ante Budimir (LW)

  // Match Ball
  { id: 999, team: 'ball', x: 0.68, y: 0.28, speedKmh: 28.5 },
];

// ─── Manchester United vs Manchester City 11v11 Setup ───────────────────────
export const MUN_MCI_DEFAULT_ENTITIES: TrackingEntity[] = [
  // Man United (Home - Red) 3-2-4-1 Build-up
  { id: 1, team: 'home', x: 0.08, y: 0.50, jerseyNumber: 1, speedKmh: 4.2 },   // Onana
  { id: 20, team: 'home', x: 0.22, y: 0.24, jerseyNumber: 20, speedKmh: 12.1 }, // Dalot
  { id: 5, team: 'home', x: 0.20, y: 0.50, jerseyNumber: 5, speedKmh: 14.5 },   // Maguire
  { id: 6, team: 'home', x: 0.22, y: 0.76, jerseyNumber: 6, speedKmh: 11.8 },   // Martinez
  { id: 18, team: 'home', x: 0.38, y: 0.38, jerseyNumber: 18, speedKmh: 16.2 }, // Casemiro
  { id: 37, team: 'home', x: 0.38, y: 0.62, jerseyNumber: 37, speedKmh: 15.0 }, // Mainoo
  { id: 16, team: 'home', x: 0.62, y: 0.16, jerseyNumber: 16, speedKmh: 24.8 }, // Amad Diallo
  { id: 8, team: 'home', x: 0.58, y: 0.40, jerseyNumber: 8, speedKmh: 18.4 },   // Bruno Fernandes
  { id: 10, team: 'home', x: 0.58, y: 0.60, jerseyNumber: 10, speedKmh: 17.2 }, // Rashford
  { id: 17, team: 'home', x: 0.62, y: 0.84, jerseyNumber: 17, speedKmh: 23.5 }, // Garnacho
  { id: 9, team: 'home', x: 0.74, y: 0.50, jerseyNumber: 9, speedKmh: 19.8 },   // Hojlund

  // Man City (Away - Blue) 4-4-2 Mid-Block
  { id: 31, team: 'away', x: 0.92, y: 0.50, jerseyNumber: 31, speedKmh: 3.9 },  // Ederson
  { id: 82, team: 'away', x: 0.78, y: 0.20, jerseyNumber: 82, speedKmh: 14.2 }, // Lewis
  { id: 25, team: 'away', x: 0.76, y: 0.40, jerseyNumber: 25, speedKmh: 13.8 }, // Akanji
  { id: 3, team: 'away', x: 0.76, y: 0.60, jerseyNumber: 3, speedKmh: 12.9 },   // Dias
  { id: 24, team: 'away', x: 0.78, y: 0.80, jerseyNumber: 24, speedKmh: 15.1 }, // Gvardiol
  { id: 52, team: 'away', x: 0.55, y: 0.22, jerseyNumber: 52, speedKmh: 18.0 }, // Bobb
  { id: 8, team: 'away', x: 0.52, y: 0.42, jerseyNumber: 8, speedKmh: 17.5 },   // Kovacic
  { id: 17, team: 'away', x: 0.52, y: 0.58, jerseyNumber: 17, speedKmh: 16.8 }, // De Bruyne
  { id: 11, team: 'away', x: 0.55, y: 0.78, jerseyNumber: 11, speedKmh: 19.2 }, // Doku
  { id: 9, team: 'away', x: 0.42, y: 0.46, jerseyNumber: 9, speedKmh: 16.0 },   // Haaland
  { id: 20, team: 'away', x: 0.42, y: 0.54, jerseyNumber: 20, speedKmh: 15.5 }, // Bernardo Silva

  // Match Ball
  { id: 999, team: 'ball', x: 0.58, y: 0.40, speedKmh: 28.5 },
];

export const TacticalMinimap: React.FC<TacticalMinimapProps> = ({
  entities = [],
  selectedEntityId = null,
  onSelectEntity,
  className = '',
  homeCode = 'MUN',
  awayCode = 'MCI',
  homeName = 'Man United',
  awayName = 'Man City',
  homeColor = '#DA291C',
  awayColor = '#6CABDD',
  homePhase = '3-2-4-1 Build-up',
  awayPhase = '4-4-2 Mid-Block',
  statusBadge = 'DEMO SIMULATION',
  isLiveTracking = true,
  cameraFovQuad,
  sourceLabel = 'YOUTUBE',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPassingLanes, setShowPassingLanes] = useState(true);
  const [showConvexHull, setShowConvexHull] = useState(false);
  const [showTacticalZones, setShowTacticalZones] = useState(false);
  const [showCameraFOV, setShowCameraFOV] = useState(true);

  // Pick formation baseline matching match teams if none streamed yet
  const defaultEntities =
    homeCode === 'MUN' || awayCode === 'MCI'
      ? MUN_MCI_DEFAULT_ENTITIES
      : homeCode === 'ESP' || awayCode === 'CRO'
      ? SPAIN_CROATIA_DEFAULT_ENTITIES
      : MUN_MCI_DEFAULT_ENTITIES;

  const activeEntities = entities && entities.length > 0 ? entities : defaultEntities;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Pitch Surface (Authentic stadium pitch with rich grass contrast)
    ctx.fillStyle = '#0F2C1F';
    ctx.fillRect(0, 0, width, height);

    const pad = 12;
    const pW = width - pad * 2;
    const pH = height - pad * 2;

    // Grass alternating mowing stripes
    const stripeCount = 8;
    const sW = pW / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(0, 223, 89, 0.04)';
        ctx.fillRect(pad + i * sW, pad, sW, pH);
      }
    }

    // Optional: 18 FIFA Tactical Zones (Half-spaces, Zone 14)
    if (showTacticalZones) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical thirds
      const thirdW = pW / 3;
      ctx.strokeRect(pad + thirdW, pad, thirdW, pH);

      // Horizontal zones (Zone 14 highlight)
      const sixthW = pW / 6;
      const zone14X = pad + thirdW + sixthW * 0.5;
      const zone14Y = pad + pH * 0.3;
      const zone14W = sixthW;
      const zone14H = pH * 0.4;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)'; // Zone 14 amber tint
      ctx.fillRect(zone14X, zone14Y, zone14W, zone14H);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.strokeRect(zone14X, zone14Y, zone14W, zone14H);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('Z14', zone14X + 4, zone14Y + 12);

      ctx.setLineDash([]);
    }

    // 2. Pitch Line Markings (Crisp white lines with high legibility)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;

    // Pitch Outline
    ctx.strokeRect(pad, pad, pW, pH);

    // Halfway Line
    ctx.beginPath();
    ctx.moveTo(pad + pW / 2, pad);
    ctx.lineTo(pad + pW / 2, pad + pH);
    ctx.stroke();

    // Center Circle
    const radius = Math.min(pW, pH) * 0.18;
    ctx.beginPath();
    ctx.arc(pad + pW / 2, pad + pH / 2, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(pad + pW / 2, pad + pH / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Boxes & Six Yard Boxes
    const boxW = pW * 0.16;
    const boxH = pH * 0.52;
    const boxY = pad + (pH - boxH) / 2;
    ctx.strokeRect(pad, boxY, boxW, boxH);
    ctx.strokeRect(pad + pW - boxW, boxY, boxW, boxH);

    // Penalty Arcs
    ctx.beginPath();
    ctx.arc(pad + boxW, pad + pH / 2, radius * 0.65, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pad + pW - boxW, pad + pH / 2, radius * 0.65, Math.PI * 0.65, Math.PI * 1.35);
    ctx.stroke();

    // Corner Arcs
    const cArc = 6;
    ctx.beginPath();
    ctx.arc(pad, pad, cArc, 0, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pad, pad + pH, cArc, -Math.PI * 0.5, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pad + pW, pad, cArc, Math.PI * 0.5, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pad + pW, pad + pH, cArc, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    // 3. Separate Entities
    const homePlayers = activeEntities.filter((e) => e.team === 'home');
    const awayPlayers = activeEntities.filter((e) => e.team === 'away');
    const ball = activeEntities.find((e) => e.team === 'ball');

    // 4. Optional: Convex Hulls (Team Compactness Shape)
    if (showConvexHull) {
      const drawHull = (players: TrackingEntity[], strokeColor: string) => {
        if (players.length < 3) return;
        const cx = players.reduce((acc, p) => acc + p.x, 0) / players.length;
        const cy = players.reduce((acc, p) => acc + p.y, 0) / players.length;
        const sorted = [...players].sort((a, b) => {
          return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
        });

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        sorted.forEach((p, idx) => {
          const px = pad + p.x * pW;
          const py = pad + p.y * pH;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Home Hull
      drawHull(homePlayers, homeColor ? `${homeColor}99` : 'rgba(239, 1, 7, 0.6)');
      // Away Hull
      drawHull(awayPlayers, awayColor ? `${awayColor}99` : 'rgba(108, 171, 221, 0.6)');
    }

    // 5. Optional: Passing Lanes from ball possessor
    if (showPassingLanes && ball && homePlayers.length > 0) {
      // Find closest player to ball (either home or away)
      const allPlayers = [...homePlayers, ...awayPlayers];
      let closestPlayer = allPlayers[0];
      let minDist = 999;
      allPlayers.forEach((p) => {
        const d = Math.hypot(p.x - ball.x, p.y - ball.y);
        if (d < minDist) {
          minDist = d;
          closestPlayer = p;
        }
      });

      if (minDist < 0.24 && closestPlayer) {
        const possessorTeam = closestPlayer.team;
        const teammates = possessorTeam === 'home' ? homePlayers : awayPlayers;
        const fromX = pad + closestPlayer.x * pW;
        const fromY = pad + closestPlayer.y * pH;

        ctx.strokeStyle = '#00DF59';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);

        teammates.forEach((teammate) => {
          if (teammate.id !== closestPlayer.id) {
            const distToTeammate = Math.hypot(teammate.x - closestPlayer.x, teammate.y - closestPlayer.y);
            // Draw pass lanes to viable teammates within tactical passing distance
            if (distToTeammate < 0.45) {
              const toX = pad + teammate.x * pW;
              const toY = pad + teammate.y * pH;
              ctx.beginPath();
              ctx.moveTo(fromX, fromY);
              ctx.lineTo(toX, toY);
              ctx.stroke();
            }
          }
        });
        ctx.setLineDash([]);
      }
    }

    // 5.5 Optional: Broadcast Camera Field of View (FOV) Box / Frustum
    if (showCameraFOV) {
      ctx.save();
      if (cameraFovQuad && cameraFovQuad.length === 4) {
        // Render precise homography calibrated camera trapezoid/quad
        ctx.beginPath();
        cameraFovQuad.forEach((pt, i) => {
          const qx = pad + pt[0] * pW;
          const qy = pad + pt[1] * pH;
          if (i === 0) ctx.moveTo(qx, qy);
          else ctx.lineTo(qx, qy);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(206, 255, 0, 0.08)';
        ctx.fill();
        ctx.strokeStyle = '#CEFF00';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();

        const qx0 = pad + cameraFovQuad[0][0] * pW;
        const qy0 = pad + cameraFovQuad[0][1] * pH;
        ctx.fillStyle = '#CEFF00';
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.fillText(`CAM FOV (${sourceLabel})`, Math.max(pad + 4, qx0 + 4), Math.max(pad + 12, qy0 + 12));
      } else {
        // Focus FOV bounding box around active play / ball position
        const targetX = ball ? pad + ball.x * pW : pad + pW * 0.5;
        const targetY = ball ? pad + ball.y * pH : pad + pH * 0.5;
        const camW = pW * 0.40;
        const camH = pH * 0.48;
        const camX = Math.max(pad, Math.min(pad + pW - camW, targetX - camW / 2));
        const camY = Math.max(pad, Math.min(pad + pH - camH, targetY - camH / 2));

        ctx.fillStyle = 'rgba(206, 255, 0, 0.08)';
        ctx.fillRect(camX, camY, camW, camH);
        ctx.strokeStyle = '#CEFF00';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(camX, camY, camW, camH);

        ctx.fillStyle = '#CEFF00';
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.fillText(`CAM FOV (${sourceLabel})`, camX + 4, camY + 11);
      }
      ctx.restore();
    }

    // 6. Render Players & Ball
    activeEntities.forEach((ent) => {
      const px = pad + ent.x * pW;
      const py = pad + ent.y * pH;
      const isSelected = selectedEntityId === ent.id;

      if (ent.team === 'ball') {
        // Glowing match ball
        ctx.shadowColor = '#00DF59';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00DF59';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        const isHome = ent.team === 'home';
        const teamColor = isHome ? homeColor : awayColor;

        // Selection Target Ring
        if (isSelected) {
          ctx.strokeStyle = '#00DF59';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Player Circle
        ctx.fillStyle = teamColor;
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Jersey Number inside
        if (ent.jerseyNumber !== undefined && ent.jerseyNumber !== null) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 6px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(ent.jerseyNumber), px, py);
        }
      }
    });
  }, [
    activeEntities,
    showPassingLanes,
    showConvexHull,
    showTacticalZones,
    showCameraFOV,
    selectedEntityId,
    homeColor,
    awayColor,
    cameraFovQuad,
    sourceLabel,
  ]);

  const homeCount = activeEntities.filter((e) => e.team === 'home').length;
  const awayCount = activeEntities.filter((e) => e.team === 'away').length;
  const ballEntity = activeEntities.find((e) => e.team === 'ball');

  return (
    <div className={`p-4 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl space-y-3 shadow-xs transition-colors ${className}`}>
      {/* Header with FIFA Specs & Active Tracker Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3">
        <div className="flex items-center gap-2">
          <Compass size={15} className="text-slate-900 dark:text-zinc-100" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            2D Tactical Radar
          </span>
          <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
            isLiveTracking
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          }`}>
            {statusBadge || (isLiveTracking ? 'YOLOv8 TRACKING' : 'DEMO SIMULATION')}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] px-2 py-0.5 rounded">
          105m × 68m Planar
        </span>
      </div>

      {/* Dynamic Tactical Phase Indicator for Active Match */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-50 dark:bg-[#18181C] p-2 rounded-lg border border-slate-200/80 dark:border-[#27272A]">
        <div className="flex items-center gap-1.5" style={{ color: homeColor }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: homeColor }} />
          <span className="font-bold">{homeCode}: {homePhase}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: awayColor }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: awayColor }} />
          <span className="font-bold">{awayCode}: {awayPhase}</span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full aspect-[105/68] rounded-xl overflow-hidden border border-slate-200 dark:border-[#27272A] shadow-inner bg-[#0B1510]">
        <canvas
          ref={canvasRef}
          width={360}
          height={233}
          className="w-full h-full object-cover cursor-crosshair"
          onClick={(e) => {
            if (!onSelectEntity || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) / rect.width;
            const clickY = (e.clientY - rect.top) / rect.height;

            // Find closest entity within click radius
            let selectedId: number | null = null;
            let minDist = 0.08;
            for (const ent of activeEntities) {
              const d = Math.hypot(ent.x - clickX, ent.y - clickY);
              if (d < minDist) {
                minDist = d;
                selectedId = ent.id;
              }
            }
            onSelectEntity(selectedId);
          }}
        />
      </div>

      {/* Visual Layer Toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
        <button
          onClick={() => setShowCameraFOV(!showCameraFOV)}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            showCameraFOV
              ? 'bg-[#CEFF00] text-black shadow-xs font-bold'
              : 'bg-[#18181C] text-zinc-400 border border-[#27272A] hover:text-white'
          }`}
          title="Toggle Broadcast Camera Viewport Box (FOV)"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showCameraFOV ? 'bg-black' : 'bg-zinc-500'}`} />
          <span>Cam FOV</span>
        </button>

        <button
          onClick={() => setShowPassingLanes(!showPassingLanes)}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            showPassingLanes
              ? 'bg-[#CEFF00] text-black shadow-xs font-bold'
              : 'bg-[#18181C] text-zinc-400 border border-[#27272A] hover:text-white'
          }`}
          title="Toggle Passing Lanes"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showPassingLanes ? 'bg-black' : 'bg-zinc-500'}`} />
          <span>Pass Lanes</span>
        </button>

        <button
          onClick={() => setShowConvexHull(!showConvexHull)}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            showConvexHull
              ? 'bg-[#CEFF00] text-black shadow-xs font-bold'
              : 'bg-[#18181C] text-zinc-400 border border-[#27272A] hover:text-white'
          }`}
          title="Toggle Team Shape Convex Hull"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showConvexHull ? 'bg-black' : 'bg-zinc-500'}`} />
          <span>Shapes</span>
        </button>

        <button
          onClick={() => setShowTacticalZones(!showTacticalZones)}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            showTacticalZones
              ? 'bg-[#CEFF00] text-black shadow-xs font-bold'
              : 'bg-[#18181C] text-zinc-400 border border-[#27272A] hover:text-white'
          }`}
          title="Toggle 18 Tactical Zones & Zone 14"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showTacticalZones ? 'bg-black' : 'bg-zinc-500'}`} />
          <span>Zone 14</span>
        </button>
      </div>

      {/* Dynamic Team Legend */}
      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-[#27272A]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: homeColor }} />
          <span>{homeName} ({homeCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: awayColor }} />
          <span>{awayName} ({awayCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Ball ({ballEntity?.speedKmh ? `${Math.round(ballEntity.speedKmh)} km/h` : 'sim'})</span>
        </div>
      </div>
    </div>
  );
};
