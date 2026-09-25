'use client';

import React, { useState, useMemo } from 'react';
import { RadarChart } from '@/components/radar-chart';
import type { PlayerDTO } from '@tactiq/shared-types';
import {
  SlidersHorizontal,
  Download,
  Check,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoutingRecommendation {
  player: PlayerDTO;
  matchPercentage: number;
  cosineDist: number;
  badge?: string;
  ratingFormatted: string;
  ratingClass: 'fm-rating-high' | 'fm-rating-good' | 'fm-rating-avg';
  highlightMetrics: { label: string; value: string }[];
  per90: { sca: number; penaltyBoxPasses: number; highTurnoverRegains: number; pressPassPct: number };
}

// ─── Benchmark Dataset ───────────────────────────────────────────────────────

const BENCHMARK_PLAYERS: (PlayerDTO & {
  estValueFormatted: string;
  keyPassesP90: string; keyPassesPercentile: string;
  progCarriesP90: string; progCarriesPercentile: string;
  xaP90: string; xaPercentile: string;
  pressSuccessPct: string; pressPercentile: string;
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
    team: { id: 'team-ars', name: 'Arsenal FC', code: 'ARS', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 76, shooting: 82, passing: 93, dribbling: 90, defending: 68, physical: 69, vision: 95 },
    estValueFormatted: '€110M',
    keyPassesP90: '2.84', keyPassesPercentile: '97th',
    progCarriesP90: '7.42', progCarriesPercentile: '92nd',
    xaP90: '0.34', xaPercentile: '94th',
    pressSuccessPct: '64.1%', pressPercentile: '89th',
    rating: 8.4, goals: 11, assists: 14, started: 28, matches: 30, minutes: 2520,
    strengths: ['Line-breaking passes', 'Vision & Creativity', 'High pressing', 'Set piece delivery'],
    weaknesses: ['Aerial duels', 'Physical strength'],
    per90: { sca: 5.82, penaltyBoxPasses: 2.91, highTurnoverRegains: 1.42, pressPassPct: 84.6 },
  },
  {
    id: 'player-kdb', teamId: 'team-mci',
    name: 'Kevin De Bruyne', position: 'MID', position2: 'CM / AM',
    nationality: 'BEL', age: 33, marketValue: 50000000,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
    team: { id: 'team-mci', name: 'Manchester City', code: 'MCI', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 74, shooting: 88, passing: 95, dribbling: 87, defending: 65, physical: 78, vision: 97 },
    estValueFormatted: '€50M',
    keyPassesP90: '3.18', keyPassesPercentile: '99th',
    progCarriesP90: '6.85', progCarriesPercentile: '88th',
    xaP90: '0.48', xaPercentile: '99th',
    pressSuccessPct: '58.2%', pressPercentile: '79th',
    rating: 8.9, goals: 8, assists: 19, started: 24, matches: 27, minutes: 2160,
    strengths: ['Long-range passing', 'Shooting accuracy', 'Ball Retention', 'Game reading'],
    weaknesses: ['Injury susceptibility', 'Defensive cover'],
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
    keyPassesP90: '2.15', keyPassesPercentile: '91st',
    progCarriesP90: '8.12', progCarriesPercentile: '96th',
    xaP90: '0.28', xaPercentile: '89th',
    pressSuccessPct: '71.4%', pressPercentile: '95th',
    rating: 9.1, goals: 21, assists: 9, started: 30, matches: 32, minutes: 2740,
    strengths: ['Progressive carries', 'High pressing', 'Goal scoring', 'Physicality'],
    weaknesses: ['Discipline', 'Shooting consistency'],
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
      team: { id: 'team-liv', name: 'Liverpool FC', code: 'LIV', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 82, shooting: 85, passing: 89, dribbling: 86, defending: 64, physical: 79, vision: 90 },
    },
    matchPercentage: 94.2, cosineDist: 0.058,
    badge: 'Top Pick',
    ratingFormatted: '8.1',
    ratingClass: 'fm-rating-high',
    highlightMetrics: [{ label: 'Half-Space Control', value: '98%' }, { label: 'Key Passes', value: '95%' }, { label: 'Press Regains', value: '91%' }],
    per90: { sca: 5.44, penaltyBoxPasses: 2.68, highTurnoverRegains: 1.75, pressPassPct: 81.9 },
  },
  {
    player: {
      id: 'rec-busio', teamId: 'team-ven',
      name: 'Gianluca Busio', position: 'MID',
      nationality: 'USA', age: 22, marketValue: 18000000,
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80',
      team: { id: 'team-ven', name: 'Venezia FC', code: 'VEN', logoUrl: '', league: 'Serie A' },
      attributes: { pace: 74, shooting: 72, passing: 88, dribbling: 84, defending: 72, physical: 75, vision: 86 },
    },
    matchPercentage: 91.8, cosineDist: 0.082,
    badge: 'High Value',
    ratingFormatted: '7.9',
    ratingClass: 'fm-rating-good',
    highlightMetrics: [{ label: 'Press Resist', value: '92%' }, { label: 'Prog. Passes', value: '89%' }, { label: 'Ball Retention', value: '87%' }],
    per90: { sca: 4.88, penaltyBoxPasses: 2.12, highTurnoverRegains: 1.92, pressPassPct: 87.2 },
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
    matchPercentage: 89.4, cosineDist: 0.106,
    badge: 'Prospect Tier 1',
    ratingFormatted: '8.2',
    ratingClass: 'fm-rating-high',
    highlightMetrics: [{ label: 'Shot Creation', value: '94%' }, { label: 'Box Entries', value: '90%' }, { label: 'Final Third xA', value: '91%' }],
    per90: { sca: 5.62, penaltyBoxPasses: 2.75, highTurnoverRegains: 0.98, pressPassPct: 83.1 },
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
    matchPercentage: 87.1, cosineDist: 0.129,
    ratingFormatted: '7.3',
    ratingClass: 'fm-rating-good',
    highlightMetrics: [{ label: 'Chance Creation', value: '89%' }, { label: 'Prog. Passes', value: '86%' }, { label: 'Tackles p90', value: '74%' }],
    per90: { sca: 4.41, penaltyBoxPasses: 1.95, highTurnoverRegains: 1.62, pressPassPct: 80.4 },
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
    matchPercentage: 85.6, cosineDist: 0.144,
    ratingFormatted: '7.5',
    ratingClass: 'fm-rating-good',
    highlightMetrics: [{ label: 'Box Threat', value: '89%' }, { label: 'xA Potential', value: '84%' }, { label: 'Prog. Carries', value: '81%' }],
    per90: { sca: 4.65, penaltyBoxPasses: 2.22, highTurnoverRegains: 1.55, pressPassPct: 82.5 },
  },
];

