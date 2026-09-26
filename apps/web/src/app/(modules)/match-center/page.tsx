'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  X,
} from 'lucide-react';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';

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
    date: '25 Mei 2024', homeTeam: 'Man City', awayTeam: 'Man United',
    homeShort: 'MCI', awayShort: 'MUN', homeColor: '#6CABDD', awayColor: '#DA291C',
    homeScore: 1, awayScore: 2, venue: 'Wembley Stadium',
    competition: 'FA Cup Final', outcomeBadge: 'United Win', outcomeType: 'win-away',
    formResult: 'W',
  },
  {
    date: '03 Mar 2024', homeTeam: 'Man City', awayTeam: 'Man United',
    homeShort: 'MCI', awayShort: 'MUN', homeColor: '#6CABDD', awayColor: '#DA291C',
    homeScore: 3, awayScore: 1, venue: 'Etihad Stadium',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-home',
    formResult: 'L',
  },
  {
    date: '29 Okt 2023', homeTeam: 'Man United', awayTeam: 'Man City',
    homeShort: 'MUN', awayShort: 'MCI', homeColor: '#DA291C', awayColor: '#6CABDD',
    homeScore: 0, awayScore: 3, venue: 'Old Trafford',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-away',
    formResult: 'L',
  },
  {
    date: '03 Jun 2023', homeTeam: 'Man City', awayTeam: 'Man United',
    homeShort: 'MCI', awayShort: 'MUN', homeColor: '#6CABDD', awayColor: '#DA291C',
    homeScore: 2, awayScore: 1, venue: 'Wembley Stadium',
    competition: 'FA Cup Final', outcomeBadge: 'City Win', outcomeType: 'win-home',
    formResult: 'L',
  },
  {
    date: '14 Jan 2023', homeTeam: 'Man United', awayTeam: 'Man City',
    homeShort: 'MUN', awayShort: 'MCI', homeColor: '#DA291C', awayColor: '#6CABDD',
    homeScore: 2, awayScore: 1, venue: 'Old Trafford',
    competition: 'Premier League', outcomeBadge: 'United Win', outcomeType: 'win-home',
    formResult: 'W',
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
      { label: 'Ball possession', homeVal: '54%', awayVal: '46%', homeNum: 54, awayNum: 46 },
      { label: 'Expected goals (xG)', homeVal: '4.62', awayVal: '0.38', homeNum: 4.62, awayNum: 0.38 },
      { label: 'Total shots', homeVal: 22, awayVal: 5, homeNum: 22, awayNum: 5 },
      { label: 'Shots on target', homeVal: 13, awayVal: 1, homeNum: 13, awayNum: 1 },
      { label: 'Big chances', homeVal: 8, awayVal: 0, homeNum: 8, awayNum: 0 },
      { label: 'Touches in opp. box', homeVal: 42, awayVal: 11, homeNum: 42, awayNum: 11 },
      { label: 'Accurate passes', homeVal: '512 (89%)', awayVal: '420 (83%)', homeNum: 512, awayNum: 420 },
      { label: 'Corners', homeVal: 8, awayVal: 2, homeNum: 8, awayNum: 2 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 6, awayVal: 3, homeNum: 6, awayNum: 3 },
      { label: 'Blocked shots', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
      { label: 'Shots inside box', homeVal: 17, awayVal: 2, homeNum: 17, awayNum: 2 },
      { label: 'Shots outside box', homeVal: 5, awayVal: 3, homeNum: 5, awayNum: 3 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 218, awayVal: 235, homeNum: 218, awayNum: 235 },
      { label: 'Opposition half', homeVal: 294, awayVal: 185, homeNum: 294, awayNum: 185 },
      { label: 'Accurate long balls', homeVal: '28 (72%)', awayVal: '18 (52%)', homeNum: 28, awayNum: 18 },
      { label: 'Accurate crosses', homeVal: '9 (45%)', awayVal: '2 (18%)', homeNum: 9, awayNum: 2 },
      { label: 'Offsides', homeVal: 2, awayVal: 1, homeNum: 2, awayNum: 1 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '19 (79%)', awayVal: '11 (55%)', homeNum: 19, awayNum: 11 },
      { label: 'Interceptions', homeVal: 12, awayVal: 5, homeNum: 12, awayNum: 5 },
      { label: 'Clearances', homeVal: 16, awayVal: 26, homeNum: 16, awayNum: 26 },
      { label: 'Keeper saves', homeVal: 1, awayVal: 6, homeNum: 1, awayNum: 6 },
      { label: 'Fouls committed', homeVal: 8, awayVal: 13, homeNum: 8, awayNum: 13 },
    ],
  },
  '1ST': {
    top: [
      { label: 'Ball possession', homeVal: '52%', awayVal: '48%', homeNum: 52, awayNum: 48 },
      { label: 'Expected goals (xG)', homeVal: '2.14', awayVal: '0.22', homeNum: 2.14, awayNum: 0.22 },
      { label: 'Total shots', homeVal: 10, awayVal: 3, homeNum: 10, awayNum: 3 },
      { label: 'Shots on target', homeVal: 6, awayVal: 1, homeNum: 6, awayNum: 1 },
      { label: 'Big chances', homeVal: 4, awayVal: 0, homeNum: 4, awayNum: 0 },
      { label: 'Touches in opp. box', homeVal: 19, awayVal: 6, homeNum: 19, awayNum: 6 },
      { label: 'Accurate passes', homeVal: '254 (90%)', awayVal: '230 (85%)', homeNum: 254, awayNum: 230 },
      { label: 'Corners', homeVal: 4, awayVal: 1, homeNum: 4, awayNum: 1 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 3, awayVal: 2, homeNum: 3, awayNum: 2 },
      { label: 'Blocked shots', homeVal: 1, awayVal: 0, homeNum: 1, awayNum: 0 },
      { label: 'Shots inside box', homeVal: 8, awayVal: 1, homeNum: 8, awayNum: 1 },
      { label: 'Shots outside box', homeVal: 2, awayVal: 2, homeNum: 2, awayNum: 2 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 110, awayVal: 125, homeNum: 110, awayNum: 125 },
      { label: 'Opposition half', homeVal: 144, awayVal: 105, homeNum: 144, awayNum: 105 },
      { label: 'Accurate long balls', homeVal: '14 (70%)', awayVal: '9 (50%)', homeNum: 14, awayNum: 9 },
      { label: 'Accurate crosses', homeVal: '4 (40%)', awayVal: '1 (17%)', homeNum: 4, awayNum: 1 },
      { label: 'Offsides', homeVal: 1, awayVal: 0, homeNum: 1, awayNum: 0 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '10 (83%)', awayVal: '6 (60%)', homeNum: 10, awayNum: 6 },
      { label: 'Interceptions', homeVal: 6, awayVal: 3, homeNum: 6, awayNum: 3 },
      { label: 'Clearances', homeVal: 8, awayVal: 14, homeNum: 8, awayNum: 14 },
      { label: 'Keeper saves', homeVal: 1, awayVal: 3, homeNum: 1, awayNum: 3 },
      { label: 'Fouls committed', homeVal: 4, awayVal: 6, homeNum: 4, awayNum: 6 },
    ],
  },
  '2ND': {
    top: [
      { label: 'Ball possession', homeVal: '56%', awayVal: '44%', homeNum: 56, awayNum: 44 },
      { label: 'Expected goals (xG)', homeVal: '2.48', awayVal: '0.16', homeNum: 2.48, awayNum: 0.16 },
      { label: 'Total shots', homeVal: 12, awayVal: 2, homeNum: 12, awayNum: 2 },
      { label: 'Shots on target', homeVal: 7, awayVal: 0, homeNum: 7, awayNum: 0 },
      { label: 'Big chances', homeVal: 4, awayVal: 0, homeNum: 4, awayNum: 0 },
      { label: 'Touches in opp. box', homeVal: 23, awayVal: 5, homeNum: 23, awayNum: 5 },
      { label: 'Accurate passes', homeVal: '258 (88%)', awayVal: '190 (81%)', homeNum: 258, awayNum: 190 },
      { label: 'Corners', homeVal: 4, awayVal: 1, homeNum: 4, awayNum: 1 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
      { label: 'Blocked shots', homeVal: 2, awayVal: 1, homeNum: 2, awayNum: 1 },
      { label: 'Shots inside box', homeVal: 9, awayVal: 1, homeNum: 9, awayNum: 1 },
      { label: 'Shots outside box', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 108, awayVal: 110, homeNum: 108, awayNum: 110 },
      { label: 'Opposition half', homeVal: 150, awayVal: 80, homeNum: 150, awayNum: 80 },
      { label: 'Accurate long balls', homeVal: '14 (74%)', awayVal: '9 (53%)', homeNum: 14, awayNum: 9 },
      { label: 'Accurate crosses', homeVal: '5 (50%)', awayVal: '1 (20%)', homeNum: 5, awayNum: 1 },
      { label: 'Offsides', homeVal: 1, awayVal: 1, homeNum: 1, awayNum: 1 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '9 (75%)', awayVal: '5 (50%)', homeNum: 9, awayNum: 5 },
      { label: 'Interceptions', homeVal: 6, awayVal: 2, homeNum: 6, awayNum: 2 },
      { label: 'Clearances', homeVal: 8, awayVal: 12, homeNum: 8, awayNum: 12 },
      { label: 'Keeper saves', homeVal: 0, awayVal: 3, homeNum: 0, awayNum: 3 },
      { label: 'Fouls committed', homeVal: 4, awayVal: 7, homeNum: 4, awayNum: 7 },
    ],
  },
};

