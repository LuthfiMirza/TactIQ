'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
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
  homeShort: string;
  awayShort: string;
  homeColor: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  competition: string;
  outcomeBadge: string;
  outcomeType: 'win-home' | 'win-away' | 'draw';
  formResult: 'W' | 'D' | 'L';
}

const H2H_ENCOUNTERS: H2HEncounter[] = [
  {
    date: '31 Mar 2024', homeTeam: 'Man City', awayTeam: 'Arsenal',
    homeShort: 'MCI', awayShort: 'ARS', homeColor: '#6CABDD', awayColor: '#EF0107',
    homeScore: 0, awayScore: 0, venue: 'Etihad Stadium',
    competition: 'Premier League', outcomeBadge: 'Draw', outcomeType: 'draw',
    formResult: 'D',
  },
  {
    date: '08 Okt 2023', homeTeam: 'Arsenal', awayTeam: 'Man City',
    homeShort: 'ARS', awayShort: 'MCI', homeColor: '#EF0107', awayColor: '#6CABDD',
    homeScore: 1, awayScore: 0, venue: 'Emirates Stadium',
    competition: 'Premier League', outcomeBadge: 'Arsenal Win', outcomeType: 'win-home',
    formResult: 'W',
  },
  {
    date: '06 Agu 2023', homeTeam: 'Arsenal', awayTeam: 'Man City',
    homeShort: 'ARS', awayShort: 'MCI', homeColor: '#EF0107', awayColor: '#6CABDD',
    homeScore: 1, awayScore: 1, venue: 'Wembley Stadium',
    competition: 'Community Shield', outcomeBadge: 'Arsenal Pens', outcomeType: 'win-home',
    formResult: 'W',
  },
  {
    date: '26 Apr 2023', homeTeam: 'Man City', awayTeam: 'Arsenal',
    homeShort: 'MCI', awayShort: 'ARS', homeColor: '#6CABDD', awayColor: '#EF0107',
    homeScore: 4, awayScore: 1, venue: 'Etihad Stadium',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-away',
    formResult: 'L',
  },
  {
    date: '15 Feb 2023', homeTeam: 'Arsenal', awayTeam: 'Man City',
    homeShort: 'ARS', awayShort: 'MCI', homeColor: '#EF0107', awayColor: '#6CABDD',
    homeScore: 1, awayScore: 3, venue: 'Emirates Stadium',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-away',
    formResult: 'L',
  },
];

const MATCHDAY_FIXTURES: MatchFixture[] = [
  {
    id: 'fix-1', homeTeam: 'Liverpool', homeShort: 'LIV', homeColor: '#C8102E',
    awayTeam: 'Chelsea', awayShort: 'CHE', awayColor: '#034694',
    homeScore: 3, awayScore: 1, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: 'Anfield', xgHome: 2.88, xgAway: 0.94, matchdayNote: 'High Conversion',
  },
  {
    id: 'fix-2', homeTeam: 'Aston Villa', homeShort: 'AVL', homeColor: '#95BFE5',
    awayTeam: 'Spurs', awayShort: 'TOT', awayColor: '#132257',
    timeOrStatus: '20:00 Today', statusType: 'UPCOMING',
    venue: 'Villa Park', projectedResult: 'Villa 2 — 1 Spurs', winProbHome: 48,
  },
  {
    id: 'fix-3', homeTeam: 'Newcastle', homeShort: 'NEW', homeColor: '#241F20',
    awayTeam: 'Brighton', awayShort: 'BHA', awayColor: '#0057B8',
    homeScore: 0, awayScore: 0, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: "St. James' Park", xgHome: 0.88, xgAway: 0.74, matchdayNote: 'Low Block Draw',
  },
  {
    id: 'fix-4', homeTeam: 'Bournemouth', homeShort: 'BOU', homeColor: '#DA291C',
    awayTeam: 'Arsenal', awayShort: 'ARS', awayColor: '#EF0107',
    timeOrStatus: '16:30 Tomorrow', statusType: 'UPCOMING',
    venue: 'Vitality Stadium', projectedResult: 'Sim Readiness: 94%', matchdayNote: 'Preview Active',
  },
];

