'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { TrackingEntity, TacticalMetricsDTO } from '@tactiq/shared-types';
import { Compass, Shield, Maximize2, Layers, Gauge, Activity } from 'lucide-react';
import { calculateTacticalMetrics } from '@/lib/tactical-600-sequence';

interface TacticalMinimapProps {
  entities?: TrackingEntity[];
  selectedEntityId?: number | null;
  onSelectEntity?: (id: number | null) => void;
  className?: string;
}

// ─── Default 11v11 Tactical Formation (MUN 3-2-4-1 vs MCI 4-4-2) ───────────
const DEFAULT_FORMATION_ENTITIES: TrackingEntity[] = [
  // Man United (Home - Red 3-2-4-1)
  { id: 1, team: 'home', x: 0.08, y: 0.50, jerseyNumber: 1, speedKmh: 4.2 },
  { id: 4, team: 'home', x: 0.22, y: 0.24, jerseyNumber: 4, speedKmh: 12.1 },
  { id: 5, team: 'home', x: 0.20, y: 0.50, jerseyNumber: 5, speedKmh: 14.5 },
  { id: 6, team: 'home', x: 0.22, y: 0.76, jerseyNumber: 6, speedKmh: 11.8 },
  { id: 20, team: 'home', x: 0.36, y: 0.16, jerseyNumber: 20, speedKmh: 17.5 },
  { id: 18, team: 'home', x: 0.36, y: 0.44, jerseyNumber: 18, speedKmh: 16.2 },
  { id: 37, team: 'home', x: 0.38, y: 0.62, jerseyNumber: 37, speedKmh: 15.0 },
  { id: 16, team: 'home', x: 0.58, y: 0.18, jerseyNumber: 16, speedKmh: 24.8 },
  { id: 8, team: 'home', x: 0.54, y: 0.46, jerseyNumber: 8, speedKmh: 18.4 },
  { id: 17, team: 'home', x: 0.60, y: 0.82, jerseyNumber: 17, speedKmh: 23.5 },
  { id: 7, team: 'home', x: 0.68, y: 0.50, jerseyNumber: 7, speedKmh: 19.8 },

  // Man City (Away - Sky Blue 4-4-2)
  { id: 31, team: 'away', x: 0.92, y: 0.50, jerseyNumber: 31, speedKmh: 3.9 },
  { id: 82, team: 'away', x: 0.78, y: 0.20, jerseyNumber: 82, speedKmh: 14.2 },
  { id: 25, team: 'away', x: 0.75, y: 0.40, jerseyNumber: 25, speedKmh: 13.8 },
  { id: 3, team: 'away', x: 0.75, y: 0.60, jerseyNumber: 3, speedKmh: 12.9 },
  { id: 24, team: 'away', x: 0.78, y: 0.80, jerseyNumber: 24, speedKmh: 15.1 },
  { id: 8, team: 'away', x: 0.58, y: 0.38, jerseyNumber: 8, speedKmh: 18.0 },
  { id: 75, team: 'away', x: 0.58, y: 0.62, jerseyNumber: 75, speedKmh: 17.5 },
  { id: 52, team: 'away', x: 0.52, y: 0.20, jerseyNumber: 52, speedKmh: 16.8 },
  { id: 87, team: 'away', x: 0.50, y: 0.44, jerseyNumber: 87, speedKmh: 19.2 },
  { id: 20, team: 'away', x: 0.52, y: 0.80, jerseyNumber: 20, speedKmh: 16.0 },
  { id: 9, team: 'away', x: 0.42, y: 0.50, jerseyNumber: 9, speedKmh: 15.5 },

  // Match Ball
  { id: 99, team: 'ball', x: 0.54, y: 0.46, speedKmh: 28.5 },
];