const LINEUPS = {
  home: {
    formation: '4-2-3-1',
    starters: [
      { num: 24, name: 'André Onana', pos: 'GK' },
      { num: 20, name: 'Diogo Dalot', pos: 'RB' },
      { num: 4, name: 'Matthijs de Ligt', pos: 'CB' },
      { num: 6, name: 'Lisandro Martínez', pos: 'CB' },
      { num: 23, name: 'Luke Shaw', pos: 'LB' },
      { num: 18, name: 'Casemiro', pos: 'DM' },
      { num: 37, name: 'Kobbie Mainoo', pos: 'CM' },
      { num: 17, name: 'Alejandro Garnacho', pos: 'RW' },
      { num: 8, name: 'Bruno Fernandes', pos: 'AM', isCaptain: true },
      { num: 10, name: 'Marcus Rashford', pos: 'LW' },
      { num: 11, name: 'Rasmus Højlund', pos: 'ST' },
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
      { num: 11, name: 'Jérémy Doku', pos: 'LM' },
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
  homeColor = '#DA291C',
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
        <span className={`w-12 sm:w-16 text-left shrink-0 truncate transition-colors text-[11px] sm:text-xs ${
          isHomeWinner
            ? 'font-bold text-slate-900 dark:text-white'
            : 'text-slate-400 dark:text-zinc-500 font-normal'
        }`}>
          {homeVal}
        </span>
        <span className="text-[10px] sm:text-xs font-sans font-medium text-slate-600 dark:text-zinc-300 text-center flex-1 truncate px-1">
          {label}
        </span>
        <span className={`w-12 sm:w-16 text-right shrink-0 truncate transition-colors text-[11px] sm:text-xs ${
          isAwayWinner
            ? 'font-bold text-slate-900 dark:text-white'
            : 'text-slate-400 dark:text-zinc-500 font-normal'
        }`}>
          {awayVal}
        </span>
      </div>
      <div className="flex h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800/80 gap-0.5 sm:gap-1">
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
  const [lineupTeam, setLineupTeam] = useState<'home' | 'away'>('home');
  const [showAiModal, setShowAiModal] = useState(false);

  const periodInfo = {
    ALL: {
      homeScore: 7,
      awayScore: 0,
      statusText: "88'",
      badgeText: "88' LIVE",
      scorersHome: [
        "Fernandes 14' (P), 78'",
        "Rashford 28', 53'",
        "Højlund 41'",
        "Garnacho 65'",
        "Mainoo 88'",
      ],
      scorersAway: ['–'],
      munProb: '94%',
      drawProb: '4%',
      mciProb: '2%',
      munWidth: '94%',
      drawWidth: '4%',
      mciWidth: '2%',
    },
    '1ST': {
      homeScore: 3,
      awayScore: 0,
      statusText: 'Half Time',
      badgeText: 'HT',
      scorersHome: ["Fernandes 14' (P)", "Rashford 28'", "Højlund 41'"],
      scorersAway: ['–'],
      munProb: '88%',
      drawProb: '9%',
      mciProb: '3%',
      munWidth: '88%',
      drawWidth: '9%',
      mciWidth: '3%',
    },
    '2ND': {
      homeScore: 4,
      awayScore: 0,
      statusText: "2nd Half",
      badgeText: '2nd Half',
      scorersHome: ["Rashford 53'", "Garnacho 65'", "Fernandes 78'", "Mainoo 88'"],
      scorersAway: ['–'],
      munProb: '97%',
      drawProb: '2%',
      mciProb: '1%',
      munWidth: '97%',
      drawWidth: '2%',
      mciWidth: '1%',
    },
  }[statsPeriod];

  const activeStats = STATS_DATA[statsPeriod];

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6 pb-12">
      
      {/* ── Matchday Header Strip ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3.5 border-b border-slate-200 dark:border-[#27272A] pb-3 sm:pb-3.5">
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl p-1 shadow-xs transition-colors w-full sm:w-auto">
          <button
            aria-label="Previous Gameweek"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1E] active:scale-95 transition-all shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center justify-center gap-2 px-2 min-w-0 flex-1 sm:flex-initial">
            <LeagueLogo league="Premier League" size={18} />
            <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate">
              GW08 · Premier League
            </span>
          </div>
          <button
            aria-label="Next Gameweek"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1E] active:scale-95 transition-all shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="grid grid-cols-3 w-full sm:w-auto border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] rounded-xl p-1 shadow-xs">
          {(['ALL', 'FINISHED', 'UPCOMING'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`min-h-[34px] sm:min-h-[36px] px-2 sm:px-4 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all active:scale-95 flex items-center justify-center ${
                filterTab === tab
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile-Only Quick Fixtures Carousel ── */}
      <div className="lg:hidden flex flex-col gap-2 -mt-1">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            GW08 Matches
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
            Swipe ➔
          </span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x -mx-3 px-3 sm:mx-0 sm:px-0">
          {MATCHDAY_FIXTURES.map((fix) => (
            <div
              key={fix.id}
              className="snap-start shrink-0 w-60 sm:w-64 rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-[#27272A]">
                <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                  {fix.timeOrStatus}
                </span>
                <span className="truncate max-w-[110px]">{fix.venue}</span>
              </div>
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <ClubCrest code={fix.homeShort} size={18} />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">{fix.homeTeam}</span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-50 dark:bg-zinc-800/60 shrink-0">
                  {fix.homeScore !== undefined ? `${fix.homeScore} - ${fix.awayScore}` : 'vs'}
                </div>
                <div className="flex items-center justify-end gap-1.5 min-w-0 flex-1 text-right">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">{fix.awayTeam}</span>
                  <ClubCrest code={fix.awayShort} size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* ── Left Column ── */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">

          {/* ── Featured Match Card ── */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs overflow-hidden transition-colors flex flex-col gap-1 sm:gap-2">
            <div className="absolute -top-20 -left-20 w-52 sm:w-60 h-52 sm:h-60 bg-red-600/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-52 sm:w-60 h-52 sm:h-60 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Score & Clubs */}
            <div className="relative">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-6">
                
                {/* Home: Manchester United */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 text-right min-w-0">
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      <span className="hidden sm:inline">Man United</span>
                      <span className="sm:hidden">Man Utd</span>
                    </h2>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">
                      5th in PL
                    </span>
                  </div>
                  <ClubCrest code="MUN" size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                </div>

                {/* Monumental Center Score & Status */}
                <div className="flex flex-col items-center justify-center px-1.5 sm:px-6 w-20 sm:w-32 shrink-0">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                    <span className="font-black text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight tabular-nums transition-all">
                      {periodInfo.homeScore}
                    </span>
                    <span className="font-normal text-lg sm:text-2xl text-slate-300 dark:text-slate-600">-</span>
                    <span className="font-black text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight tabular-nums transition-all">
                      {periodInfo.awayScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {periodInfo.statusText}
                    </span>
                  </div>
                </div>

                {/* Away: Manchester City */}
                <div className="flex items-center justify-start gap-2 sm:gap-3 text-left min-w-0">
                  <ClubCrest code="MCI" size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      Man City
                    </h2>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">
                      2nd in PL
                    </span>
                  </div>
                </div>

                {/* Scorers Row in the SAME Grid — 100% Mathematically Centered */}
                {(periodInfo.scorersHome.filter(s => s && s !== '–').length > 0 ||
                  periodInfo.scorersAway.filter(s => s && s !== '–').length > 0) && (
                  <>
                    <div className="col-span-3 border-t border-slate-100/80 dark:border-[#27272A]/70 my-2.5 sm:my-3" />

                    {/* Home Scorers (Right-aligned, max width up to center column) */}
                    <div className="space-y-0.5 sm:space-y-1 text-right min-w-0">
                      {periodInfo.scorersHome
                        .filter(s => s && s !== '–')
                        .map((s, idx) => (
                          <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                            {s}
                          </div>
                        ))}
                    </div>

                    {/* Center Ball Icon (Top-aligned with the first scorer line on the center column track) */}
                    <div className="self-start flex justify-center items-center h-4 sm:h-4.5 w-20 sm:w-32 shrink-0 pt-0.5">
                      <SoccerBallIcon size={12} className="text-slate-400 dark:text-zinc-500" />
                    </div>

                    {/* Away Scorers (Left-aligned, or empty to preserve symmetrical column track) */}
                    <div className="space-y-0.5 sm:space-y-1 text-left min-w-0">
                      {periodInfo.scorersAway
                        .filter(s => s && s !== '–')
                        .map((s, idx) => (
                          <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                            {s}
                          </div>
                        ))}
                    </div>
                  </>
                )}

              </div>

              {/* xG Momentum Bar — Symmetrical Layout */}
              <div className="mt-3.5 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#16161A] border border-slate-100 dark:border-[#27272A] flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-[#DA291C] flex items-center gap-1">
                    <span>MUN</span>
                    <span className="text-slate-400 dark:text-zinc-500 font-normal">·</span>
                    <span>4.62 xG</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-sans font-semibold">
                    xG Momentum
                  </span>
                  <span className="font-bold text-[#6CABDD] flex items-center gap-1">
                    <span>0.38 xG</span>
                    <span className="text-slate-400 dark:text-zinc-500 font-normal">·</span>
                    <span>MCI</span>
                  </span>
                </div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800 gap-0.5">
                  <div className="h-full bg-[#DA291C] rounded-full transition-all duration-500" style={{ width: '92%' }} />
                  <div className="h-full bg-[#6CABDD] rounded-full transition-all duration-500" style={{ width: '8%' }} />
                </div>
              </div>
            </div>

            {/* Live Win Probability Bar */}
            <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-[#27272A]">
              <div className="flex items-center justify-between text-xs font-mono pb-1.5">
                <div className="flex items-center justify-between w-full sm:justify-start sm:gap-4 text-[10px] sm:text-[11px]">
                  <span className="text-red-600 dark:text-red-400 font-bold">MUN {periodInfo.munProb}</span>
                  <span className="text-slate-500 dark:text-zinc-400">Draw {periodInfo.drawProb}</span>
                  <span className="text-sky-700 dark:text-sky-400 font-bold">MCI {periodInfo.mciProb}</span>
                </div>
              </div>
              
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full flex overflow-hidden">
                <div className="h-full bg-[#DA291C] transition-all duration-300" style={{ width: periodInfo.munWidth }} />
                <div className="h-full bg-slate-300 dark:bg-zinc-600 transition-all duration-300" style={{ width: periodInfo.drawWidth }} />
                <div className="h-full bg-[#6CABDD] transition-all duration-300" style={{ width: periodInfo.mciWidth }} />
              </div>
            </div>
          </div>

          {/* ── Detailed Tabs Card ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-6 shadow-xs overflow-hidden transition-colors">

            {/* Responsive Tabs Bar: Responsive Grid on Mobile, Centered/Flex on Desktop */}
            <div className="grid grid-cols-4 sm:flex sm:items-center gap-1 sm:gap-2 border-b border-slate-100 dark:border-[#27272A] pb-2">
              {(['stats', 'h2h', 'lineups', 'table'] as const).map((tab) => {
                const isActive = matchTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setMatchTab(tab)}
                    className={`py-2 sm:px-4 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all text-center shrink-0 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <span className="block truncate">
                      {tab === 'stats' ? 'Stats' : tab === 'h2h' ? 'H2H' : tab === 'lineups' ? 'Lineups' : 'Table'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Tab Content: STATS ── */}
            {matchTab === 'stats' && (
              <div className="pt-3 sm:pt-4 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-center p-1 bg-slate-100/80 dark:bg-zinc-800/70 rounded-full w-full sm:w-fit mx-auto gap-1 border border-slate-200/50 dark:border-zinc-700/50">
                  {(['ALL', '1ST', '2ND'] as const).map((period) => {
                    const isActive = statsPeriod === period;
                    return (
                      <button
                        key={period}
                        onClick={() => setStatsPeriod(period)}
                        className={`flex-1 sm:flex-initial min-h-[32px] sm:min-h-[36px] px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 text-center ${
                          isActive
                            ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="whitespace-nowrap">
                          {period === 'ALL' ? 'All Match' : period === '1ST' ? '1st Half' : '2nd Half'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Top Stats Section */}
                <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-5 border border-slate-100 dark:border-[#27272A]">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                    Top Stats
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                    {activeStats.top.map((s, idx) => (
                      <MatchStatRow key={idx} {...s} />
                    ))}
                  </div>
                </div>

                {/* Two-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                      Shots
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                      {activeStats.shots.map((s, idx) => (
                        <MatchStatRow key={idx} {...s} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
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
                <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
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
              <div className="pt-3 sm:pt-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#27272A]">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Past Encounters</span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-red-600 dark:text-red-400">2 MUN</span>
                    <span className="text-slate-500 dark:text-zinc-400">0 D</span>
                    <span className="text-sky-600 dark:text-sky-400">3 MCI</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-[#27272A]">
                  {H2H_ENCOUNTERS.map((h, i) => (
                    <div
                      key={i}
                      className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors"
                    >
                      <div className="sm:hidden flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                          <span className="truncate max-w-[200px]">{h.date} · {h.competition}</span>
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] font-mono shrink-0 select-none ${
                              h.formResult === 'W'
                                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : h.formResult === 'D'
                                ? 'bg-slate-400 dark:bg-zinc-700 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {h.formResult}
                          </span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                          <div className="flex items-center justify-end gap-1.5 text-right min-w-0">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{h.homeTeam}</span>
                            <ClubCrest code={h.homeShort} size={18} />
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono shrink-0">
                            {h.homeScore} - {h.awayScore}
                          </div>
                          <div className="flex items-center justify-start gap-1.5 text-left min-w-0">
                            <ClubCrest code={h.awayShort} size={18} />
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{h.awayTeam}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:grid grid-cols-12 items-center gap-4">
                        <div className="col-span-3 flex flex-col justify-center">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {h.date}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {h.competition}
                          </span>
                        </div>

                        <div className="col-span-7 flex items-center justify-between gap-3">
                          <div className="flex items-center justify-end gap-2 flex-1 text-right min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {h.homeTeam}
                            </span>
                            <ClubCrest code={h.homeShort} size={20} />
                          </div>

                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums shrink-0 text-center min-w-[38px] font-mono">
                            <span>{h.homeScore}</span>
                            <span className="text-slate-300 dark:text-slate-600 mx-1.5 font-normal">-</span>
                            <span>{h.awayScore}</span>
                          </div>

                          <div className="flex items-center justify-start gap-2 flex-1 text-left min-w-0">
                            <ClubCrest code={h.awayShort} size={20} />
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {h.awayTeam}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] font-mono shrink-0 select-none shadow-2xs ${
                              h.formResult === 'W'
                                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : h.formResult === 'D'
                                ? 'bg-slate-400 dark:bg-zinc-700 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {h.formResult}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab Content: LINEUPS (Segmented Mobile Switcher Fix) ── */}
            {matchTab === 'lineups' && (
              <div className="pt-3 sm:pt-4">
                <div className="md:hidden grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#1A1A1E] rounded-xl mb-3.5 gap-1 border border-slate-200/60 dark:border-zinc-800">
                  <button
                    onClick={() => setLineupTeam('home')}
                    className={`min-h-[42px] py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all active:scale-95 ${
                      lineupTeam === 'home'
                        ? 'bg-white dark:bg-[#25252D] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ClubCrest code="MUN" size={16} />
                      <span className="truncate">Man United</span>
                    </div>
                    <span className="text-[10px] font-mono font-normal opacity-75">({LINEUPS.home.formation})</span>
                  </button>
                  <button
                    onClick={() => setLineupTeam('away')}
                    className={`min-h-[42px] py-1.5 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all active:scale-95 ${
                      lineupTeam === 'away'
                        ? 'bg-white dark:bg-[#25252D] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ClubCrest code="MCI" size={16} />
                      <span className="truncate">Man City</span>
                    </div>
                    <span className="text-[10px] font-mono font-normal opacity-75">({LINEUPS.away.formation})</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Man United XI */}
                  <div className={`${lineupTeam === 'home' ? 'block' : 'hidden md:block'} bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3.5 sm:p-4 border border-slate-100 dark:border-[#27272A]`}>
                    <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-slate-200/60 dark:border-[#27272A]">
                      <div className="flex items-center gap-2">
                        <ClubCrest code="MUN" size={18} />
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Man United</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {LINEUPS.home.formation}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {LINEUPS.home.starters.map((player) => (
                        <div key={player.num} className="h-7 flex items-center justify-between px-1.5 sm:px-2 rounded hover:bg-slate-100/60 dark:hover:bg-[#1E1E24] transition-colors">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="w-4 sm:w-5 text-right font-mono text-slate-400 text-[10px] sm:text-[11px] shrink-0">{player.num}</span>
                            <span className="font-semibold text-slate-900 dark:text-white truncate text-[11px] sm:text-xs">{player.name}</span>
                            {player.isCaptain && <span className="text-[8px] sm:text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">C</span>}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">{player.pos}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Man City XI */}
                  <div className={`${lineupTeam === 'away' ? 'block' : 'hidden md:block'} bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3.5 sm:p-4 border border-slate-100 dark:border-[#27272A]`}>
                    <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-slate-200/60 dark:border-[#27272A]">
                      <div className="flex items-center gap-2">
                        <ClubCrest code="MCI" size={18} />
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Man City</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {LINEUPS.away.formation}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {LINEUPS.away.starters.map((player) => (
                        <div key={player.num} className="h-7 flex items-center justify-between px-1.5 sm:px-2 rounded hover:bg-slate-100/60 dark:hover:bg-[#1E1E24] transition-colors">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="w-4 sm:w-5 text-right font-mono text-slate-400 text-[10px] sm:text-[11px] shrink-0">{player.num}</span>
                            <span className="font-semibold text-slate-900 dark:text-white truncate text-[11px] sm:text-xs">{player.name}</span>
                            {player.isCaptain && <span className="text-[8px] sm:text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">C</span>}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">{player.pos}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab Content: TABLE ── */}
            {matchTab === 'table' && (
              <div className="pt-3 sm:pt-4">
                <div className="font-mono text-xs divide-y divide-slate-100 dark:divide-[#27272A]">
                  <div className="flex justify-between py-1.5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    <span>Club</span>
                    <div className="flex gap-2 sm:gap-4">
                      <span className="w-4 sm:w-5 text-center">P</span>
                      <span className="w-5 sm:w-6 text-center">GD</span>
                      <span className="w-5 sm:w-6 text-right font-bold text-slate-900 dark:text-white">PTS</span>
                      <span className="w-12 sm:w-14 text-right">Form</span>
                    </div>
                  </div>

                  {LEAGUE_STANDINGS.map((row) => (
                    <div key={row.rank} className="flex justify-between py-2 items-center hover:bg-slate-50 dark:hover:bg-[#1A1A1E] px-0.5 sm:px-1 rounded transition-colors">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="text-slate-500 dark:text-slate-400 w-3 font-bold text-[11px] sm:text-xs">{row.rank}</span>
                        <ClubCrest code={row.club} size={16} />
                        <span className="font-bold text-slate-900 dark:text-white truncate text-[11px] sm:text-xs">{row.club}</span>
                      </div>
                      <div className="flex gap-2 sm:gap-4 items-center tabular-nums text-[11px] sm:text-xs">
                        <span className="w-4 sm:w-5 text-center text-slate-600 dark:text-slate-400">{row.played}</span>
                        <span className="w-5 sm:w-6 text-center text-slate-600 dark:text-slate-400">{row.gd}</span>
                        <span className="w-5 sm:w-6 text-right font-bold text-slate-900 dark:text-white">{row.pts}</span>
                        <div className="w-12 sm:w-14 flex items-center justify-end gap-0.5 sm:gap-1">
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
        </div>

        {/* ── Right Column: Sidebar ── */}
        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 lg:sticky lg:top-24">
          
          {/* 1. Live Table Impact Widget */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-slate-100 dark:border-[#27272A]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Live Table Impact
              </h3>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between py-1 text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-[#222227]">
                <span>Club</span>
                <div className="flex gap-2.5 sm:gap-3">
                  <span className="w-4 text-center">P</span>
                  <span className="w-5 sm:w-6 text-center">GD</span>
                  <span className="w-7 sm:w-8 text-right font-bold">PTS</span>
                </div>
              </div>

              {LEAGUE_STANDINGS.map((row) => {
                const isArsenal = row.club === 'Arsenal';
                const isCity = row.club === 'Man City';
                return (
                  <div
                    key={row.rank}
                    className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${
                      isArsenal
                        ? 'bg-red-500/10 border border-red-500/20 text-slate-900 dark:text-white'
                        : isCity
                        ? 'bg-sky-500/10 border border-sky-500/20 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className={`w-3 sm:w-3.5 text-[11px] sm:text-xs font-bold ${isArsenal ? 'text-red-500' : isCity ? 'text-sky-400' : 'text-slate-400'}`}>
                        {row.rank}
                      </span>
                      <ClubCrest code={row.club} size={16} />
                      <span className="font-bold text-[11px] sm:text-xs truncate">{row.club}</span>
                      {isArsenal && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-mono font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/50 px-1 py-0.5 rounded leading-none">
                          <TrendingUp size={10} className="text-emerald-400 shrink-0" />
                          1
                        </span>
                      )}
                      {isCity && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-mono font-bold text-zinc-400 bg-zinc-800 border border-zinc-700/50 px-1 py-0.5 rounded leading-none">
                          <TrendingDown size={10} className="text-rose-400 shrink-0" />
                          1
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2.5 sm:gap-3 items-center tabular-nums text-[11px] sm:text-xs">
                      <span className="w-4 text-center text-slate-400">{row.played}</span>
                      <span className="w-5 sm:w-6 text-center text-slate-400">{row.gd}</span>
                      <span className="w-7 sm:w-8 text-right font-bold text-slate-900 dark:text-white">
                        {row.pts}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#27272A] text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Info size={13} className="text-zinc-400 shrink-0" />
              <span className="leading-tight">Arsenal overtake City to lead the table by +2 pts.</span>
            </div>
          </div>

          {/* 2. AI Simulation Matrix Widget */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-slate-100 dark:border-[#27272A]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Simulation Matrix
              </h3>
            </div>

            <div className="space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs">MUN Win Expectancy</span>
                <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">82.4%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 dark:bg-zinc-200 rounded-full" style={{ width: '82.4%' }} />
              </div>

              {/* Top Projected Scorelines */}
              <div className="pt-1.5 sm:pt-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                  Projected Full-Time
                </span>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-100 dark:bg-[#1E1E24] rounded-lg border border-slate-300 dark:border-zinc-700">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">2 - 1</span>
                    <span className="text-[10px] text-slate-900 dark:text-white font-bold">34.2%</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-[#18181C] rounded-lg border border-slate-200 dark:border-[#27272A]">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">2 - 2</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">21.8%</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-[#18181C] rounded-lg border border-slate-200 dark:border-[#27272A]">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">3 - 1</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">16.4%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAiModal(true)}
                className="w-full mt-1.5 sm:mt-2 py-2 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                View Full Probabilities
              </button>
            </div>
          </div>

          {/* 3. Fixtures Rail */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-2.5 sm:pb-3 mb-2">
              <div className="flex items-center gap-2">
                <LeagueLogo league="Premier League" size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  GW08 Fixtures Rail
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 font-medium">4 Matches</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {MATCHDAY_FIXTURES.map((fix) => (
                <div
                  key={fix.id}
                  className="py-2.5 px-0.5 sm:px-1 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-lg transition-colors flex items-center gap-2 text-xs"
                >
                  <div className="w-[42px] sm:w-[46px] shrink-0 flex flex-col items-start leading-none gap-1">
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded inline-block text-center min-w-[34px] sm:min-w-[38px] ${
                        fix.timeOrStatus === 'FT'
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {fix.timeOrStatus.split(' ')[0]}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 dark:text-zinc-500 pl-0.5 truncate max-w-full">
                      {fix.xgHome !== undefined ? `xG ${fix.xgHome}` : fix.venue.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 min-w-0 pr-1">
                    <div className="flex items-center justify-end gap-1.5 min-w-0 text-right">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {fix.homeTeam}
                      </span>
                      <ClubCrest code={fix.homeShort} size={16} />
                    </div>

                    <div className="w-8 sm:w-10 text-center font-mono shrink-0 select-none">
                      {fix.homeScore !== undefined ? (
                        <span className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white tabular-nums">
                          {fix.homeScore} - {fix.awayScore}
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                          vs
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-start gap-1.5 min-w-0 text-left">
                      <ClubCrest code={fix.awayShort} size={16} />
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {fix.awayTeam}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── Score Probabilities Modal ────────────────────────────────────── */}
      {showAiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-2xl transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">AI Simulation Engine</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Score Probabilities</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white active:scale-95 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E1E24] transition-colors"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                Monte Carlo match simulation outcomes based on current team xG momentum and historical Premier League head-to-head records.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center pt-1">
                <div className="p-3 bg-slate-100/80 dark:bg-[#1E1E24] rounded-xl border border-slate-300 dark:border-zinc-700 shadow-2xs">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">2 - 1</span>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold">34.2%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-xl border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">2 - 2</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">21.8%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-xl border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">3 - 1</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">16.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}