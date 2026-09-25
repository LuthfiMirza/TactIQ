'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface MatchFixture {
  id: string;
  homeTeam: string;
  homeShort: string;
  homeColor: string;
  awayTeam: string;
  awayShort: string;
  awayColor: string;
  homeScore?: number;
  awayScore?: number;
  timeOrStatus: string;
  statusType: 'LIVE' | 'FINISHED' | 'UPCOMING';
  venue: string;
  xgHome?: number;
  xgAway?: number;
  projectedResult?: string;
  winProbHome?: number;
  matchdayNote?: string;
}

interface H2HEncounter {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  competition: string;
  outcomeBadge: string;
  outcomeType: 'win-home' | 'win-away' | 'draw';
}

const H2H_ENCOUNTERS: H2HEncounter[] = [
  {
    date: '31.03.24', homeTeam: 'Manchester City', awayTeam: 'Arsenal FC',
    homeScore: 0, awayScore: 0, venue: 'Etihad Stadium',
    competition: 'Premier League', outcomeBadge: 'Draw', outcomeType: 'draw',
  },
  {
    date: '08.10.23', homeTeam: 'Arsenal FC', awayTeam: 'Manchester City',
    homeScore: 1, awayScore: 0, venue: 'Emirates Stadium',
    competition: 'Premier League', outcomeBadge: 'Arsenal Win', outcomeType: 'win-home',
  },
  {
    date: '06.08.23', homeTeam: 'Arsenal FC', awayTeam: 'Manchester City',
    homeScore: 1, awayScore: 1, venue: 'Wembley Stadium',
    competition: 'Community Shield', outcomeBadge: 'Arsenal Pens', outcomeType: 'win-home',
  },
  {
    date: '26.04.23', homeTeam: 'Manchester City', awayTeam: 'Arsenal FC',
    homeScore: 4, awayScore: 1, venue: 'Etihad Stadium',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-away',
  },
  {
    date: '15.02.23', homeTeam: 'Arsenal FC', awayTeam: 'Manchester City',
    homeScore: 1, awayScore: 3, venue: 'Emirates Stadium',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-away',
  },
];

const MATCHDAY_FIXTURES: MatchFixture[] = [
  {
    id: 'fix-1', homeTeam: 'Liverpool FC', homeShort: 'LIV', homeColor: '#C8102E',
    awayTeam: 'Chelsea FC', awayShort: 'CHE', awayColor: '#034694',
    homeScore: 3, awayScore: 1, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: 'Anfield', xgHome: 2.88, xgAway: 0.94, matchdayNote: 'High Conversion',
  },
  {
    id: 'fix-2', homeTeam: 'Aston Villa', homeShort: 'AVL', homeColor: '#95BFE5',
    awayTeam: 'Tottenham Hotspur', awayShort: 'TOT', awayColor: '#132257',
    timeOrStatus: '20:00 Today', statusType: 'UPCOMING',
    venue: 'Villa Park', projectedResult: 'Villa 2 — 1 Spurs', winProbHome: 48,
  },
  {
    id: 'fix-3', homeTeam: 'Newcastle United', homeShort: 'NEW', homeColor: '#241F20',
    awayTeam: 'Brighton & Hove Albion', awayShort: 'BHA', awayColor: '#0057B8',
    homeScore: 0, awayScore: 0, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: "St. James' Park", xgHome: 0.88, xgAway: 0.74, matchdayNote: 'Low Block Draw',
  },
  {
    id: 'fix-4', homeTeam: 'AFC Bournemouth', homeShort: 'BOU', homeColor: '#DA291C',
    awayTeam: 'Arsenal FC', awayShort: 'ARS', awayColor: '#EF0107',
    timeOrStatus: '16:30 Tomorrow', statusType: 'UPCOMING',
    venue: 'Vitality Stadium', projectedResult: 'Sim Readiness: 94%', matchdayNote: 'Preview Active',
  },
];

const LEAGUE_STANDINGS = [
  { rank: 1, club: 'Arsenal FC', played: 8, gd: '+32', pts: 58, form: ['W', 'W', 'W'], isLeader: true },
  { rank: 2, club: 'Manchester City', played: 8, gd: '+29', pts: 56, form: ['W', 'D', 'L'], isLeader: false },
  { rank: 3, club: 'Liverpool FC', played: 8, gd: '+24', pts: 54, form: ['W', 'W', 'D'], isLeader: false },
  { rank: 4, club: 'Aston Villa', played: 7, gd: '+12', pts: 49, form: ['W', 'W', 'L'], isLeader: false },
];

