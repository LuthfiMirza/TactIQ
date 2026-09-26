'use client';

import React, { useState, useMemo } from 'react';
import { RadarChart } from '@/components/radar-chart';
import type { PlayerDTO } from '@tactiq/shared-types';
import {
  SlidersHorizontal,
  Download,
  Check,
  ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoutingRecommendation {
  player: PlayerDTO;
  matchPercentage: number;
  highlightMetrics: { label: string; value: string }[];
  per90: { sca: number; penaltyBoxPasses: number; highTurnoverRegains: number; pressPassPct: number };
  tacticalRole: string;
}

// ─── Benchmark Dataset ───────────────────────────────────────────────────────

const BENCHMARK_PLAYERS: (PlayerDTO & {
  estValueFormatted: string;
  rating: number;
  goals: number; assists: number; started: number; matches: number; minutes: number;
  position2: string;
  strengths: string[]; weaknesses: string[];
  per90: { sca: number; penaltyBoxPasses: number; highTurnoverRegains: number; pressPassPct: number };
})[] = [
  {
    id: 'player-odegaard', teamId: 'team-ars',
    name: 'Martin Ødegaard', position: 'MID', position2: 'AM / CM',
    nationality: 'NOR', age: 25, marketValue: 110000000,
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&q=80',
    team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 76, shooting: 82, passing: 93, dribbling: 90, defending: 68, physical: 69, vision: 95 },
    estValueFormatted: '€110M',
    rating: 8.4, goals: 11, assists: 14, started: 28, matches: 30, minutes: 2520,
    strengths: ['Line-breaking passes', 'Vision & Creativity', 'High pressing'],
    weaknesses: ['Aerial duels', 'Physical strength'],
    per90: { sca: 5.82, penaltyBoxPasses: 2.91, highTurnoverRegains: 1.42, pressPassPct: 84.6 },
  },
  {
    id: 'player-kdb', teamId: 'team-mci',
    name: 'Kevin De Bruyne', position: 'MID', position2: 'AM / CM',
    nationality: 'BEL', age: 33, marketValue: 50000000,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80',
    team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 74, shooting: 88, passing: 95, dribbling: 87, defending: 65, physical: 78, vision: 97 },
    estValueFormatted: '€50M',
    rating: 8.9, goals: 8, assists: 19, started: 24, matches: 27, minutes: 2160,
    strengths: ['Long-range passing', 'Shooting accuracy', 'Game reading'],
    weaknesses: ['Injury recovery', 'Defensive recovery'],
    per90: { sca: 6.42, penaltyBoxPasses: 3.45, highTurnoverRegains: 1.25, pressPassPct: 82.1 },
  },
  {
    id: 'player-bellingham', teamId: 'team-rma',
    name: 'Jude Bellingham', position: 'MID', position2: 'AM / CM',
    nationality: 'ENG', age: 21, marketValue: 180000000,
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&q=80',
    team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
    attributes: { pace: 82, shooting: 87, passing: 89, dribbling: 90, defending: 80, physical: 85, vision: 91 },
    estValueFormatted: '€180M',
    rating: 9.1, goals: 21, assists: 9, started: 30, matches: 32, minutes: 2740,
    strengths: ['Box-to-box runs', 'High pressing', 'Goal scoring'],
    weaknesses: ['Tactical discipline', 'Foul frequency'],
    per90: { sca: 5.12, penaltyBoxPasses: 2.35, highTurnoverRegains: 2.10, pressPassPct: 86.8 },
  },
];