export const TacticalMinimap: React.FC<TacticalMinimapProps> = ({
  entities = [],
  selectedEntityId = null,
  onSelectEntity,
  className = '',
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

    // Grass alternating mowing stripes
    const stripeCount = 8;
    const sW = pW / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(0, 223, 89, 0.04)';
        ctx.fillRect(pad + i * sW, pad, sW, pH);
      }
    }

    // 2. Optional: 18 FIFA Tactical Zones & Zone 14 Highlight
    if (showTacticalZones) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical thirds
      const thirdW = pW / 3;
      ctx.strokeRect(pad + thirdW, pad, thirdW, pH);

      // Horizontal zones (Zone 14 amber highlight)
      const sixthW = pW / 6;
      const zone14X = pad + thirdW + sixthW * 0.5;
      const zone14Y = pad + pH * 0.3;
      const zone14W = sixthW;
      const zone14H = pH * 0.4;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(zone14X, zone14Y, zone14W, zone14H);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.strokeRect(zone14X, zone14Y, zone14W, zone14H);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('Z14', zone14X + 4, zone14Y + 12);

      ctx.setLineDash([]);
    }

    // 3. Pitch Line Markings (Crisp white lines with high legibility)
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

    // 4. Separate Entities
    const homePlayers = activeEntities.filter((e) => e.team === 'home');
    const awayPlayers = activeEntities.filter((e) => e.team === 'away');
    const ball = activeEntities.find((e) => e.team === 'ball');

    // 5. Defensive Line Height Visualization (Modern Tactical Kinematics)
    if (showDefensiveLine) {
      // Home Defensive Line (Red dashed line across pitch)
      const homeDefLineX = pad + (metrics.homeDefensiveLineMeters / 105.0) * pW;
      ctx.save();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(homeDefLineX, pad);
      ctx.lineTo(homeDefLineX, pad + pH);
      ctx.stroke();

      // Label at top
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 7.5px monospace';
      ctx.fillText(`MUN DEF ${metrics.homeDefensiveLineMeters}m`, homeDefLineX + 3, pad + 10);
      ctx.restore();

      // Away Defensive Line (Sky Blue dashed line across pitch)
      const awayDefLineX = pad + (1.0 - (metrics.awayDefensiveLineMeters / 105.0)) * pW;
      ctx.save();
      ctx.strokeStyle = '#6CABDD';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(awayDefLineX, pad);
      ctx.lineTo(awayDefLineX, pad + pH);
      ctx.stroke();

      // Label at bottom
      ctx.fillStyle = '#6CABDD';
      ctx.font = 'bold 7.5px monospace';
      ctx.fillText(`MCI DEF ${metrics.awayDefensiveLineMeters}m`, awayDefLineX - 68, pad + pH - 5);
      ctx.restore();
    }

    // 6. Convex Hulls (Team Compactness Shape & Shaded Area)
    if (showConvexHull) {
      const drawHullWithFill = (
        players: TrackingEntity[],
        strokeColor: string,
        fillColor: string,
        areaM2: number,
        tagPrefix: string
      ) => {
        const outfield = players.filter((p) => p.jerseyNumber !== 1 && p.jerseyNumber !== 31);
        if (outfield.length < 3) return;
        const cx = outfield.reduce((acc, p) => acc + p.x, 0) / outfield.length;
        const cy = outfield.reduce((acc, p) => acc + p.y, 0) / outfield.length;
        const sorted = [...outfield].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

        ctx.save();
        ctx.fillStyle = fillColor;
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
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Area badge at centroid
        const tagX = pad + cx * pW;
        const tagY = pad + cy * pH;
        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 7px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${tagPrefix} ${areaM2}m²`, tagX, tagY);
        ctx.restore();
      };

      // Man United Hull: Crimson Translucent Polygon
      drawHullWithFill(
        homePlayers,
        'rgba(239, 1, 7, 0.8)',
        'rgba(239, 1, 7, 0.12)',
        metrics.homeCompactnessAreaM2,
        'MUN'
      );

      // Man City Hull: Sky Blue Translucent Polygon
      drawHullWithFill(
        awayPlayers,
        'rgba(108, 171, 221, 0.8)',
        'rgba(108, 171, 221, 0.12)',
        metrics.awayCompactnessAreaM2,
        'MCI'
      );
    }

    // 7. Passing Lanes from closest player to ball
    if (showPassingLanes && ball && homePlayers.length > 0) {
      let closestPlayer = homePlayers[0];
      let minDist = 999;
      homePlayers.forEach((p) => {
        const d = Math.hypot(p.x - ball.x, p.y - ball.y);
        if (d < minDist) {
          minDist = d;
          closestPlayer = p;
        }
      });

      if (minDist < 0.22) {
        const fromX = pad + closestPlayer.x * pW;
        const fromY = pad + closestPlayer.y * pH;

        ctx.strokeStyle = 'rgba(0, 223, 89, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        homePlayers.forEach((teammate) => {
          if (teammate.id !== closestPlayer.id) {
            const toX = pad + teammate.x * pW;
            const toY = pad + teammate.y * pH;
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
          }
        });
        ctx.setLineDash([]);
      }
    }

    // 8. Broadcast Camera Field of View (FOV) Box
    if (showCameraFOV && ball) {
      const camW = pW * 0.36;
      const camH = pH * 0.44;
      const targetX = pad + ball.x * pW;
      const targetY = pad + ball.y * pH;
      const camX = Math.max(pad, Math.min(pad + pW - camW, targetX - camW / 2));
      const camY = Math.max(pad, Math.min(pad + pH - camH, targetY - camH / 2));

      ctx.save();
      ctx.fillStyle = 'rgba(206, 255, 0, 0.08)';
      ctx.fillRect(camX, camY, camW, camH);
      ctx.strokeStyle = '#CEFF00';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(camX, camY, camW, camH);

      // Label inside camera bounding frustum
      ctx.fillStyle = '#CEFF00';
      ctx.font = 'bold 8px JetBrains Mono, monospace';
      ctx.fillText('CAM FOV (YOUTUBE)', camX + 4, camY + 11);
      ctx.restore();
    }

    // 9. Render 11v11 Players & Ball
    activeEntities.forEach((ent) => {
      const px = pad + ent.x * pW;
      const py = pad + ent.y * pH;
      const isSelected = selectedEntityId === ent.id;

      if (ent.team === 'ball') {
        // Glowing match ball
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        const isHome = ent.team === 'home';
        const teamColor = isHome ? '#DA291C' : '#6CABDD';

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
        if (ent.jerseyNumber) {
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
  ]);

  return (
    <div className={`p-4 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl space-y-3.5 shadow-xs transition-colors ${className}`}>
      
      {/* Header with FIFA Specs & Tactical Phase */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3">
        <div className="flex items-center gap-2">
          <Compass size={15} className="text-slate-900 dark:text-zinc-100" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            2D Tactical Radar
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#CEFF00]/15 border border-[#CEFF00]/30 text-[#CEFF00] font-mono text-[9px] font-bold">
            11v11 CANONICAL
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] px-2 py-0.5 rounded">
          105m × 68m Planar
        </span>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-50 dark:bg-[#18181C] p-2 rounded-lg border border-slate-200/80 dark:border-[#27272A]">
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <span className="w-2 h-2 rounded-full bg-[#DA291C]" />
          <span className="font-bold">MUN: 3-2-4-1 Build-up</span>
        </div>
        <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
          <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
          <span className="font-bold">MCI: 4-4-2 Mid-Block</span>
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
          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[9.5px] font-mono transition-colors ${
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
          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[9.5px] font-mono transition-colors ${
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
          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[9.5px] font-mono transition-colors ${
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
          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[9.5px] font-mono transition-colors ${
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
          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[9.5px] font-mono transition-colors ${
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
              <span className="text-red-400">{metrics.homeDefensiveLineMeters}m</span>
              <span className="text-zinc-600">/</span>
              <span className="text-sky-400">{metrics.awayDefensiveLineMeters}m</span>
            </div>
          </div>

          {/* 2. Compactness Area */}
          <div className="p-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A]">
            <span className="text-[9px] text-zinc-400 block truncate">Hull Area (m²)</span>
            <div className="text-[11px] font-extrabold mt-0.5 flex items-center justify-center gap-1">
              <span className="text-red-400">{metrics.homeCompactnessAreaM2}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-sky-400">{metrics.awayCompactnessAreaM2}</span>
            </div>
          </div>

          {/* 3. Inter-line Distance */}
          <div className="p-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A]">
            <span className="text-[9px] text-zinc-400 block truncate">Inter-line (m)</span>
            <div className="text-[11px] font-extrabold mt-0.5 flex items-center justify-center gap-1">
              <span className="text-red-400">{metrics.homeInterLineDistanceMeters}m</span>
              <span className="text-zinc-600">/</span>
              <span className="text-sky-400">{metrics.awayInterLineDistanceMeters}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5 text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-[#27272A]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#DA291C]" />
          <span>Man United (11)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
          <span>Man City (11)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Nike Ball</span>
        </div>
      </div>

    </div>
  );
};
