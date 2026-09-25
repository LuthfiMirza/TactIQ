'use client';

import React, { useRef, useEffect } from 'react';
import type { TrackingEntity } from '@tactiq/shared-types';
import { Compass, Shield } from 'lucide-react';

interface TacticalMinimapProps {
  entities?: TrackingEntity[];
  className?: string;
}

export const TacticalMinimap: React.FC<TacticalMinimapProps> = ({
  entities = [],
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Pitch Surface (Top-Down Flat Planar Perspective)
    ctx.fillStyle = '#06130C';
    ctx.fillRect(0, 0, width, height);

    // Subtle pitch stripes
    const stripes = 8;
    const sWidth = width / stripes;
    for (let i = 0; i < stripes; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.03)';
        ctx.fillRect(i * sWidth, 0, sWidth, height);
      }
    }

    // Pitch Line Markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.2;

    const pad = 12;
    const pW = width - pad * 2;
    const pH = height - pad * 2;

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

    // Penalty Boxes
    const boxW = pW * 0.16;
    const boxH = pH * 0.52;
    const boxY = pad + (pH - boxH) / 2;
    ctx.strokeRect(pad, boxY, boxW, boxH);
    ctx.strokeRect(pad + pW - boxW, boxY, boxW, boxH);

    // 2. Render Planar Entities
    entities.forEach((ent) => {
      const px = pad + ent.x * pW;
      const py = pad + ent.y * pH;

      if (ent.team === 'ball') {
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const isHome = ent.team === 'home';
        const color = isHome ? '#38BDF8' : '#F43F5E';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0B0E14';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [entities]);

  return (
    <div className={`p-4 bg-tactiq-card border border-tactiq-border rounded-2xl shadow-xl space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-tactiq-border/60 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Compass size={14} className="text-tactiq-emerald" />
          <span>2D Planar Tactical Minimap</span>
        </span>
        <span className="text-[10px] font-mono text-tactiq-cyan bg-tactiq-surface px-2 py-0.5 rounded border border-tactiq-border">
          105m × 68m FIFA
        </span>
      </div>

      <div className="relative w-full aspect-[105/68] rounded-xl overflow-hidden border border-tactiq-border/80">
        <canvas
          ref={canvasRef}
          width={350}
          height={226}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Legend & Metric readout */}
      <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-tactiq-muted">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-tactiq-home" />
          <span>MCI Shape</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-tactiq-away" />
          <span>ARS Block</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-tactiq-ball" />
          <span>Ball</span>
        </div>
      </div>
    </div>
  );
};