const INITIAL_RECOMMENDATIONS: ScoutingRecommendation[] = [
  {
    player: {
      id: 'rec-szoboszlai', teamId: 'team-liv',
      name: 'Dominik Szoboszlai', position: 'MID',
      nationality: 'HUN', age: 23, marketValue: 75000000,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80',
      team: { id: 'team-liv', name: 'Liverpool', code: 'LIV', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 82, shooting: 85, passing: 89, dribbling: 86, defending: 64, physical: 79, vision: 90 },
    },
    matchPercentage: 94.2,
    highlightMetrics: [{ label: 'Half-Space Control', value: '98%' }, { label: 'Key Passes', value: '95%' }, { label: 'Press Regains', value: '91%' }],
    per90: { sca: 5.44, penaltyBoxPasses: 2.68, highTurnoverRegains: 1.75, pressPassPct: 81.9 },
    tacticalRole: 'Advanced Playmaker',
  },
  {
    player: {
      id: 'rec-busio', teamId: 'team-ven',
      name: 'Gianluca Busio', position: 'MID',
      nationality: 'USA', age: 22, marketValue: 18000000,
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80',
      team: { id: 'team-ven', name: 'Venezia', code: 'VEN', logoUrl: '', league: 'Serie A' },
      attributes: { pace: 74, shooting: 72, passing: 88, dribbling: 84, defending: 72, physical: 75, vision: 86 },
    },
    matchPercentage: 91.8,
    highlightMetrics: [{ label: 'Press Resist', value: '92%' }, { label: 'Prog. Passes', value: '89%' }, { label: 'Ball Retention', value: '87%' }],
    per90: { sca: 4.88, penaltyBoxPasses: 2.12, highTurnoverRegains: 1.92, pressPassPct: 87.2 },
    tacticalRole: 'Midfield Connector',
  },
  {
    player: {
      id: 'rec-guler', teamId: 'team-rma',
      name: 'Arda Güler', position: 'MID',
      nationality: 'TUR', age: 19, marketValue: 45000000,
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80',
      team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 78, shooting: 81, passing: 88, dribbling: 89, defending: 52, physical: 62, vision: 91 },
    },
    matchPercentage: 89.4,
    highlightMetrics: [{ label: 'Shot Creation', value: '94%' }, { label: 'Box Entries', value: '90%' }, { label: 'Final Third xA', value: '91%' }],
    per90: { sca: 5.62, penaltyBoxPasses: 2.75, highTurnoverRegains: 0.98, pressPassPct: 83.1 },
    tacticalRole: 'Inverted Playmaker',
  },
  {
    player: {
      id: 'rec-zakharyan', teamId: 'team-rso',
      name: 'Arsen Zakharyan', position: 'MID',
      nationality: 'RUS', age: 21, marketValue: 15000000,
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80',
      team: { id: 'team-rso', name: 'Real Sociedad', code: 'RSO', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 77, shooting: 76, passing: 85, dribbling: 83, defending: 66, physical: 70, vision: 85 },
    },
    matchPercentage: 87.1,
    highlightMetrics: [{ label: 'Chance Creation', value: '89%' }, { label: 'Prog. Passes', value: '86%' }, { label: 'Tackles p90', value: '74%' }],
    per90: { sca: 4.41, penaltyBoxPasses: 1.95, highTurnoverRegains: 1.62, pressPassPct: 80.4 },
    tacticalRole: 'Wide Playmaker',
  },
  {
    player: {
      id: 'rec-oriley', teamId: 'team-bha',
      name: "Matt O'Riley", position: 'MID',
      nationality: 'DEN', age: 23, marketValue: 30000000,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      team: { id: 'team-bha', name: 'Brighton', code: 'BHA', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 72, shooting: 80, passing: 86, dribbling: 81, defending: 68, physical: 79, vision: 85 },
    },
    matchPercentage: 85.6,
    highlightMetrics: [{ label: 'Box Threat', value: '89%' }, { label: 'xA Potential', value: '84%' }, { label: 'Prog. Carries', value: '81%' }],
    per90: { sca: 4.65, penaltyBoxPasses: 2.22, highTurnoverRegains: 1.55, pressPassPct: 82.5 },
    tacticalRole: 'Box-to-Box Midfielder',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getFlag = (nat?: string) => {
  switch (nat) {
    case 'NOR': return '🇳🇴';
    case 'BEL': return '🇧🇪';
    case 'ENG': return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    case 'HUN': return '🇭🇺';
    case 'USA': return '🇺🇸';
    case 'TUR': return '🇹🇷';
    case 'RUS': return '🇷🇺';
    case 'DEN': return '🇩🇰';
    default: return '⚽';
  }
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function MiniPitch({ position }: { position: string }) {
  const isAM = position.includes('AM');
  const dotX = 52;
  const dotY = isAM ? 34 : 46;
  return (
    <svg viewBox="0 0 104 68" className="w-full h-full rounded-lg" fill="none">
      <rect x="1" y="1" width="102" height="66" rx="4" fill="#F8FAFC" className="dark:fill-[#18181C]" stroke="#CBD5E1" strokeWidth="1"/>
      <line x1="52" y1="1" x2="52" y2="67" stroke="#CBD5E1" strokeWidth="0.75"/>
      <circle cx="52" cy="34" r="10" stroke="#CBD5E1" strokeWidth="0.75"/>
      <circle cx="52" cy="34" r="1.5" fill="#94A3B8"/>
      <rect x="1" y="16" width="16" height="36" stroke="#CBD5E1" strokeWidth="0.75"/>
      <rect x="87" y="16" width="16" height="36" stroke="#CBD5E1" strokeWidth="0.75"/>
      <circle cx={dotX} cy={dotY} r="4.5" fill="#10B981" />
      <circle cx={dotX} cy={dotY} r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

const MATCH_STATS = [
  { date: '20.04.24', opponent: 'Barca', result: 'D', score: '2 - 2', mins: '90', goals: 1, assists: 2, rating: '8.5' },
  { date: '16.04.24', opponent: 'Chelsea', result: 'W', score: '3 - 0', mins: '90', goals: 0, assists: 2, rating: '9.0' },
  { date: '04.04.24', opponent: 'Spurs', result: 'W', score: '4 - 1', mins: '90', goals: 2, assists: 1, rating: '8.2' },
  { date: '28.03.24', opponent: 'Man City', result: 'W', score: '2 - 1', mins: '90', goals: 0, assists: 1, rating: '7.8' },
  { date: '18.03.24', opponent: 'Liverpool', result: 'D', score: '1 - 1', mins: '68', goals: 1, assists: 0, rating: '7.4' },
];

export default function ScoutingPage() {
  const [anchorPlayer, setAnchorPlayer] = useState(BENCHMARK_PLAYERS[0]);
  const [selectedCluster, setSelectedCluster] = useState<'GK' | 'DF' | 'MF' | 'FW'>('MF');
  const [recommendations] = useState<ScoutingRecommendation[]>(INITIAL_RECOMMENDATIONS);
  const [comparisonTarget, setComparisonTarget] = useState<ScoutingRecommendation>(INITIAL_RECOMMENDATIONS[0]);
  const [sortBy, setSortBy] = useState<'similarity' | 'value' | 'age'>('similarity');
  const [isAnchorSelectorOpen, setIsAnchorSelectorOpen] = useState(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const sortedRecommendations = useMemo(() => {
    const list = [...recommendations];
    if (sortBy === 'similarity') return list.sort((a, b) => b.matchPercentage - a.matchPercentage);
    if (sortBy === 'value') return list.sort((a, b) => (b.player.marketValue || 0) - (a.player.marketValue || 0));
    if (sortBy === 'age') return list.sort((a, b) => (a.player.age || 0) - (b.player.age || 0));
    return list;
  }, [recommendations, sortBy]);

  const duelMetrics = useMemo(() => {
    const a = anchorPlayer.per90;
    const b = comparisonTarget.per90;
    return [
      { label: 'Shot-Creating Actions', anchorVal: a.sca, targetVal: b.sca, max: 7.0, unit: '/90' },
      { label: 'Penalty Box Passes', anchorVal: a.penaltyBoxPasses, targetVal: b.penaltyBoxPasses, max: 4.0, unit: '/90' },
      { label: 'High Turnover Regains', anchorVal: a.highTurnoverRegains, targetVal: b.highTurnoverRegains, max: 2.5, unit: '/90' },
      { label: 'Pressing Pass Success', anchorVal: a.pressPassPct, targetVal: b.pressPassPct, max: 100, unit: '%' },
    ];
  }, [anchorPlayer, comparisonTarget]);

  return (
    <div className="w-full flex flex-col gap-5 pb-14">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-[#10B981] text-white font-mono font-bold text-xs flex items-center gap-2 rounded-lg shadow-xl">
          <Check size={14} className="text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Filter & Navigation Toolbar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#27272A] pb-3 transition-colors">
        
        {/* Left: Position Filter Matrix & Anchor Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Anchor Selector */}
          <div className="relative">
            <button
              onClick={() => setIsAnchorSelectorOpen(!isAnchorSelectorOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] shadow-xs transition-colors"
            >
              <span className="text-[#10B981]">Anchor:</span>
              <span>{anchorPlayer.name}</span>
              <ChevronDown size={13} className="text-slate-500 dark:text-zinc-400" />
            </button>

            {isAnchorSelectorOpen && (
              <div className="absolute top-full left-0 mt-1 z-30 w-64 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-[#27272A]">
                {BENCHMARK_PLAYERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setAnchorPlayer(p); setIsAnchorSelectorOpen(false); showToast(`Benchmark: ${p.name}`); }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors text-left"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">{p.team?.name} · {p.position2}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#10B981]">{p.estValueFormatted}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Position Clusters */}
          <div className="flex items-center border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] rounded-lg p-0.5 shadow-xs">
            {(['GK', 'DF', 'MF', 'FW'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedCluster(pos)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  selectedCluster === pos
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWeightsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 shadow-xs transition-colors"
          >
            <SlidersHorizontal size={13} />
            <span>Weights</span>
          </button>
          <button
            onClick={() => showToast('Shortlist exported to CSV')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>

      </div>

      {/* ── Main Side-by-Side Comparison Workspace ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT COLUMN: Candidate Shortlist (4 cols) ─────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 shadow-xs transition-colors">
            
            {/* Header with Sort Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                  Similar Profiles
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">Select player to compare</span>
              </div>

              {/* Sort Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-[#18181C] p-0.5 rounded-lg border border-slate-200/60 dark:border-[#27272A] text-[10px] font-mono">
                {(['similarity', 'value', 'age'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                      sortBy === s
                        ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {s === 'similarity' ? 'Match' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate List */}
            <div className="divide-y divide-slate-100 dark:divide-[#27272A] mt-1">
              {sortedRecommendations.map((rec) => {
                const isSelected = comparisonTarget.player.id === rec.player.id;
                const valueFormatted = rec.player.marketValue ? `€${(rec.player.marketValue / 1e6).toFixed(0)}M` : '–';

                return (
                  <div
                    key={rec.player.id}
                    onClick={() => {
                      setComparisonTarget(rec);
                      showToast(`Comparing: ${rec.player.name}`);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all my-1.5 border ${
                      isSelected
                        ? 'border-slate-300 dark:border-zinc-600 bg-slate-100/80 dark:bg-[#1E1E24] shadow-xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-[#27272A] hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      
                      {/* Left: Player Avatar + Details */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-[#10B981] text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-[#1E1E24] text-slate-700 dark:text-zinc-300'
                          }`}>
                            {getInitials(rec.player.name)}
                          </div>
                          <span className="absolute -bottom-1 -right-1 text-[10px] leading-none">
                            {getFlag(rec.player.nationality)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {rec.player.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5 font-mono">
                            {rec.player.team?.name} · {rec.player.age}y · <span className="text-[#10B981] font-bold">{valueFormatted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Match Percentage */}
                      <div className="text-right shrink-0 font-mono">
                        <div className={`text-sm font-bold tabular-nums ${
                          isSelected ? 'text-[#10B981]' : 'text-slate-900 dark:text-white'
                        }`}>
                          {rec.matchPercentage.toFixed(1)}%
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                          Match
                        </span>
                      </div>

                    </div>

                    {/* Metric Badges */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {rec.highlightMetrics.slice(0, 2).map((m, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E1E24] text-slate-600 dark:text-zinc-400 text-[10px] font-mono">
                          {m.label}: <strong className="text-slate-900 dark:text-zinc-200">{m.value}</strong>
                        </span>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* ── RIGHT COLUMN: Comparison Arena (8 cols) ───────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Card 1: Player Matchup Header */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-xs transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 sm:gap-6">
              
              {/* Anchor Profile (Left, 5 cols) */}
              <div className="md:col-span-5 flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center font-extrabold text-base sm:text-lg text-white shadow-xs">
                    {getInitials(anchorPlayer.name)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs">
                    {getFlag(anchorPlayer.nationality)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] font-bold block">
                    Anchor Player
                  </span>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {anchorPlayer.name}
                  </h2>
                  <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                    {anchorPlayer.team?.name} · {anchorPlayer.age}y · <span className="font-bold text-slate-900 dark:text-zinc-200">{anchorPlayer.estValueFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Match % (Center, 1 col) */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0 border-y md:border-y-0 md:border-x border-slate-100 dark:border-[#27272A]">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#18181C] flex items-center justify-center text-slate-500 dark:text-zinc-400 font-mono font-bold text-[11px]">
                  VS
                </div>
                <span className="text-[10px] font-mono font-bold text-[#10B981] mt-1 whitespace-nowrap">
                  {comparisonTarget.matchPercentage.toFixed(1)}%
                </span>
              </div>

              {/* Target Profile (Right, 5 cols) */}
              <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-3.5 text-left md:text-right">
                <div className="min-w-0 order-2 md:order-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold block">
                    Comparison
                  </span>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {comparisonTarget.player.name}
                  </h2>
                  <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                    {comparisonTarget.player.team?.name} · {comparisonTarget.player.age}y · <span className="font-bold text-sky-600 dark:text-sky-400">€{(comparisonTarget.player.marketValue ? comparisonTarget.player.marketValue / 1e6 : 0).toFixed(0)}M</span>
                  </div>
                </div>

                <div className="relative shrink-0 order-1 md:order-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center font-extrabold text-base sm:text-lg text-white shadow-xs">
                    {getInitials(comparisonTarget.player.name)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs">
                    {getFlag(comparisonTarget.player.nationality)}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Card 2: Interactive Radar & Per 90 Comparison */}
          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs transition-colors">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Attribute Comparison</span>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  {anchorPlayer.name.split(' ')[1] || anchorPlayer.name}
                </span>
                <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                  {comparisonTarget.player.name.split(' ')[1] || comparisonTarget.player.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Radar Chart (6 cols) */}
              <div className="md:col-span-6 flex flex-col items-center justify-center min-h-[250px]">
                {anchorPlayer.attributes && (
                  <RadarChart
                    metrics={anchorPlayer.attributes}
                    playerName={anchorPlayer.name}
                    {...(comparisonTarget.player.attributes
                      ? { comparisonMetrics: comparisonTarget.player.attributes, comparisonPlayerName: comparisonTarget.player.name }
                      : {})}
                  />
                )}
              </div>

              {/* Metric Duel Bars (6 cols) */}
              <div className="md:col-span-6 flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-[#27272A] pt-4 md:pt-0 md:pl-6 font-mono">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold block">
                  Per 90 Metrics
                </span>

                {duelMetrics.map((m) => {
                  const anchorPct = Math.min(100, Math.round((m.anchorVal / m.max) * 100));
                  const targetPct = Math.min(100, Math.round((m.targetVal / m.max) * 100));
                  const anchorWins = m.anchorVal >= m.targetVal;

                  return (
                    <div key={m.label} className="text-xs">
                      {/* Metric Name & Values */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-bold ${anchorWins ? 'text-[#10B981]' : 'text-slate-700 dark:text-zinc-300'}`}>
                          {m.anchorVal.toFixed(m.unit === '%' ? 1 : 2)}{m.unit}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-zinc-300 font-medium text-center truncate px-2 font-sans">
                          {m.label}
                        </span>
                        <span className={`font-bold ${!anchorWins ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                          {m.targetVal.toFixed(m.unit === '%' ? 1 : 2)}{m.unit}
                        </span>
                      </div>

                      {/* Side-by-Side Duel Bar */}
                      <div className="grid grid-cols-2 gap-1.5 h-1.5 bg-slate-100 dark:bg-[#18181C] rounded-full overflow-hidden">
                        <div className="flex justify-end">
                          <div
                            className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                            style={{ width: `${anchorPct}%` }}
                          />
                        </div>
                        <div className="flex justify-start">
                          <div
                            className="h-full bg-[#0284C7] rounded-full transition-all duration-300"
                            style={{ width: `${targetPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Card 3: Side-by-Side Tactical Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Anchor Tactical Profile */}
            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {anchorPlayer.name.split(' ')[1]} Profile
                  </span>
                  <span className="text-[10px] font-mono text-[#10B981] font-bold">{anchorPlayer.position2}</span>
                </div>

                <div className="h-28 rounded-lg border border-slate-200 dark:border-[#27272A] overflow-hidden mb-3.5 bg-slate-50 dark:bg-[#18181C]">
                  <MiniPitch position={anchorPlayer.position2 ?? 'AM'} />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Key Strengths</span>
                    <ul className="space-y-1 text-slate-700 dark:text-zinc-300 text-[11px]">
                      {anchorPlayer.strengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="text-[#10B981] font-bold">+</span>
                          <span className="truncate">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Areas for Development</span>
                    <ul className="space-y-1 text-slate-500 dark:text-zinc-400 text-[11px]">
                      {anchorPlayer.weaknesses.slice(0, 2).map((w, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span>–</span>
                          <span className="truncate">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-[#27272A] pt-3 mt-4 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex justify-between">
                <span>Role: Playmaker</span>
                <span className="text-slate-900 dark:text-white font-bold">{anchorPlayer.matches} Matches · {anchorPlayer.goals}G {anchorPlayer.assists}A</span>
              </div>
            </div>

            {/* Target Tactical Profile */}
            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {comparisonTarget.player.name.split(' ')[1] || comparisonTarget.player.name} Fit
                  </span>
                  <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                    {comparisonTarget.tacticalRole}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Compatibility High Points</span>
                    <ul className="space-y-1 text-slate-700 dark:text-zinc-300 text-[11px]">
                      {comparisonTarget.highlightMetrics.map((hm, i) => (
                        <li key={i} className="flex items-center justify-between py-0.5">
                          <span className="flex items-center gap-1.5">
                            <span className="text-sky-600 dark:text-sky-400 font-bold">✓</span>
                            <span>{hm.label}</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{hm.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 dark:border-[#27272A] pt-3">
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Attributes Summary</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Passing</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.passing}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Dribbling</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.dribbling}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Shooting</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.shooting}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Vision</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.vision}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-[#27272A] pt-3 mt-4 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex justify-between">
                <span>Market Value:</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">€{(comparisonTarget.player.marketValue ? comparisonTarget.player.marketValue / 1e6 : 0).toFixed(0)}M</span>
              </div>
            </div>

          </div>

          {/* Card 4: Match Registry & Performance Log */}
          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Performance Log</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  Recent Match Records ({anchorPlayer.name})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">Premier League</span>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_80px_50px_40px_40px_50px] pb-2 border-b border-slate-100 dark:border-[#27272A] text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
              <span>Opponent</span>
              <span className="text-center">Score</span>
              <span className="text-center">Mins</span>
              <span className="text-center">G</span>
              <span className="text-center">A</span>
              <span className="text-right">Rating</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-[#27272A] font-mono text-xs">
              {MATCH_STATS.map((m, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_50px_40px_40px_50px] items-center py-2.5 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={m.result === 'W' ? 'tq-form-w' : 'tq-form-d'}>
                      {m.result}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{m.opponent}</span>
                  </div>
                  <div className="text-center font-bold text-slate-900 dark:text-zinc-100">
                    {m.score}
                  </div>
                  <span className="text-center text-slate-500 dark:text-zinc-400">{m.mins}&apos;</span>
                  <span className="text-center text-slate-900 dark:text-white font-bold">{m.goals}</span>
                  <span className="text-center text-slate-900 dark:text-white font-bold">{m.assists}</span>
                  <div className="text-right font-bold text-slate-900 dark:text-white">
                    {m.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── Weights Modal ──────────────────────────────────────────────────── */}
      {isWeightsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setIsWeightsModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-6 shadow-2xl transition-colors" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Scouting Weights</span>
              <button onClick={() => setIsWeightsModalOpen(false)} className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-xs font-mono">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Passing & Creation', val: 35 },
                { label: 'Pressing Intensity', val: 25 },
                { label: 'Progressive Carries', val: 20 },
                { label: 'Spatial Duels', val: 20 },
              ].map(({ label, val }) => (
                <div key={label} className="font-mono text-xs">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-600 dark:text-zinc-300">{label}</span>
                    <span className="text-[#10B981] font-bold">{val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-[#18181C] rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981]" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setIsWeightsModalOpen(false);
                showToast('Weights updated');
              }}
              className="w-full mt-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-xs"
            >
              Apply Weights
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