const LEAGUE_STANDINGS = [
  { rank: 1, club: 'Arsenal', played: 8, gd: '+32', pts: 58, form: ['W', 'W', 'W'], isLeader: true },
  { rank: 2, club: 'Man City', played: 8, gd: '+29', pts: 56, form: ['W', 'D', 'L'], isLeader: false },
  { rank: 3, club: 'Liverpool', played: 8, gd: '+24', pts: 54, form: ['W', 'W', 'D'], isLeader: false },
  { rank: 4, club: 'Aston Villa', played: 7, gd: '+12', pts: 49, form: ['W', 'W', 'L'], isLeader: false },
];

const STATS_DATA = {
  ALL: {
    top: [
      { label: 'Ball possession', homeVal: '53%', awayVal: '47%', homeNum: 53, awayNum: 47 },
      { label: 'Expected goals (xG)', homeVal: '1.84', awayVal: '1.12', homeNum: 1.84, awayNum: 1.12 },
      { label: 'Total shots', homeVal: 14, awayVal: 9, homeNum: 14, awayNum: 9 },
      { label: 'Shots on target', homeVal: 6, awayVal: 3, homeNum: 6, awayNum: 3 },
      { label: 'Big chances', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
      { label: 'Touches in opp. box', homeVal: 28, awayVal: 19, homeNum: 28, awayNum: 19 },
      { label: 'Accurate passes', homeVal: '482 (88%)', awayVal: '390 (84%)', homeNum: 482, awayNum: 390 },
      { label: 'Corners', homeVal: 6, awayVal: 4, homeNum: 6, awayNum: 4 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 5, awayVal: 4, homeNum: 5, awayNum: 4 },
      { label: 'Blocked shots', homeVal: 3, awayVal: 2, homeNum: 3, awayNum: 2 },
      { label: 'Shots inside box', homeVal: 10, awayVal: 5, homeNum: 10, awayNum: 5 },
      { label: 'Shots outside box', homeVal: 4, awayVal: 4, homeNum: 4, awayNum: 4 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 234, awayVal: 210, homeNum: 234, awayNum: 210 },
      { label: 'Opposition half', homeVal: 248, awayVal: 180, homeNum: 248, awayNum: 180 },
      { label: 'Accurate long balls', homeVal: '22 (65%)', awayVal: '26 (58%)', homeNum: 22, awayNum: 26 },
      { label: 'Accurate crosses', homeVal: '5 (38%)', awayVal: '3 (25%)', homeNum: 5, awayNum: 3 },
      { label: 'Offsides', homeVal: 1, awayVal: 2, homeNum: 1, awayNum: 2 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '15 (75%)', awayVal: '12 (60%)', homeNum: 15, awayNum: 12 },
      { label: 'Interceptions', homeVal: 8, awayVal: 6, homeNum: 8, awayNum: 6 },
      { label: 'Clearances', homeVal: 18, awayVal: 22, homeNum: 18, awayNum: 22 },
      { label: 'Keeper saves', homeVal: 2, awayVal: 4, homeNum: 2, awayNum: 4 },
      { label: 'Fouls committed', homeVal: 9, awayVal: 11, homeNum: 9, awayNum: 11 },
    ],
  },
  '1ST': {
    top: [
      { label: 'Ball possession', homeVal: '51%', awayVal: '49%', homeNum: 51, awayNum: 49 },
      { label: 'Expected goals (xG)', homeVal: '0.92', awayVal: '0.78', homeNum: 0.92, awayNum: 0.78 },
      { label: 'Total shots', homeVal: 7, awayVal: 5, homeNum: 7, awayNum: 5 },
      { label: 'Shots on target', homeVal: 3, awayVal: 2, homeNum: 3, awayNum: 2 },
      { label: 'Big chances', homeVal: 1, awayVal: 1, homeNum: 1, awayNum: 1 },
      { label: 'Touches in opp. box', homeVal: 13, awayVal: 10, homeNum: 13, awayNum: 10 },
      { label: 'Accurate passes', homeVal: '240 (89%)', awayVal: '215 (86%)', homeNum: 240, awayNum: 215 },
      { label: 'Corners', homeVal: 3, awayVal: 2, homeNum: 3, awayNum: 2 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 3, awayVal: 2, homeNum: 3, awayNum: 2 },
      { label: 'Blocked shots', homeVal: 1, awayVal: 1, homeNum: 1, awayNum: 1 },
      { label: 'Shots inside box', homeVal: 5, awayVal: 3, homeNum: 5, awayNum: 3 },
      { label: 'Shots outside box', homeVal: 2, awayVal: 2, homeNum: 2, awayNum: 2 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 120, awayVal: 115, homeNum: 120, awayNum: 115 },
      { label: 'Opposition half', homeVal: 120, awayVal: 100, homeNum: 120, awayNum: 100 },
      { label: 'Accurate long balls', homeVal: '10 (62%)', awayVal: '12 (55%)', homeNum: 10, awayNum: 12 },
      { label: 'Accurate crosses', homeVal: '2 (33%)', awayVal: '1 (20%)', homeNum: 2, awayNum: 1 },
      { label: 'Offsides', homeVal: 0, awayVal: 1, homeNum: 0, awayNum: 1 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '8 (80%)', awayVal: '6 (60%)', homeNum: 8, awayNum: 6 },
      { label: 'Interceptions', homeVal: 4, awayVal: 3, homeNum: 4, awayNum: 3 },
      { label: 'Clearances', homeVal: 9, awayVal: 11, homeNum: 9, awayNum: 11 },
      { label: 'Keeper saves', homeVal: 1, awayVal: 2, homeNum: 1, awayNum: 2 },
      { label: 'Fouls committed', homeVal: 4, awayVal: 5, homeNum: 4, awayNum: 5 },
    ],
  },
  '2ND': {
    top: [
      { label: 'Ball possession', homeVal: '56%', awayVal: '44%', homeNum: 56, awayNum: 44 },
      { label: 'Expected goals (xG)', homeVal: '0.92', awayVal: '0.34', homeNum: 0.92, awayNum: 0.34 },
      { label: 'Total shots', homeVal: 7, awayVal: 4, homeNum: 7, awayNum: 4 },
      { label: 'Shots on target', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
      { label: 'Big chances', homeVal: 2, awayVal: 0, homeNum: 2, awayNum: 0 },
      { label: 'Touches in opp. box', homeVal: 15, awayVal: 9, homeNum: 15, awayNum: 9 },
      { label: 'Accurate passes', homeVal: '242 (87%)', awayVal: '175 (82%)', homeNum: 242, awayNum: 175 },
      { label: 'Corners', homeVal: 3, awayVal: 2, homeNum: 3, awayNum: 2 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 2, awayVal: 2, homeNum: 2, awayNum: 2 },
      { label: 'Blocked shots', homeVal: 2, awayVal: 1, homeNum: 2, awayNum: 1 },
      { label: 'Shots inside box', homeVal: 5, awayVal: 2, homeNum: 5, awayNum: 2 },
      { label: 'Shots outside box', homeVal: 2, awayVal: 2, homeNum: 2, awayNum: 2 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 114, awayVal: 95, homeNum: 114, awayNum: 95 },
      { label: 'Opposition half', homeVal: 128, awayVal: 80, homeNum: 128, awayNum: 80 },
      { label: 'Accurate long balls', homeVal: '12 (67%)', awayVal: '14 (61%)', homeNum: 12, awayNum: 14 },
      { label: 'Accurate crosses', homeVal: '3 (43%)', awayVal: '2 (29%)', homeNum: 3, awayNum: 2 },
      { label: 'Offsides', homeVal: 1, awayVal: 1, homeNum: 1, awayNum: 1 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '7 (70%)', awayVal: '6 (60%)', homeNum: 7, awayNum: 6 },
      { label: 'Interceptions', homeVal: 4, awayVal: 3, homeNum: 4, awayNum: 3 },
      { label: 'Clearances', homeVal: 9, awayVal: 11, homeNum: 9, awayNum: 11 },
      { label: 'Keeper saves', homeVal: 1, awayVal: 2, homeNum: 1, awayNum: 2 },
      { label: 'Fouls committed', homeVal: 5, awayVal: 6, homeNum: 5, awayNum: 6 },
    ],
  },
};

const LINEUPS = {
  home: {
    formation: '4-3-3',
    starters: [
      { num: 22, name: 'David Raya', pos: 'GK' },
      { num: 4, name: 'Ben White', pos: 'RB' },
      { num: 2, name: 'William Saliba', pos: 'CB' },
      { num: 6, name: 'Gabriel', pos: 'CB' },
      { num: 12, name: 'Jurriën Timber', pos: 'LB' },
      { num: 5, name: 'Thomas Partey', pos: 'DM' },
      { num: 41, name: 'Declan Rice', pos: 'CM' },
      { num: 8, name: 'Martin Ødegaard', pos: 'AM', isCaptain: true },
      { num: 7, name: 'Bukayo Saka', pos: 'RW' },
      { num: 29, name: 'Kai Havertz', pos: 'ST' },
      { num: 11, name: 'Gabriel Martinelli', pos: 'LW' },
    ],
  },
  away: {
    formation: '4-1-4-1',
    starters: [
      { num: 31, name: 'Ederson', pos: 'GK' },
      { num: 2, name: 'Kyle Walker', pos: 'RB', isCaptain: true },
      { num: 3, name: 'Rúben Dias', pos: 'CB' },
      { num: 25, name: 'Manuel Akanji', pos: 'CB' },
      { num: 24, name: 'Joško Gvardiol', pos: 'LB' },
      { num: 16, name: 'Rodri', pos: 'DM' },
      { num: 20, name: 'Bernardo Silva', pos: 'RM' },
      { num: 17, name: 'Kevin De Bruyne', pos: 'AM' },
      { num: 47, name: 'Phil Foden', pos: 'AM' },
      { num: 10, name: 'Jack Grealish', pos: 'LM' },
      { num: 9, name: 'Erling Haaland', pos: 'ST' },
    ],
  },
};

function MatchStatRow({
  label,
  homeVal,
  awayVal,
  homeNum,
  awayNum,
  homeColor = '#EF0107',
  awayColor = '#6CABDD',
}: {
  label: string;
  homeVal: string | number;
  awayVal: string | number;
  homeNum: number;
  awayNum: number;
  homeColor?: string;
  awayColor?: string;
}) {
  const total = homeNum + awayNum;
  const homePct = total > 0 ? Math.round((homeNum / total) * 100) : 50;
  const awayPct = 100 - homePct;
  const isHomeWinner = homeNum > awayNum;
  const isAwayWinner = awayNum > homeNum;

  return (
    <div className="py-2 sm:py-2.5">
      <div className="flex items-center justify-between text-xs mb-1 font-mono">
        <span className={`w-14 sm:w-20 text-left truncate ${isHomeWinner ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
          {homeVal}
        </span>
        <span className="text-[11px] sm:text-xs font-sans font-medium text-slate-600 dark:text-slate-300 text-center flex-1 truncate px-1 sm:px-2">
          {label}
        </span>
        <span className={`w-14 sm:w-20 text-right truncate ${isAwayWinner ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
          {awayVal}
        </span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 gap-1">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${homePct}%`, backgroundColor: homeColor }}
        />
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
        />
      </div>
    </div>
  );
}

export default function MatchCenterPage() {
  const [filterTab, setFilterTab] = useState<'ALL' | 'FINISHED' | 'UPCOMING'>('ALL');
  const [matchTab, setMatchTab] = useState<'stats' | 'h2h' | 'lineups' | 'table'>('stats');
  const [statsPeriod, setStatsPeriod] = useState<'ALL' | '1ST' | '2ND'>('ALL');
  const [showAiModal, setShowAiModal] = useState(false);

  const activeStats = STATS_DATA[statsPeriod];

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      
      {/* ── Matchday Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#27272A] pb-3">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors shrink-0">
            <ChevronLeft size={14} />
          </button>
          <div>
            <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">GW08 · Premier League</span>
          </div>
          <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors shrink-0">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] rounded-lg p-0.5 shadow-xs w-fit">
          {(['ALL', 'FINISHED', 'UPCOMING'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                filterTab === tab
                  ? 'bg-[#00A83F] dark:bg-[#10B981] text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Match Card with Tabs ── */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 sm:p-7 shadow-xs overflow-hidden transition-colors">
        
        {/* Meta Header */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-[#27272A]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A83F] dark:bg-[#10B981] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate max-w-[200px] sm:max-w-none">
              Emirates Stadium · PL GW08
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-xs font-mono text-[#00A83F] dark:text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#00A83F] dark:bg-[#10B981] animate-pulse" />
            <span>68&apos; LIVE</span>
          </div>
        </div>

        {/* Score & Clubs */}
        <div className="py-4 sm:py-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-8">
            
            {/* Home: Arsenal */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 text-right min-w-0">
              <div className="min-w-0">
                <h2 className="font-extrabold text-base sm:text-2xl text-slate-900 dark:text-white leading-tight truncate">
                  <span className="hidden sm:inline">Arsenal</span>
                  <span className="sm:hidden">ARS</span>
                </h2>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">1st in PL</span>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#EF0107] to-[#BA0C2F] flex items-center justify-center font-black text-xs sm:text-sm text-white shadow-sm shrink-0 ring-2 ring-slate-100 dark:ring-[#27272A]">
                ARS
              </div>
            </div>

            {/* Monumental Center Score & Status */}
            <div className="flex flex-col items-center justify-center px-1.5 sm:px-8 shrink-0">
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <span className="font-extrabold text-3xl sm:text-5xl text-slate-900 dark:text-white tracking-tight tabular-nums">2</span>
                <span className="font-normal text-xl sm:text-3xl text-slate-300 dark:text-slate-600">-</span>
                <span className="font-extrabold text-3xl sm:text-5xl text-slate-900 dark:text-white tracking-tight tabular-nums">1</span>
              </div>
              <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5 sm:mt-1 whitespace-nowrap">
                68&apos; Live
              </span>
            </div>

            {/* Away: Manchester City */}
            <div className="flex items-center justify-start gap-2 sm:gap-4 text-left min-w-0">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#6CABDD] to-[#458BB8] flex items-center justify-center font-black text-xs sm:text-sm text-white shadow-sm shrink-0 ring-2 ring-slate-100 dark:ring-[#27272A]">
                MCI
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-base sm:text-2xl text-slate-900 dark:text-white leading-tight truncate">
                  <span className="hidden sm:inline">Man City</span>
                  <span className="sm:hidden">MCI</span>
                </h2>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">2nd in PL</span>
              </div>
            </div>

          </div>

          {/* Symmetrical Scorers Row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-8 mt-3 sm:mt-5 pt-2 sm:pt-3 border-t border-slate-100/80 dark:border-[#27272A] text-xs">
            <div className="text-right space-y-0.5 sm:space-y-1 text-slate-600 dark:text-zinc-300 text-[11px] sm:text-xs">
              <span className="block truncate">B. Saka 34&apos;</span>
              <span className="block truncate">G. Martinelli 58&apos;</span>
            </div>
            <div className="flex items-center justify-center px-2 sm:px-4 pt-0.5 text-slate-400 dark:text-zinc-500 text-xs select-none">
              <span>⚽</span>
            </div>
            <div className="text-left space-y-0.5 sm:space-y-1 text-slate-600 dark:text-zinc-300 text-[11px] sm:text-xs">
              <span className="block truncate">E. Haaland 42&apos; (P)</span>
            </div>
          </div>
        </div>

        {/* Live Win Probability Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#27272A]">
          <div className="flex items-center justify-between text-xs font-mono pb-2">
            <div className="flex items-center gap-5">
              <span className="text-[#00A83F] dark:text-[#10B981] font-bold">ARS 58%</span>
              <span className="text-slate-500 dark:text-zinc-400">Draw 24%</span>
              <span className="text-sky-700 dark:text-sky-400 font-bold">MCI 18%</span>
            </div>
          </div>
          
          <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full flex overflow-hidden">
            <div className="h-full bg-[#00A83F] dark:bg-[#10B981]" style={{ width: '58%' }} />
            <div className="h-full bg-slate-300 dark:bg-zinc-600" style={{ width: '24%' }} />
            <div className="h-full bg-sky-500" style={{ width: '18%' }} />
          </div>
        </div>

        {/* ── Match Tabs Bar ── */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#27272A] pt-6 pb-2.5 overflow-x-auto">
          {(['stats', 'h2h', 'lineups', 'table'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMatchTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                matchTab === tab
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
              }`}
            >
              {tab === 'stats' ? 'Match Stats' : tab === 'h2h' ? 'H2H' : tab === 'lineups' ? 'Lineups' : 'Table'}
            </button>
          ))}
        </div>

        {/* ── Tab Content: STATS ── */}
        {matchTab === 'stats' && (
          <div className="pt-4 space-y-6">
            {/* Period Selector (ALL · 1ST · 2ND) */}
            <div className="flex items-center justify-center gap-1.5 pb-2">
              {(['ALL', '1ST', '2ND'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setStatsPeriod(period)}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                    statsPeriod === period
                      ? 'bg-[#00A83F] dark:bg-[#10B981] text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  {period === 'ALL' ? 'All Match' : period === '1ST' ? '1st Half' : '2nd Half'}
                </button>
              ))}
            </div>

            {/* Top Stats Section */}
            <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-[#27272A]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                Top Stats
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                {activeStats.top.map((s, idx) => (
                  <MatchStatRow key={idx} {...s} />
                ))}
              </div>
            </div>

            {/* Two-column grid for Shots and Passes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shots Section */}
              <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-4 border border-slate-100 dark:border-[#27272A]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                  Shots
                </div>
                <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                  {activeStats.shots.map((s, idx) => (
                    <MatchStatRow key={idx} {...s} />
                  ))}
                </div>
              </div>

              {/* Passes Section */}
              <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-4 border border-slate-100 dark:border-[#27272A]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                  Passes
                </div>
                <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                  {activeStats.passes.map((s, idx) => (
                    <MatchStatRow key={idx} {...s} />
                  ))}
                </div>
              </div>
            </div>

            {/* Defence Section */}
            <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-4 border border-slate-100 dark:border-[#27272A]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                Defence & Duels
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                {activeStats.defence.map((s, idx) => (
                  <MatchStatRow key={idx} {...s} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: H2H ── */}
        {matchTab === 'h2h' && (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#27272A]">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Past Encounters</span>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-red-600 dark:text-red-400">2 ARS</span>
                <span className="text-slate-500 dark:text-zinc-400">1 D</span>
                <span className="text-sky-600 dark:text-sky-400">2 MCI</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {H2H_ENCOUNTERS.map((h, i) => (
                <div
                  key={i}
                  className="py-3 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors grid grid-cols-12 items-center gap-2 sm:gap-4"
                >
                  <div className="col-span-3 flex flex-col justify-center">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {h.date}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {h.competition}
                    </span>
                  </div>

                  <div className="col-span-7 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center justify-end gap-2 flex-1 text-right min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate hidden sm:inline">
                        {h.homeTeam}
                      </span>
                      <span className="sm:hidden text-xs font-bold text-slate-900 dark:text-white">
                        {h.homeShort}
                      </span>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: h.homeColor }}
                      >
                        {h.homeShort}
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums shrink-0 text-center min-w-[38px]">
                      <span>{h.homeScore}</span>
                      <span className="text-slate-300 dark:text-slate-600 mx-1.5 font-normal">-</span>
                      <span>{h.awayScore}</span>
                    </div>

                    <div className="flex items-center justify-start gap-2 flex-1 text-left min-w-0">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: h.awayColor }}
                      >
                        {h.awayShort}
                      </div>
                      <span className="sm:hidden text-xs font-bold text-slate-900 dark:text-white">
                        {h.awayShort}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate hidden sm:inline">
                        {h.awayTeam}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-2xs ${
                        h.formResult === 'W'
                          ? 'bg-[#16A34A] text-white'
                          : h.formResult === 'D'
                          ? 'bg-slate-400 dark:bg-[#3E4452] text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                      title={h.outcomeBadge}
                    >
                      {h.formResult}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab Content: LINEUPS ── */}
        {matchTab === 'lineups' && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Arsenal XI */}
            <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-4 border border-slate-100 dark:border-[#27272A]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 dark:border-[#27272A]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#EF0107]" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Arsenal</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {LINEUPS.home.formation}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {LINEUPS.home.starters.map((player) => (
                  <div key={player.num} className="flex items-center justify-between py-1 px-1 rounded hover:bg-slate-100/60 dark:hover:bg-[#1E1E24]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-right font-mono text-slate-400 text-[11px]">{player.num}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{player.name}</span>
                      {player.isCaptain && <span className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">C</span>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{player.pos}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Man City XI */}
            <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-4 border border-slate-100 dark:border-[#27272A]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 dark:border-[#27272A]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#6CABDD]" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Man City</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {LINEUPS.away.formation}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {LINEUPS.away.starters.map((player) => (
                  <div key={player.num} className="flex items-center justify-between py-1 px-1 rounded hover:bg-slate-100/60 dark:hover:bg-[#1E1E24]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-right font-mono text-slate-400 text-[11px]">{player.num}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{player.name}</span>
                      {player.isCaptain && <span className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">C</span>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{player.pos}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: TABLE ── */}
        {matchTab === 'table' && (
          <div className="pt-4">
            <div className="font-mono text-xs divide-y divide-slate-100 dark:divide-[#27272A]">
              <div className="flex justify-between py-1.5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                <span>Club</span>
                <div className="flex gap-4">
                  <span className="w-5 text-center">P</span>
                  <span className="w-6 text-center">GD</span>
                  <span className="w-6 text-right font-bold text-slate-900 dark:text-white">PTS</span>
                  <span className="w-14 text-right">Form</span>
                </div>
              </div>

              {LEAGUE_STANDINGS.map((row) => (
                <div key={row.rank} className="flex justify-between py-2 items-center hover:bg-slate-50 dark:hover:bg-[#1A1A1E] px-1 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 w-3 font-bold">{row.rank}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{row.club}</span>
                  </div>
                  <div className="flex gap-4 items-center tabular-nums">
                    <span className="w-5 text-center text-slate-600 dark:text-slate-400">{row.played}</span>
                    <span className="w-6 text-center text-slate-600 dark:text-slate-400">{row.gd}</span>
                    <span className="w-6 text-right font-bold text-slate-900 dark:text-white">{row.pts}</span>
                    <div className="w-14 flex items-center justify-end gap-1">
                      {row.form.map((f, i) => (
                        <span key={i} className={f === 'W' ? 'tq-form-w' : f === 'D' ? 'tq-form-d' : 'tq-form-l'}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Lower Workspace: Fixtures & Simulation ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 cols: GW08 Fixtures */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">GW08 Fixtures</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">4 Matches</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {MATCHDAY_FIXTURES.map((fix) => (
                <div
                  key={fix.id}
                  className="py-3 sm:py-3.5 px-2 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-xl transition-colors grid grid-cols-12 items-center gap-2 sm:gap-4"
                >
                  <div className="col-span-3 flex flex-col justify-center">
                    <span className={`text-xs font-bold ${
                      fix.timeOrStatus === 'FT' ? 'text-[#10B981]' : 'text-slate-900 dark:text-white'
                    }`}>
                      {fix.timeOrStatus}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {fix.venue}
                    </span>
                  </div>

                  <div className="col-span-6 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center justify-end gap-2 flex-1 text-right min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate hidden sm:inline">
                        {fix.homeTeam}
                      </span>
                      <span className="sm:hidden text-xs font-bold text-slate-900 dark:text-white">
                        {fix.homeShort}
                      </span>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: fix.homeColor }}
                      >
                        {fix.homeShort}
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums shrink-0 text-center min-w-[38px]">
                      {fix.homeScore !== undefined ? (
                        <>
                          <span>{fix.homeScore}</span>
                          <span className="text-slate-300 dark:text-slate-600 mx-1.5 font-normal">-</span>
                          <span>{fix.awayScore}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">VS</span>
                      )}
                    </div>

                    <div className="flex items-center justify-start gap-2 flex-1 text-left min-w-0">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: fix.awayColor }}
                      >
                        {fix.awayShort}
                      </div>
                      <span className="sm:hidden text-xs font-bold text-slate-900 dark:text-white">
                        {fix.awayShort}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate hidden sm:inline">
                        {fix.awayTeam}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 flex flex-col items-end justify-center text-right">
                    {fix.xgHome !== undefined ? (
                      <span className="text-xs text-slate-900 dark:text-white font-bold tabular-nums">
                        <span className="text-slate-500 font-normal text-[11px]">xG</span> {fix.xgHome} - {fix.xgAway}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {fix.projectedResult ?? 'Premier League'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 cols: Simulation Matrix */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs transition-colors">
            <div className="border-b border-slate-100 dark:border-[#27272A] pb-3 mb-3 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Simulation</span>
              <span className="text-[10px] font-mono text-[#10B981] font-bold">10K runs</span>
            </div>
            
            <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mb-4">
              ARS win probability: <span className="font-bold text-slate-900 dark:text-white">82%</span>
            </div>

            <button
              onClick={() => setShowAiModal(true)}
              className="w-full py-2.5 bg-slate-900 dark:bg-zinc-100 hover:bg-[#10B981] dark:hover:bg-[#10B981] text-white dark:text-zinc-900 dark:hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-xs"
            >
              View Matrix
            </button>
          </div>
        </div>

      </div>

      {/* ── AI Modal ───────────────────────────────────────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowAiModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-6 shadow-2xl transition-colors" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Score Probabilities</span>
              <button onClick={() => setShowAiModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-mono text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-100/70 dark:bg-[#1E1E24] rounded-lg border border-slate-300 dark:border-zinc-700">
                  <span className="text-base font-black text-slate-900 dark:text-white block">2 - 1</span>
                  <span className="text-[10px] text-[#10B981] font-bold">34.2%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-lg border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base font-black text-slate-900 dark:text-white block">2 - 2</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">21.8%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-lg border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base font-black text-slate-900 dark:text-white block">3 - 1</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">16.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