export default function MatchCenterPage() {
  const [filterTab, setFilterTab] = useState<'ALL' | 'FINISHED' | 'UPCOMING'>('ALL');
  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <div className="w-full flex flex-col gap-8 pb-12">
      
      {/* ── Matchday Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B3D] pb-4">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-lg border border-[#222B3D] bg-[#141A24] flex items-center justify-center text-[#8E9EB5] hover:text-white transition-colors">
            <ChevronLeft size={14} />
          </button>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#596982] block">Schedule Database</span>
            <span className="font-display font-black text-xs uppercase tracking-wider text-white">Gameweek 08 / Premier League</span>
          </div>
          <button className="w-8 h-8 rounded-lg border border-[#222B3D] bg-[#141A24] flex items-center justify-center text-[#8E9EB5] hover:text-white transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center border border-[#222B3D] bg-[#141A24] rounded-lg p-0.5">
          {(['ALL', 'FINISHED', 'UPCOMING'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                filterTab === tab
                  ? 'bg-[#00DF59] text-black'
                  : 'text-[#8E9EB5] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Match Card (Concept B Matchday Pass + Club Lighting) ── */}
      <div className="relative rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border border-[#222B3D] bg-[#141A24] p-6 lg:p-8 shadow-2xl overflow-hidden">
        
        {/* Atmospheric Club Ambient Lights */}
        <div className="absolute top-0 left-0 w-2/5 h-full bg-gradient-to-r from-[#EF0107]/20 via-[#EF0107]/4 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-[#6CABDD]/20 via-[#6CABDD]/4 to-transparent pointer-events-none" />

        {/* Meta Header */}
        <div className="relative flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#222B3D]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00DF59] animate-pulse" />
            <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              MATCH PASS · Emirates Stadium, London · Premier League GW08
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-[#8E9EB5]">Ref: M. Oliver</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#092B16] border border-[#145A30] text-[#00DF59] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00DF59] animate-pulse" />
              <span>68&apos; Live</span>
            </div>
          </div>
        </div>

        {/* Score & Clubs */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 items-center gap-8 py-10">
          
          {/* Home: Arsenal */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EF0107] to-[#BA0C2F] border-2 border-white/20 flex items-center justify-center font-display font-black text-base text-white shadow-[0_0_24px_rgba(239,1,7,0.45)] shrink-0">
              ARS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white leading-none">
                  Arsenal FC
                </h2>
                <span className="text-[10px] font-mono text-[#EF0107] font-bold">[Home]</span>
              </div>
              <span className="text-xs font-mono text-[#FF5A5F] mt-1.5 block">B. Saka 34&apos;, G. Martinelli 58&apos;</span>
            </div>
          </div>

          {/* Monumental Center Score */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center border-y lg:border-y-0 lg:border-x border-[#222B3D] py-6 lg:py-0">
            <div className="flex items-center justify-center gap-6">
              <span className="font-display font-black text-6xl text-white tracking-tighter tabular-nums">2</span>
              <span className="font-display font-light text-3xl text-[#596982]">:</span>
              <span className="font-display font-black text-6xl text-white tracking-tighter tabular-nums">1</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[#00DF59] text-xs font-bold">
              <TrendingUp size={14} />
              <span>Arsenal Momentum +0.42 xT</span>
            </div>
          </div>

          {/* Away: Manchester City */}
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-end gap-4">
            <div className="text-left lg:text-right order-2 lg:order-1">
              <div className="flex items-center lg:justify-end gap-2">
                <span className="text-[10px] font-mono text-[#6CABDD] font-bold">[Away]</span>
                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-white leading-none">
                  Man City
                </h2>
              </div>
              <span className="text-xs font-mono text-[#6CABDD] mt-1.5 block">E. Haaland 42&apos; (P)</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6CABDD] to-[#458BB8] border-2 border-white/20 flex items-center justify-center font-display font-black text-base text-white order-1 lg:order-2 shadow-[0_0_24px_rgba(108,171,221,0.45)] shrink-0">
              MCI
            </div>
          </div>

        </div>

        {/* Ticket Perforated Divider with Cutout Notches */}
        <div className="relative flex items-center my-2">
          <div className="absolute -left-10 w-7 h-7 rounded-full bg-[#0B0E14] border border-[#222B3D] z-10 shadow-inner" />
          <div className="w-full border-t border-dashed border-[#222B3D] mx-2" />
          <div className="absolute -right-10 w-7 h-7 rounded-full bg-[#0B0E14] border border-[#222B3D] z-10 shadow-inner" />
        </div>

        {/* FotMob Live Win Probability Bar */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs font-mono pb-2.5">
            <span className="text-[10px] uppercase tracking-wider text-[#596982]">FotMob Live Probability</span>
            <div className="flex items-center gap-6">
              <span className="text-[#00DF59] font-bold">Arsenal 58%</span>
              <span className="text-[#8E9EB5]">Draw 24%</span>
              <span className="text-[#6CABDD] font-bold">Man City 18%</span>
            </div>
          </div>
          
          <div className="w-full h-2 bg-[#1D2534] rounded-full flex overflow-hidden">
            <div className="h-full bg-[#00DF59]" style={{ width: '58%' }} />
            <div className="h-full bg-[#596982]" style={{ width: '24%' }} />
            <div className="h-full bg-[#6CABDD]" style={{ width: '18%' }} />
          </div>
        </div>

        {/* 3 Telemetric Multi-Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#1D2534] border border-[#222B3D]">
            <div className="flex justify-between text-[#8E9EB5] text-[10px] uppercase mb-1">
              <span>Expected Goals (xG)</span>
              <span className="text-[#F59E0B] font-bold">Delta +0.72</span>
            </div>
            <div className="flex items-baseline justify-between text-xl font-bold text-white mt-1">
              <span className="text-[#F59E0B]">1.84</span>
              <span className="text-[10px] text-[#596982]">Non-Penalty xG</span>
              <span>1.12</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1D2534] border border-[#222B3D]">
            <div className="flex justify-between text-[#8E9EB5] text-[10px] uppercase mb-1">
              <span>Possession Share</span>
              <span className="text-white">Arsenal 53%</span>
            </div>
            <div className="flex items-baseline justify-between text-xl font-bold text-white mt-1">
              <span className="text-[#00DF59]">53%</span>
              <span className="text-[10px] text-[#596982]">Passes: 412 vs 388</span>
              <span>47%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1D2534] border border-[#222B3D]">
            <div className="flex justify-between text-[#8E9EB5] text-[10px] uppercase mb-1">
              <span>Big Chances</span>
              <span className="text-[#38BDF8] font-bold">Conv. 66%</span>
            </div>
            <div className="flex items-baseline justify-between text-xl font-bold text-white mt-1">
              <span className="text-[#00DF59]">3</span>
              <span className="text-[10px] text-[#596982]">Box Touches: 26 vs 14</span>
              <span>1</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Lower Workspace: H2H & Standings ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 cols: H2H Records & Matchday Fixtures */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* H2H Historical Table */}
          <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 shadow-xl">
            <div className="flex items-baseline justify-between border-b border-[#222B3D] pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#596982] block">Head-to-Head</span>
                <h3 className="font-display font-black text-sm uppercase tracking-wider text-white mt-0.5">
                  Recent Encounters
                </h3>
              </div>
              <span className="text-xs font-mono text-[#8E9EB5]">2 Arsenal · 1 Draw · 2 City</span>
            </div>

            <div className="divide-y divide-[#222B3D]/60 font-mono text-xs">
              {H2H_ENCOUNTERS.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-3 hover:bg-[#1D2534] px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[#8E9EB5] text-[11px]">{h.date}</span>
                    <span className="font-bold text-white">
                      {h.homeTeam} {h.homeScore} — {h.awayScore} {h.awayTeam}
                    </span>
                    <span className="text-[#596982] text-[10px] hidden sm:inline">({h.competition})</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${
                    h.outcomeType === 'win-home' ? 'bg-[#092B16] text-[#00DF59] border border-[#145A30]' : 'bg-[#1D2534] text-[#8E9EB5]'
                  }`}>
                    {h.outcomeBadge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gameweek Fixtures */}
          <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 shadow-xl">
            <div className="flex items-baseline justify-between border-b border-[#222B3D] pb-4 mb-4">
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                Gameweek 08 Schedule
              </h3>
              <span className="text-[10px] font-mono text-[#8E9EB5]">4 Matches</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MATCHDAY_FIXTURES.map((fix) => (
                <div key={fix.id} className="p-4 rounded-xl border border-[#222B3D] bg-[#1D2534] flex flex-col justify-between font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#222B3D] text-[#8E9EB5] text-[10px]">
                    <span className="font-bold text-[#00DF59] uppercase">{fix.timeOrStatus}</span>
                    <span>{fix.venue}</span>
                  </div>
                  
                  <div className="py-4 flex justify-between items-center text-sm font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: fix.homeColor }}>
                        {fix.homeShort}
                      </span>
                      <span>{fix.homeTeam}</span>
                    </div>

                    <span>{fix.homeScore !== undefined ? `${fix.homeScore} - ${fix.awayScore}` : 'VS'}</span>

                    <div className="flex items-center gap-2">
                      <span>{fix.awayTeam}</span>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: fix.awayColor }}>
                        {fix.awayShort}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#222B3D] flex justify-between text-[10px] text-[#8E9EB5]">
                    <span>{fix.matchdayNote ?? fix.projectedResult}</span>
                    {fix.xgHome && <span className="text-white font-bold">xG {fix.xgHome} : {fix.xgAway}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 4 cols: Standings & Monte Carlo */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Standings Table with FotMob Form Dots */}
          <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 shadow-xl">
            <div className="flex items-baseline justify-between border-b border-[#222B3D] pb-3 mb-3">
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                Live Standings (Top 4)
              </h3>
              <span className="text-[10px] font-mono text-[#8E9EB5] uppercase">PL Table</span>
            </div>

            <div className="font-mono text-xs divide-y divide-[#222B3D]/60">
              <div className="flex justify-between py-1.5 text-[10px] uppercase text-[#596982]">
                <span>Club</span>
                <div className="flex gap-3">
                  <span className="w-5 text-center">P</span>
                  <span className="w-6 text-center">GD</span>
                  <span className="w-6 text-right font-bold text-white">PTS</span>
                  <span className="w-14 text-right">Form</span>
                </div>
              </div>

              {LEAGUE_STANDINGS.map((row) => (
                <div key={row.rank} className="flex justify-between py-2.5 items-center hover:bg-[#1D2534] px-1 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8E9EB5] w-3 font-bold">{row.rank}</span>
                    <span className="font-bold text-white">{row.club}</span>
                  </div>
                  <div className="flex gap-3 items-center tabular-nums">
                    <span className="w-5 text-center text-[#8E9EB5]">{row.played}</span>
                    <span className="w-6 text-center text-[#8E9EB5]">{row.gd}</span>
                    <span className="w-6 text-right font-black text-white">{row.pts}</span>
                    <div className="w-14 flex items-center justify-end gap-1">
                      {row.form.map((f, i) => (
                        <span key={i} className={f === 'W' ? 'fm-form-w' : f === 'D' ? 'fm-form-d' : 'fm-form-l'}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monte Carlo Simulation Card */}
          <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 shadow-xl">
            <div className="border-b border-[#222B3D] pb-3 mb-3 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Simulation Engine</span>
              <span className="text-[10px] font-mono text-[#00DF59] font-bold bg-[#092B16] border border-[#145A30] px-2 py-0.5 rounded">
                10,000 Runs
              </span>
            </div>
            
            <p className="text-xs text-[#8E9EB5] font-sans leading-relaxed mb-4">
              State-space possession projections indicate an 82% probability for Arsenal to secure points against City overloads.
            </p>

            <button
              onClick={() => setShowAiModal(true)}
              className="w-full py-2.5 bg-[#1D2534] hover:bg-[#00DF59] hover:text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors border border-[#222B3D]"
            >
              Open Probability Matrix
            </button>
          </div>

        </div>

      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowAiModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-[#222B3D] bg-[#141A24] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#222B3D] pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Monte Carlo Distribution</span>
              <button onClick={() => setShowAiModal(false)} className="text-[#8E9EB5] hover:text-white font-mono text-xs">
                [Close]
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#1D2534] rounded-xl border border-[#222B3D]">
                <span className="text-[10px] uppercase text-[#8E9EB5] block mb-3">Most Probable Full-Time Scores</span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-[#141A24] rounded-lg border border-[#00DF59]/40">
                    <span className="text-base font-black text-white block">2 - 1</span>
                    <span className="text-[10px] text-[#00DF59] font-bold">34.2% Prob</span>
                  </div>
                  <div className="p-3 bg-[#141A24] rounded-lg border border-[#222B3D]">
                    <span className="text-base font-black text-white block">2 - 2</span>
                    <span className="text-[10px] text-[#8E9EB5]">21.8% Prob</span>
                  </div>
                  <div className="p-3 bg-[#141A24] rounded-lg border border-[#222B3D]">
                    <span className="text-base font-black text-white block">3 - 1</span>
                    <span className="text-[10px] text-[#8E9EB5]">16.4% Prob</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#8E9EB5] leading-relaxed">
                Calibrated on 420,000 historical sequences with state-space pressing metrics and xG conversion models.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
