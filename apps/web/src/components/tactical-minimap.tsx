'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { TrackingEntity } from '@tactiq/shared-types';
import { Compass, Eye, Shield, Share2, Grid3X3 } from 'lucide-react';

interface TacticalMinimapProps {
  entities?: TrackingEntity[];
  selectedEntityId?: number | null;
  onSelectEntity?: (id: number | null) => void;
  className?: string;
}

// ─── Default Tactical Formation Entities (ARS 3-2-4-1 vs MCI 4-4-2) ──────
const DEFAULT_FORMATION_ENTITIES: TrackingEntity[] = [
  // Arsenal (Home - Red)
  { id: 1, team: 'home', x: 0.08, y: 0.50, jerseyNumber: 1, speedKmh: 4.2 },
  { id: 4, team: 'home', x: 0.22, y: 0.24, jerseyNumber: 4, speedKmh: 12.1 },
  { id: 2, team: 'home', x: 0.20, y: 0.50, jerseyNumber: 2, speedKmh: 14.5 },
  { id: 6, team: 'home', x: 0.22, y: 0.76, jerseyNumber: 6, speedKmh: 11.8 },
  { id: 41, team: 'home', x: 0.38, y: 0.38, jerseyNumber: 41, speedKmh: 16.2 },
  { id: 5, team: 'home', x: 0.38, y: 0.62, jerseyNumber: 5, speedKmh: 15.0 },
  { id: 7, team: 'home', x: 0.62, y: 0.16, jerseyNumber: 7, speedKmh: 24.8 },
  { id: 8, team: 'home', x: 0.58, y: 0.40, jerseyNumber: 8, speedKmh: 18.4 },
  { id: 29, team: 'home', x: 0.58, y: 0.60, jerseyNumber: 29, speedKmh: 17.2 },
  { id: 11, team: 'home', x: 0.62, y: 0.84, jerseyNumber: 11, speedKmh: 23.5 },
  { id: 19, team: 'home', x: 0.74, y: 0.50, jerseyNumber: 9, speedKmh: 19.8 },

  // Man City (Away - Blue)
  { id: 31, team: 'away', x: 0.92, y: 0.50, jerseyNumber: 31, speedKmh: 3.9 },
  { id: 25, team: 'away', x: 0.78, y: 0.20, jerseyNumber: 25, speedKmh: 14.2 },
  { id: 3, team: 'away', x: 0.76, y: 0.40, jerseyNumber: 3, speedKmh: 13.8 },
  { id: 14, team: 'away', x: 0.76, y: 0.60, jerseyNumber: 14, speedKmh: 12.9 },
  { id: 24, team: 'away', x: 0.78, y: 0.80, jerseyNumber: 24, speedKmh: 15.1 },
  { id: 20, team: 'away', x: 0.55, y: 0.22, jerseyNumber: 20, speedKmh: 18.0 },
  { id: 16, team: 'away', x: 0.52, y: 0.42, jerseyNumber: 16, speedKmh: 17.5 },
  { id: 17, team: 'away', x: 0.52, y: 0.58, jerseyNumber: 17, speedKmh: 16.8 },
  { id: 47, team: 'away', x: 0.55, y: 0.78, jerseyNumber: 47, speedKmh: 19.2 },
  { id: 9, team: 'away', x: 0.42, y: 0.46, jerseyNumber: 9, speedKmh: 16.0 },
  { id: 199, team: 'away', x: 0.42, y: 0.54, jerseyNumber: 19, speedKmh: 15.5 },

  // Match Ball
  { id: 999, team: 'ball', x: 0.58, y: 0.40, speedKmh: 28.5 },
];

export const TacticalMinimap: React.FC<TacticalMinimapProps> = ({
  entities = [],
  selectedEntityId = null,
  onSelectEntity,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPassingLanes, setShowPassingLanes] = useState(true);
  const [showConvexHull, setShowConvexHull] = useState(false);
  const [showTacticalZones, setShowTacticalZones] = useState(false);

  // Fall back to default formation entities if none streamed yet
  const activeEntities = entities && entities.length > 0 ? entities : DEFAULT_FORMATION_ENTITIES;

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

      // Arsenal (Home) Hull: Crimson Outline Only
      drawHull(homePlayers, 'rgba(239, 1, 7, 0.6)');
      // Man City (Away) Hull: Sky Blue Outline Only
      drawHull(awayPlayers, 'rgba(108, 171, 221, 0.6)');
    }

    // 5. Optional: Passing Lanes from ball possessor
    if (showPassingLanes && ball && homePlayers.length > 0) {
      // Find closest player to ball
      let closestPlayer = homePlayers[0];
      let minDist = 999;
      homePlayers.forEach((p) => {
        const d = Math.hypot(p.x - ball.x, p.y - ball.y);
        if (d < minDist) {
          minDist = d;
          closestPlayer = p;
        }
      });

      if (minDist < 0.18) {
        const fromX = pad + closestPlayer.x * pW;
        const fromY = pad + closestPlayer.y * pH;

        ctx.strokeStyle = 'rgba(0, 223, 89, 0.5)';
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
        const teamColor = isHome ? '#EF0107' : '#6CABDD';

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
        if (ent.jerseyNumber) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 6px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(ent.jerseyNumber), px, py);
        }
      }
    });
  }, [entities, showPassingLanes, showConvexHull, showTacticalZones, selectedEntityId]);

  return (
    <div className={`p-4 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl space-y-3 shadow-xs transition-colors ${className}`}>
      {/* Header with FIFA Specs & Tactical Phase */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3">
        <div className="flex items-center gap-2">
          <Compass size={15} className="text-slate-900 dark:text-zinc-100" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            2D Tactical Radar
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] px-2 py-0.5 rounded">
          105m × 68m Planar
        </span>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-50 dark:bg-[#18181C] p-2 rounded-lg border border-slate-200/80 dark:border-[#27272A]">
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <span className="w-2 h-2 rounded-full bg-[#EF0107]" />
          <span className="font-bold">ARS: 3-2-4-1 Build-up</span>
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
            for (const ent of entities) {
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
      <div className="flex items-center justify-between gap-1.5 pt-1">
        <button
          onClick={() => setShowPassingLanes(!showPassingLanes)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors ${
            showPassingLanes
              ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs font-semibold'
              : 'bg-slate-50 dark:bg-[#18181C] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A] hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Toggle Passing Lanes"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showPassingLanes ? 'bg-[#00DF59]' : 'bg-slate-400'}`} />
          <span>Pass Lanes</span>
        </button>

        <button
          onClick={() => setShowConvexHull(!showConvexHull)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors ${
            showConvexHull
              ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs font-semibold'
              : 'bg-slate-50 dark:bg-[#18181C] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A] hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Toggle Team Shape Convex Hull"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showConvexHull ? 'bg-white' : 'bg-slate-400'}`} />
          <span>Shapes</span>
        </button>

        <button
          onClick={() => setShowTacticalZones(!showTacticalZones)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-mono transition-colors ${
            showTacticalZones
              ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs font-semibold'
              : 'bg-slate-50 dark:bg-[#18181C] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A] hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Toggle 18 Tactical Zones & Zone 14"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showTacticalZones ? 'bg-[#F59E0B]' : 'bg-slate-400'}`} />
          <span>Zone 14</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-[#27272A]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EF0107]" />
          <span>Arsenal (11)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
          <span>Man City (11)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Live Ball</span>
        </div>
      </div>
    </div>
  );
};