// ─── FotMob Style Pitch ───────────────────────────────────────────────────────

function MiniPitch({ position }: { position: string }) {
  const isAM = position.includes('AM');
  const dotX = 52;
  const dotY = isAM ? 34 : 46;
  return (
    <svg viewBox="0 0 104 68" className="w-full h-full" fill="none">
      <rect x="1" y="1" width="102" height="66" fill="#111620" stroke="#263145" strokeWidth="1"/>
      <line x1="52" y1="1" x2="52" y2="67" stroke="#263145" strokeWidth="0.75"/>
      <circle cx="52" cy="34" r="10" stroke="#263145" strokeWidth="0.75"/>
      <circle cx="52" cy="34" r="1.5" fill="#263145"/>
      <rect x="1" y="16" width="16" height="36" stroke="#263145" strokeWidth="0.75"/>
      <rect x="87" y="16" width="16" height="36" stroke="#263145" strokeWidth="0.75"/>
      <circle cx={dotX} cy={dotY} r="4" fill="#00DF59" />
    </svg>
  );
}

// ─── Match History (With FotMob W-D-L Form Dots) ─────────────────────────────

const MATCH_STATS = [
  { date: '20.04.24', opponent: 'FC Barcelona', result: 'D', score: '2 - 2', mins: '90', goals: 1, assists: 2, rating: '8.5' },
  { date: '16.04.24', opponent: 'Chelsea FC', result: 'W', score: '3 - 0', mins: '90', goals: 0, assists: 2, rating: '9.0' },
  { date: '04.04.24', opponent: 'Tottenham Hotspur', result: 'W', score: '4 - 1', mins: '90', goals: 2, assists: 1, rating: '8.2' },
  { date: '28.03.24', opponent: 'Manchester City', result: 'W', score: '2 - 1', mins: '90', goals: 0, assists: 1, rating: '7.8' },
  { date: '18.03.24', opponent: 'Liverpool FC', result: 'D', score: '1 - 1', mins: '68', goals: 1, assists: 0, rating: '7.4' },
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
    setTimeout(() => setToastMessage(null), 2500);
  };

  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => {
      if (sortBy === 'similarity') return b.matchPercentage - a.matchPercentage;
      if (sortBy === 'value') return (b.player.marketValue ?? 0) - (a.player.marketValue ?? 0);
      if (sortBy === 'age') return (a.player.age ?? 0) - (b.player.age ?? 0);
      return 0;
    });
  }, [recommendations, sortBy]);

  return (
    <div className="w-full flex flex-col gap-8 pb-12">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-[#00DF59] text-black font-mono font-bold text-xs flex items-center gap-2 rounded-lg shadow-2xl">
          <Check size={14} className="text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Filter Bar (FotMob Pill/Button Matrix) ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B3D] pb-4">
        
        {/* Left: Position Filter Matrix */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Anchor Selector */}
          <div className="relative">
            <button
              onClick={() => setIsAnchorSelectorOpen(!isAnchorSelectorOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-[#141A24] border border-[#222B3D] rounded-lg text-xs font-bold text-white hover:border-[#35425C] transition-colors"
            >
              <span>Anchor: {anchorPlayer.name}</span>
              <ChevronDown size={13} className="text-[#8E9EB5]" />
            </button>

            {isAnchorSelectorOpen && (
              <div className="absolute top-full left-0 mt-1 z-30 w-64 bg-[#141A24] border border-[#222B3D] rounded-lg shadow-2xl overflow-hidden">
                {BENCHMARK_PLAYERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setAnchorPlayer(p); setIsAnchorSelectorOpen(false); showToast(`Benchmark set to ${p.name}`); }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1D2534] transition-colors text-left border-b border-[#222B3D] last:border-b-0"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] font-mono text-[#8E9EB5]">{p.team?.name} · {p.position2}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#00DF59]">{p.estValueFormatted}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Position Clusters */}
          <div className="flex items-center border border-[#222B3D] bg-[#141A24] rounded-lg p-0.5">
            {(['GK', 'DF', 'MF', 'FW'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedCluster(pos)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  selectedCluster === pos
                    ? 'bg-[#00DF59] text-black'
                    : 'text-[#8E9EB5] hover:text-white'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Quick Metrics */}
          {[
            { label: 'AGE', val: '18 – 25' },
            { label: 'MINUTES', val: '≥ 900' },
            { label: 'VALUATION', val: '≤ €60M' },
          ].map(({ label, val }) => (
            <div key={label} className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-[#222B3D] bg-[#141A24] rounded-lg text-[10px] font-mono">
              <span className="text-[#596982]">{label}</span>
              <span className="text-white font-bold">{val}</span>
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB5] hidden sm:inline">
            1,842 Screened
          </span>
          <button
            onClick={() => setIsWeightsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border border-[#222B3D] bg-[#141A24] hover:bg-[#1D2534] rounded-lg text-xs font-bold text-white transition-colors"
          >
            <SlidersHorizontal size={13} />
            <span>Weights</span>
          </button>
          <button
            onClick={() => showToast('Shortlist exported to CSV')}
            className="flex items-center gap-2 px-4 py-2 bg-[#00DF59] hover:bg-[#00C84F] text-black text-xs font-bold rounded-lg transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>

      </div>

      {/* ── FotMob Anchor Player Banner ────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Identity */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#1D2534] border-2 border-[#222B3D] flex items-center justify-center font-display font-black text-xl text-white">
                MØ
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-[#141A24] border border-[#222B3D] text-xs font-bold leading-none">
                🇳🇴
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display font-black text-2xl lg:text-3xl text-white leading-none">
                  {anchorPlayer.name}
                </h1>
                <span className="fm-rating-high text-xs">{anchorPlayer.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-[#8E9EB5]">
                <span className="text-white font-bold">{anchorPlayer.team?.name}</span>
                <span>·</span>
                <span>{anchorPlayer.position2}</span>
                <span>·</span>
                <span className="text-[#00DF59] font-bold">{anchorPlayer.estValueFormatted}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t lg:border-t-0 lg:border-l border-[#222B3D] pt-6 lg:pt-0 lg:pl-8 font-mono">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#596982] block">Key Passes / 90</span>
              <span className="font-display font-black text-2xl text-white block mt-1">{anchorPlayer.keyPassesP90}</span>
              <span className="text-[10px] text-[#00DF59] block mt-0.5">{anchorPlayer.keyPassesPercentile} %ile</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#596982] block">Prog. Carries</span>
              <span className="font-display font-black text-2xl text-white block mt-1">{anchorPlayer.progCarriesP90}</span>
              <span className="text-[10px] text-[#00DF59] block mt-0.5">{anchorPlayer.progCarriesPercentile} %ile</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#596982] block">Exp. Assist (xA)</span>
              <span className="font-display font-black text-2xl text-white block mt-1">{anchorPlayer.xaP90}</span>
              <span className="text-[10px] text-[#00DF59] block mt-0.5">{anchorPlayer.xaPercentile} %ile</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#596982] block">Press Success</span>
              <span className="font-display font-black text-2xl text-white block mt-1">{anchorPlayer.pressSuccessPct}</span>
              <span className="text-[10px] text-[#00DF59] block mt-0.5">{anchorPlayer.pressPercentile} %ile</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Trio Modules (FotMob Card Containers) ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: Season Performance Table */}
        <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#222B3D] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Season Stats</span>
              <span className="text-[10px] font-mono text-[#596982]">2024–25 ALL COMPS</span>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
              {[
                { label: 'GOALS', val: anchorPlayer.goals },
                { label: 'ASSISTS', val: anchorPlayer.assists },
                { label: 'MATCHES', val: anchorPlayer.matches },
                { label: 'STARTED', val: anchorPlayer.started },
                { label: 'MINUTES', val: anchorPlayer.minutes },
                { label: 'RATING', val: anchorPlayer.rating.toFixed(1), isRating: true },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-[#1D2534] rounded-lg border border-[#222B3D]">
                  <span className="text-[9px] uppercase tracking-wider text-[#8E9EB5] block">{item.label}</span>
                  {item.isRating ? (
                    <div className="mt-1">
                      <span className="fm-rating-high text-xs">{item.val}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-white tabular-nums block mt-0.5">{item.val}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#8E9EB5] mt-6 border-t border-[#222B3D] pt-3">
            Elite chance creation in half-spaces with consistent match ratings.
          </p>
        </div>

        {/* Module 2: Radar Chart */}
        <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#222B3D] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Attribute Radar</span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="w-2 h-2 rounded-full bg-[#00DF59]" />
                  {anchorPlayer.name.split(' ')[1]}
                </span>
                <span className="flex items-center gap-1.5 text-[#8E9EB5]">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  {comparisonTarget.player.name.split(' ')[1]}
                </span>
              </div>
            </div>

            <div className="min-h-[170px] flex items-center justify-center">
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
          </div>

          <span className="text-[10px] font-mono uppercase tracking-wider text-[#596982] mt-4 border-t border-[#222B3D] pt-3 block text-center">
            Comparison Benchmark
          </span>
        </div>

        {/* Module 3: Tactical Positioning */}
        <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#222B3D] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Position Heatmap</span>
              <span className="text-[10px] font-mono text-[#00DF59] font-bold">{anchorPlayer.position2}</span>
            </div>

            <div className="h-28 rounded-lg border border-[#222B3D] overflow-hidden mb-4">
              <MiniPitch position={anchorPlayer.position2 ?? 'AM'} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-[#596982] block mb-1">Key Strengths</span>
                <ul className="space-y-1 text-[#8E9EB5] text-[11px]">
                  {anchorPlayer.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-[#00DF59] font-bold">+</span>
                      <span className="truncate">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#596982] block mb-1">Weaknesses</span>
                <ul className="space-y-1 text-[#596982] text-[11px]">
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

          <span className="text-[10px] font-mono uppercase tracking-wider text-[#596982] border-t border-[#222B3D] pt-3 block">
            Offensive Playmaker
          </span>
        </div>

      </div>

      {/* ── Bottom Section: Match Stats with FotMob Rating Badges ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Match Registry (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#222B3D] bg-[#141A24] p-6">
          <div className="flex items-center justify-between border-b border-[#222B3D] pb-4 mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#596982] block">Performance Log</span>
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-white mt-0.5">
                Recent Matches
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#8E9EB5]">Premier League 23/24</span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_50px_40px_40px_60px] pb-2 border-b border-[#222B3D] text-[10px] font-mono uppercase tracking-wider text-[#596982]">
            <span>Opponent</span>
            <span className="text-center">Score</span>
            <span className="text-center">Mins</span>
            <span className="text-center">G</span>
            <span className="text-center">A</span>
            <span className="text-right">FotMob</span>
          </div>

          {/* Table Rows with FotMob Rating Badges & W/D Dots */}
          <div className="divide-y divide-[#222B3D]/60 font-mono text-xs">
            {MATCH_STATS.map((m, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_50px_40px_40px_60px] items-center py-3 hover:bg-[#1D2534] px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={m.result === 'W' ? 'fm-form-w' : 'fm-form-d'}>
                    {m.result}
                  </span>
                  <span className="font-semibold text-white truncate">{m.opponent}</span>
                </div>
                <div className="text-center font-bold text-white">
                  {m.score}
                </div>
                <span className="text-center text-[#8E9EB5]">{m.mins}&apos;</span>
                <span className="text-center text-white font-bold">{m.goals}</span>
                <span className="text-center text-white font-bold">{m.assists}</span>
                <div className="text-right">
                  <span className="fm-rating-high text-xs">{m.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#222B3D] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#596982] block">AI Similarity Engine</span>
                <h3 className="font-display font-black text-sm uppercase tracking-wider text-white mt-0.5">
                  Compatible Alternatives
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#00DF59] font-bold uppercase">Top 5 Matches</span>
            </div>

            <div className="divide-y divide-[#222B3D]">
              {sortedRecommendations.map((rec) => {
                const isSelected = comparisonTarget.player.id === rec.player.id;
                return (
                  <div
                    key={rec.player.id}
                    onClick={() => { setComparisonTarget(rec); showToast(`Comparison set to ${rec.player.name}`); }}
                    className={`p-3.5 flex items-center justify-between cursor-pointer rounded-lg transition-colors ${
                      isSelected ? 'bg-[#1D2534] border-l-4 border-[#00DF59]' : 'hover:bg-[#1D2534]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rec.player.name}</span>
                        <span className={rec.ratingClass}>{rec.ratingFormatted}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8E9EB5] block mt-0.5">
                        {rec.player.team?.name} · {rec.player.age}y · €{(rec.player.marketValue ? rec.player.marketValue / 1e6 : 0).toFixed(0)}M
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className={`text-base font-black tabular-nums block ${isSelected ? 'text-[#00DF59]' : 'text-white'}`}>
                        {rec.matchPercentage.toFixed(1)}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#596982]">Match</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Differential Bar */}
          <div className="border-t border-[#222B3D] pt-4 mt-6 grid grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#596982] block">Shot Creating Act.</span>
              <span className="text-white font-bold mt-1 block">
                {anchorPlayer.per90.sca.toFixed(2)} vs {comparisonTarget.per90.sca.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#596982] block">Box Entries / 90</span>
              <span className="text-white font-bold mt-1 block">
                {anchorPlayer.per90.penaltyBoxPasses.toFixed(2)} vs {comparisonTarget.per90.penaltyBoxPasses.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Weights Modal ──────────────────────────────────────────────────── */}
      {isWeightsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setIsWeightsModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#222B3D] pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Algorithm Matrix Weights</span>
              <button onClick={() => setIsWeightsModalOpen(false)} className="text-[#8E9EB5] hover:text-white text-xs font-mono">
                [Close]
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
                    <span className="text-[#8E9EB5]">{label}</span>
                    <span className="text-[#00DF59] font-bold">{val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1D2534] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00DF59]" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsWeightsModalOpen(false)}
              className="w-full mt-6 py-2.5 bg-[#00DF59] hover:bg-[#00C84F] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Recalculate Similarity
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
