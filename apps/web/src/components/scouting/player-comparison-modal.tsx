'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowLeftRight, ChevronDown } from 'lucide-react';
import { RadarChart } from '@/components/radar-chart';
import { ClubCrest } from '@/components/ui/club-crest';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import type { PlayerDTO, PlayerRadarMetrics } from '@tactiq/shared-types';

interface PlayerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: PlayerDTO[];
  initialPlayerA?: PlayerDTO;
  initialPlayerB?: PlayerDTO;
}

const ATTRIBUTE_LABELS: { key: keyof PlayerRadarMetrics; label: string }[] = [
  { key: 'pace', label: 'Pace' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'passing', label: 'Passing' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'defending', label: 'Defending' },
  { key: 'physical', label: 'Physical' },
  { key: 'vision', label: 'Vision' },
];

export function PlayerComparisonModal({
  isOpen,
  onClose,
  allPlayers,
  initialPlayerA,
  initialPlayerB,
}: PlayerComparisonModalProps) {
  // Deduplicate all players by id
  const uniquePlayers = useMemo(() => {
    const map = new Map<string, PlayerDTO>();
    allPlayers.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [allPlayers]);

  const [playerAId, setPlayerAId] = useState<string>(
    initialPlayerA?.id || uniquePlayers[0]?.id || ''
  );
  const [playerBId, setPlayerBId] = useState<string>(
    initialPlayerB?.id || uniquePlayers[1]?.id || uniquePlayers[0]?.id || ''
  );

  useEffect(() => {
    if (initialPlayerA) setPlayerAId(initialPlayerA.id);
  }, [initialPlayerA]);

  useEffect(() => {
    if (initialPlayerB) setPlayerBId(initialPlayerB.id);
  }, [initialPlayerB]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const playerA = uniquePlayers.find((p) => p.id === playerAId) || uniquePlayers[0];
  const playerB = uniquePlayers.find((p) => p.id === playerBId) || uniquePlayers[1] || uniquePlayers[0];

  const handleSwap = () => {
    const temp = playerAId;
    setPlayerAId(playerBId);
    setPlayerBId(temp);
  };

  const formatValue = (val?: number) => {
    if (!val) return '—';
    if (val >= 1000000) return `€${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-4xl h-[94dvh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl border-t sm:border border-[#27272A] bg-[#121215] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-modal-title"
      >
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#27272A] bg-[#141418] shrink-0">
          <div>
            <h2 id="comparison-modal-title" className="text-base sm:text-lg font-black text-white tracking-tight">
              Player Comparison
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Side-by-side tactical radar & attribute breakdown
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close comparison modal"
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Dual Picker Toolbar ──────────────────────────────────────── */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-[#16161B] border-b border-[#27272A] shrink-0">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-3">
            
            {/* Player A Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#CEFF00] shrink-0 shadow-[0_0_6px_rgba(206,255,0,0.8)]" />
              <div className="relative flex-1 min-w-0">
                <select
                  value={playerAId}
                  onChange={(e) => setPlayerAId(e.target.value)}
                  className="w-full h-9 sm:h-10 appearance-none bg-[#1A1A20] border border-[#CEFF00]/40 focus:border-[#CEFF00] text-[11px] sm:text-xs font-bold text-white pl-2 sm:pl-3.5 pr-6 sm:pr-9 rounded-lg sm:rounded-xl outline-none cursor-pointer truncate transition-colors"
                >
                  {uniquePlayers.map((p) => (
                    <option key={`a-${p.id}`} value={p.id} className="bg-[#18181C] text-zinc-100">
                      {p.name} ({p.position} · {p.team?.code || p.team?.name})
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Center Swap Button */}
            <div className="flex items-center justify-center shrink-0 px-0.5">
              <button
                onClick={handleSwap}
                title="Swap players"
                aria-label="Swap players"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F1F26] border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-xs"
              >
                <ArrowLeftRight size={12} />
              </button>
            </div>

            {/* Player B Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#00D2FF] shrink-0 shadow-[0_0_6px_rgba(0,210,255,0.8)]" />
              <div className="relative flex-1 min-w-0">
                <select
                  value={playerBId}
                  onChange={(e) => setPlayerBId(e.target.value)}
                  className="w-full h-9 sm:h-10 appearance-none bg-[#1A1A20] border border-[#00D2FF]/40 focus:border-[#00D2FF] text-[11px] sm:text-xs font-bold text-white pl-2 sm:pl-3.5 pr-6 sm:pr-9 rounded-lg sm:rounded-xl outline-none cursor-pointer truncate transition-colors"
                >
                  {uniquePlayers.map((p) => (
                    <option key={`b-${p.id}`} value={p.id} className="bg-[#18181C] text-zinc-100">
                      {p.name} ({p.position} · {p.team?.code || p.team?.name})
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>

          </div>
        </div>

        {/* ── Scrollable Comparison Body ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 slim-scrollbar">
          
          {/* Row 1: Player Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Player A Card (Lime) */}
            <div className="rounded-xl border border-[#27272A] bg-[#16161B] p-3 sm:p-4 relative overflow-hidden flex items-center gap-2.5 sm:gap-3.5">
              {/* Seamless Cutout Portrait */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 aspect-square shrink-0 flex items-center justify-center">
                <PlayerAvatar
                  src={playerA.photoUrl}
                  alt={playerA.name}
                  className="w-full h-full object-cover object-[center_top] [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] drop-shadow-md"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#CEFF00] shrink-0 shadow-[0_0_6px_rgba(206,255,0,0.6)]" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">{playerA.name}</h3>
                  <span className="px-1.5 py-0.5 rounded bg-[#CEFF00]/10 text-[#CEFF00] font-mono font-bold text-[9px] sm:text-[10px]">
                    {playerA.position}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-1 text-[11px] sm:text-xs text-zinc-400">
                  <ClubCrest code={playerA.team?.code || ''} size={13} />
                  <span className="truncate">{playerA.team?.name}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{playerA.nationality}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{playerA.age}y</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-extrabold text-white">{formatValue(playerA.marketValue)}</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-mono">Market Val</div>
              </div>
            </div>

            {/* Player B Card (Cyan) */}
            <div className="rounded-xl border border-[#27272A] bg-[#16161B] p-3 sm:p-4 relative overflow-hidden flex items-center gap-2.5 sm:gap-3.5">
              {/* Seamless Cutout Portrait */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 aspect-square shrink-0 flex items-center justify-center">
                <PlayerAvatar
                  src={playerB.photoUrl}
                  alt={playerB.name}
                  className="w-full h-full object-cover object-[center_top] [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] drop-shadow-md"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00D2FF] shrink-0 shadow-[0_0_6px_rgba(0,210,255,0.6)]" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">{playerB.name}</h3>
                  <span className="px-1.5 py-0.5 rounded bg-[#00D2FF]/10 text-[#00D2FF] font-mono font-bold text-[9px] sm:text-[10px]">
                    {playerB.position}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-1 text-[11px] sm:text-xs text-zinc-400">
                  <ClubCrest code={playerB.team?.code || ''} size={13} />
                  <span className="truncate">{playerB.team?.name}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{playerB.nationality}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{playerB.age}y</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-extrabold text-white">{formatValue(playerB.marketValue)}</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-mono">Market Val</div>
              </div>
            </div>

          </div>

          {/* Row 2: Radar Overlay & Head-to-Head Attributes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
            
            {/* Left: Dual Spider Chart (6 cols) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-[#27272A] bg-[#15151A]/60 w-full overflow-hidden">
              <div className="w-full flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Tactical Radar
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {playerA.position} Profile
                </span>
              </div>
              <div className="w-full flex items-center justify-center">
                <RadarChart
                  metrics={playerA.attributes}
                  playerName={playerA.name}
                  comparisonMetrics={playerB.attributes}
                  comparisonPlayerName={playerB.name}
                  className="!bg-transparent !border-0 !p-0 w-full"
                />
              </div>
            </div>

            {/* Right: Attribute Discrepancy Breakdown (6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Attribute Discrepancy</span>
                <span>Delta</span>
              </div>

              {ATTRIBUTE_LABELS.map(({ key, label }) => {
                const valA = playerA.attributes?.[key] ?? 50;
                const valB = playerB.attributes?.[key] ?? 50;
                const delta = valA - valB;
                const aWins = delta > 0;
                const bWins = delta < 0;

                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg border border-[#27272A]/80 bg-[#16161B] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-mono font-bold ${aWins ? 'text-[#CEFF00]' : 'text-zinc-300'}`}>
                        {valA}
                      </span>
                      <span className="text-zinc-400 font-bold text-[11px] uppercase tracking-wide">
                        {label}
                      </span>
                      <span className={`font-mono font-bold ${bWins ? 'text-[#00D2FF]' : 'text-zinc-300'}`}>
                        {valB}
                      </span>
                    </div>

                    {/* Dual Comparative Bar */}
                    <div className="grid grid-cols-2 gap-1 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                      {/* Left Bar (Player A) */}
                      <div className="flex justify-end bg-transparent">
                        <div
                          className="h-full rounded-l-full bg-[#CEFF00]"
                          style={{ width: `${Math.min(100, (valA / 100) * 100)}%` }}
                        />
                      </div>
                      {/* Right Bar (Player B) */}
                      <div className="flex justify-start bg-transparent">
                        <div
                          className="h-full rounded-r-full bg-[#00D2FF]"
                          style={{ width: `${Math.min(100, (valB / 100) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* ── Modal Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-t border-[#27272A] bg-[#141418] shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]">
          <div className="text-xs text-zinc-500 font-mono hidden sm:block">
            Esc to close
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleSwap}
              className="flex-1 sm:flex-none h-11 sm:h-9 px-4 py-2 rounded-xl sm:rounded-lg border border-zinc-700 hover:border-zinc-500 text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ArrowLeftRight size={13} />
              <span>Swap</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none h-11 sm:h-9 px-6 py-2 rounded-xl sm:rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-white font-bold text-xs border border-zinc-700/60 shadow-xs transition-all active:scale-95 flex items-center justify-center"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
