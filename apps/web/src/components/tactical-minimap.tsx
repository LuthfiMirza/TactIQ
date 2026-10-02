'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { TrackingEntity, TacticalMetricsDTO } from '@tactiq/shared-types';
import { Compass, Shield, Maximize2, Layers, Gauge, Activity } from 'lucide-react';
import { calculateTacticalMetrics } from '@/lib/tactical-600-sequence';

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
  { id: 99, team: 'ball', x: 0.54, y: 0.46, speedKmh: 28.5 },
];

export const DEFAULT_FORMATION_ENTITIES = MUN_MCI_DEFAULT_ENTITIES;

export const TacticalMinimap: React.FC<TacticalMinimapProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  className = '',
  homeCode = 'MUN',
  awayCode = 'MCI',
  homeName = 'Man United',
  awayName = 'Man City',
  homeColor = '#DA291C',
  awayColor = '#6CABDD',
  homePhase = 'Build-up 3-2-4-1',
  awayPhase = 'Mid-Block 4-4-2',
  statusBadge,
  isLiveTracking = false,
  cameraFovQuad,
  sourceLabel = 'Broadcast Master',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPassingLanes, setShowPassingLanes] = useState<boolean>(true);
  const [showConvexHull, setShowConvexHull] = useState<boolean>(true);
  const [showTacticalZones, setShowTacticalZones] = useState<boolean>(false);
  const [showCameraFOV, setShowCameraFOV] = useState<boolean>(true);
  const [showDefensiveLine, setShowDefensiveLine] = useState<boolean>(true);

  // Fall back to default formation entities if none streamed yet
  const activeEntities = entities && entities.length > 0 ? entities : DEFAULT_FORMATION_ENTITIES;

  // Compute live tactical kinematics
  const metrics: TacticalMetricsDTO = calculateTacticalMetrics(activeEntities);

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

    // Outer Pitch Boundary
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, pW, pH);

    // Halfway Line
    ctx.beginPath();
    ctx.moveTo(pad + pW / 2, pad);
    ctx.lineTo(pad + pW / 2, pad + pH);
    ctx.stroke();

    // Center Circle & Spot
    ctx.beginPath();
    ctx.arc(pad + pW / 2, pad + pH / 2, pH * 0.18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(pad + pW / 2, pad + pH / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Areas (16.5m box)
    const penW = pW * 0.165;
    const penH = pH * 0.58;
    const penY = pad + (pH - penH) / 2;

    // Left Penalty Box (Home)
    ctx.strokeRect(pad, penY, penW, penH);
    // Left Goal Area (6-yard box)
    ctx.strokeRect(pad, pad + (pH - penH * 0.45) / 2, penW * 0.35, penH * 0.45);
    // Left Penalty Spot
    ctx.beginPath();
    ctx.arc(pad + penW * 0.65, pad + pH / 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Right Penalty Box (Away)
    ctx.strokeRect(pad + pW - penW, penY, penW, penH);
    // Right Goal Area (6-yard box)
    ctx.strokeRect(pad + pW - penW * 0.35, pad + (pH - penH * 0.45) / 2, penW * 0.35, penH * 0.45);
    // Right Penalty Spot
    ctx.beginPath();
    ctx.arc(pad + pW - penW * 0.65, pad + pH / 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Optional: 18 Tactical Zones Grid (Guardiola/Juego de Posición Grid)
    if (showTacticalZones) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // 6 columns across pitch
      for (let col = 1; col < 6; col++) {
        const zx = pad + (pW / 6) * col;
        ctx.beginPath();
        ctx.moveTo(zx, pad);
        ctx.lineTo(zx, pad + pH);
        ctx.stroke();
      }

      // 3 horizontal corridors (Wings & Half-spaces/Center)
      const h3 = pH / 3;
      ctx.beginPath();
      ctx.moveTo(pad, pad + h3);
      ctx.lineTo(pad + pW, pad + h3);
      ctx.moveTo(pad, pad + h3 * 2);
      ctx.lineTo(pad + pW, pad + h3 * 2);
      ctx.stroke();

      // Highlight Zone 14 (Golden Attacking Box in front of penalty box)
      const z14X = pad + (pW / 6) * 3;
      const z14W = pW / 6;
      ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
      ctx.fillRect(z14X, pad + h3, z14W, h3);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
      ctx.strokeRect(z14X, pad + h3, z14W, h3);

      ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('ZONE 14', z14X + 4, pad + h3 + 12);
      ctx.restore();
    }

    const homePlayers = activeEntities.filter((e) => e.team === 'home');
    const awayPlayers = activeEntities.filter((e) => e.team === 'away');
    const ball = activeEntities.find((e) => e.team === 'ball');

    // 5. Defensive Line Height Visualization (Modern Tactical Kinematics)
    if (showDefensiveLine) {
      // Home Defensive Line
      const homeDefLineX = pad + (metrics.homeDefensiveLineMeters / 105.0) * pW;
      ctx.save();
      ctx.strokeStyle = homeColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(homeDefLineX, pad);
      ctx.lineTo(homeDefLineX, pad + pH);
      ctx.stroke();

      ctx.fillStyle = homeColor;
      ctx.font = 'bold 7.5px monospace';
      ctx.fillText(`${homeCode} DEF ${metrics.homeDefensiveLineMeters}m`, homeDefLineX + 3, pad + 10);
      ctx.restore();

      // Away Defensive Line
      const awayDefLineX = pad + (1.0 - (metrics.awayDefensiveLineMeters / 105.0)) * pW;
      ctx.save();
      ctx.strokeStyle = awayColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(awayDefLineX, pad);
      ctx.lineTo(awayDefLineX, pad + pH);
      ctx.stroke();

      ctx.fillStyle = awayColor;
      ctx.font = 'bold 7.5px monospace';
      ctx.fillText(`${awayCode} DEF ${metrics.awayDefensiveLineMeters}m`, awayDefLineX - 65, pad + 10);
      ctx.restore();
    }

    // 6. Convex Hull / Team Tactical Shape Visualization
    if (showConvexHull) {
      const drawHull = (players: TrackingEntity[], strokeCol: string, fillCol: string) => {
        if (players.length < 3) return;
        const pts = players.map((p) => ({
          x: pad + p.x * pW,
          y: pad + p.y * pH,
        }));

        pts.sort((a, b) => a.x - b.x || a.y - b.y);
        const lower: { x: number; y: number }[] = [];
        for (const p of pts) {
          while (
            lower.length >= 2 &&
            (lower[lower.length - 1].x - lower[lower.length - 2].x) * (p.y - lower[lower.length - 2].y) -
              (lower[lower.length - 1].y - lower[lower.length - 2].y) * (p.x - lower[lower.length - 2].x) <=
              0
          ) {
            lower.pop();
          }
          lower.push(p);
        }
        const upper: { x: number; y: number }[] = [];
        for (let i = pts.length - 1; i >= 0; i--) {
          const p = pts[i];
          while (
            upper.length >= 2 &&
            (upper[upper.length - 1].x - upper[upper.length - 2].x) * (p.y - upper[upper.length - 2].y) -
              (upper[upper.length - 1].y - upper[upper.length - 2].y) * (p.x - upper[upper.length - 2].x) <=
              0
          ) {
            upper.pop();
          }
          upper.push(p);
        }
        upper.pop();
        lower.pop();
        const hull = lower.concat(upper);

        ctx.save();
        ctx.beginPath();
        hull.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = fillCol;
        ctx.fill();
        ctx.restore();
      };

      // Home Hull
      drawHull(homePlayers, `${homeColor}CC`, `${homeColor}22`);
      // Away Hull
      drawHull(awayPlayers, `${awayColor}CC`, `${awayColor}22`);
    }

    // 7. Passing Lanes from closest player to ball
    if (showPassingLanes && ball && (homePlayers.length > 0 || awayPlayers.length > 0)) {
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

        ctx.save();
        ctx.strokeStyle = '#00DF59';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);

        teammates.forEach((teammate) => {
          if (teammate.id !== closestPlayer.id) {
            const distToTeammate = Math.hypot(teammate.x - closestPlayer.x, teammate.y - closestPlayer.y);
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
        ctx.restore();
      }
    }

    // 8. Broadcast Camera Field of View (FOV) Box
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
        ctx.strokeStyle = '#CEFF00';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.fillStyle = 'rgba(206, 255, 0, 0.07)';
        ctx.fill();

        // Label
        const labelX = pad + cameraFovQuad[0][0] * pW;
        const labelY = Math.max(pad + 12, pad + cameraFovQuad[0][1] * pH - 4);
        ctx.fillStyle = '#CEFF00';
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText(`CAM FOV [${sourceLabel}]`, labelX + 2, labelY);
      } else if (ball) {
        const camW = pW * 0.38;
        const camH = pH * 0.46;
        const targetX = pad + ball.x * pW;
        const targetY = pad + ball.y * pH;
        const camX = Math.max(pad, Math.min(pad + pW - camW, targetX - camW / 2));
        const camY = Math.max(pad, Math.min(pad + pH - camH, targetY - camH / 2));

        ctx.strokeStyle = 'rgba(206, 255, 0, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(camX, camY, camW, camH);
        ctx.fillStyle = 'rgba(206, 255, 0, 0.05)';
        ctx.fillRect(camX, camY, camW, camH);

        ctx.fillStyle = '#CEFF00';
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText('CAM FOV (est)', camX + 4, camY + 9);
      }
      ctx.restore();
    }

    // 9. Draw Players and Match Ball
    activeEntities.forEach((ent) => {
      const px = pad + ent.x * pW;
      const py = pad + ent.y * pH;
      const isSelected = ent.id === selectedEntityId;

      if (ent.team === 'ball') {
        // Ball: Glowing Amber Core
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        const isHome = ent.team === 'home';
        const teamColor = isHome ? homeColor : awayColor;

        // Selection Target Ring
        if (isSelected) {
          ctx.strokeStyle = '#CEFF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 8.5, 0, Math.PI * 2);
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
    showDefensiveLine,
    selectedEntityId,
    metrics,
    homeColor,
    awayColor,
    cameraFovQuad,
    sourceLabel,
    homeCode,
    awayCode,
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

      {/* Visual Layer Toggles (Cam FOV, Pass Lanes, Shapes, Def Line, Zone 14) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
        <button
          onClick={() => setShowCameraFOV(!showCameraFOV)}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            showCameraFOV
              ? 'bg-[#CEFF00] text-black shadow-xs font-bold'
              : 'bg-[#18181C] text-zinc-400 border border-[#27272A] hover:text-white'
          }`}
          title="Toggle Broadcast Camera Viewport Box (FOV)"
        >
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
          <span>Shapes</span>
        </button>

        <button
          onClick={() => setShowDefensiveLine(!showDefensiveLine)}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            showDefensiveLine
              ? 'bg-[#CEFF00] text-black shadow-xs font-bold'
              : 'bg-[#18181C] text-zinc-400 border border-[#27272A] hover:text-white'
          }`}
          title="Toggle Defensive Line Height Markers"
        >
          <span>Def Line</span>
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
          <span>Zone 14</span>
        </button>
      </div>

      {/* ── Real-Time Tactical Kinematics Card (Defensive Line, Compactness, Inter-line) ── */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-[#27272A] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-800 dark:text-zinc-200">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className="text-[#CEFF00]" />
            <span>REAL-TIME KINEMATICS</span>
          </div>
          <span className="text-[9px] text-zinc-400 font-normal">10 FPS Planar</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          {/* 1. Defensive Line */}
          <div className="p-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A]">
            <span className="text-[9px] text-zinc-400 block truncate">Def Line (m)</span>
            <div className="text-[11px] font-extrabold mt-0.5 flex items-center justify-center gap-1">
              <span style={{ color: homeColor }}>{metrics.homeDefensiveLineMeters}m</span>
              <span className="text-zinc-600">/</span>
              <span style={{ color: awayColor }}>{metrics.awayDefensiveLineMeters}m</span>
            </div>
          </div>

          {/* 2. Compactness Area */}
          <div className="p-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A]">
            <span className="text-[9px] text-zinc-400 block truncate">Hull Area (m²)</span>
            <div className="text-[11px] font-extrabold mt-0.5 flex items-center justify-center gap-1">
              <span style={{ color: homeColor }}>{metrics.homeCompactnessAreaM2}</span>
              <span className="text-zinc-600">/</span>
              <span style={{ color: awayColor }}>{metrics.awayCompactnessAreaM2}</span>
            </div>
          </div>

          {/* 3. Inter-line Distance */}
          <div className="p-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A]">
            <span className="text-[9px] text-zinc-400 block truncate">Inter-line (m)</span>
            <div className="text-[11px] font-extrabold mt-0.5 flex items-center justify-center gap-1">
              <span style={{ color: homeColor }}>{metrics.homeInterLineDistanceMeters}m</span>
              <span className="text-zinc-600">/</span>
              <span style={{ color: awayColor }}>{metrics.awayInterLineDistanceMeters}m</span>
            </div>
          </div>
        </div>
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
