'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';

// ─── TYPES & DATA ────────────────────────────────────────────────────────────

interface Match {
  id: string;
  league: string;
  leagueCountry: string;
  round: string;
  home: string;
  homeCode: string;
  homeColor: string;
  away: string;
  awayCode: string;
  awayColor: string;
  homeScore?: number;
  awayScore?: number;
  xgHome?: number;
  xgAway?: number;
  status: 'LIVE' | 'FT' | 'HT' | 'UPCOMING';
  minute?: string;
  startTime?: string;
  scorers?: {
    home: string[];
    away: string[];
  };
  highlightPlayer?: {
    name: string;
    rating: number;
    team: string;
  };
}

const LEAGUES = [
  { id: 'all', name: 'All Matches', count: 24 },
  { id: 'epl', name: 'Premier League', count: 8, popular: true },
  { id: 'ucl', name: 'Champions League', count: 6, popular: true },
  { id: 'laliga', name: 'La Liga', count: 5, popular: true },
  { id: 'seriea', name: 'Serie A', count: 4, popular: true },
  { id: 'bundesliga', name: 'Bundesliga', count: 4, popular: true },
  { id: 'ligue1', name: 'Ligue 1', count: 3, popular: false },
  { id: 'eredivisie', name: 'Eredivisie', count: 2, popular: false },
];

const MATCHES: Match[] = [
  // Premier League
  {
    id: 'm1',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Gameweek 8',
    home: 'Man United',
    homeCode: 'MUN',
    homeColor: '#DA291C',
    away: 'Man City',
    awayCode: 'MCI',
    awayColor: '#6CABDD',
    homeScore: 7,
    awayScore: 0,
    xgHome: 4.62,
    xgAway: 0.38,
    status: 'LIVE',
    minute: "88'",
    scorers: {
      home: ["Fernandes 14' (P), 78'", "Rashford 28', 53'", "Højlund 41'", "Garnacho 65'", "Mainoo 88'"],
      away: [],
    },
    highlightPlayer: {
      name: 'B. Fernandes',
      rating: 9.9,
      team: 'Man United',
    },
  },
  {
    id: 'm2',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Gameweek 8',
    home: 'Liverpool',
    homeCode: 'LIV',
    homeColor: '#C8102E',
    away: 'Chelsea',
    awayCode: 'CHE',
    awayColor: '#034694',
    homeScore: 3,
    awayScore: 1,
    xgHome: 2.88,
    xgAway: 0.94,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: ["M. Salah 29' (P)", "C. Jones 51'", "D. Szoboszlai 88'"],
      away: ["N. Jackson 48'"],
    },
    highlightPlayer: {
      name: 'M. Salah',
      rating: 8.3,
      team: 'Liverpool',
    },
  },
  {
    id: 'm3',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Gameweek 8',
    home: 'Aston Villa',
    homeCode: 'AVL',
    homeColor: '#670E36',
    away: 'Tottenham',
    awayCode: 'TOT',
    awayColor: '#132257',
    status: 'UPCOMING',
    startTime: '21:00',
    xgHome: 1.62,
    xgAway: 1.55,
  },

  // Champions League
  {
    id: 'm4',
    league: 'Champions League',
    leagueCountry: 'Europe',
    round: 'League Phase',
    home: 'Bayern München',
    homeCode: 'BAY',
    homeColor: '#DC052D',
    away: 'Paris Saint-Germain',
    awayCode: 'PSG',
    awayColor: '#004170',
    homeScore: 3,
    awayScore: 2,
    xgHome: 2.15,
    xgAway: 1.84,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: ["H. Kane 14', 77'", "J. Musiala 44'"],
      away: ["O. Dembélé 32'", "B. Barcola 81'"],
    },
    highlightPlayer: {
      name: 'H. Kane',
      rating: 8.8,
      team: 'Bayern',
    },
  },
  {
    id: 'm5',
    league: 'Champions League',
    leagueCountry: 'Europe',
    round: 'League Phase',
    home: 'Real Madrid',
    homeCode: 'RMA',
    homeColor: '#FEBE10',
    away: 'Borussia Dortmund',
    awayCode: 'BVB',
    awayColor: '#FDE100',
    status: 'UPCOMING',
    startTime: '23:45',
    xgHome: 2.45,
    xgAway: 1.1,
  },

  // La Liga
  {
    id: 'm6',
    league: 'La Liga',
    leagueCountry: 'Spain',
    round: 'El Clásico',
    home: 'FC Barcelona',
    homeCode: 'BAR',
    homeColor: '#A50044',
    away: 'Real Madrid',
    awayCode: 'RMA',
    awayColor: '#FEBE10',
    homeScore: 0,
    awayScore: 0,
    xgHome: 0.42,
    xgAway: 0.61,
    status: 'HT',
    minute: 'HT',
    highlightPlayer: {
      name: 'L. Yamal',
      rating: 7.2,
      team: 'Barcelona',
    },
  },
];

const STANDINGS = [
  { rank: 1, club: 'Arsenal', code: 'ARS', color: '#EF0107', p: 8, gd: '+18', pts: 58 },
  { rank: 2, club: 'Man City', code: 'MCI', color: '#6CABDD', p: 8, gd: '+16', pts: 56 },
  { rank: 3, club: 'Liverpool', code: 'LIV', color: '#C8102E', p: 8, gd: '+14', pts: 54 },
  { rank: 4, club: 'Aston Villa', code: 'AVL', color: '#670E36', p: 8, gd: '+8', pts: 49 },
  { rank: 5, club: 'Chelsea', code: 'CHE', color: '#034694', p: 8, gd: '+7', pts: 46 },
];

const TOP_SCORERS = [
  { name: 'Erling Haaland', club: 'Man City', goals: 14, rating: 8.4 },
  { name: 'Mohamed Salah', club: 'Liverpool', goals: 11, rating: 8.2 },
  { name: 'Bukayo Saka', club: 'Arsenal', goals: 9, rating: 8.6 },
  { name: 'Cole Palmer', club: 'Chelsea', goals: 8, rating: 8.0 },
];

export default function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [liveOnly, setLiveOnly] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow'>('today');

  // Filter matches
  const filteredMatches = MATCHES.filter((m) => {
    if (selectedLeague !== 'all') {
      if (selectedLeague === 'epl' && m.league !== 'Premier League') return false;
      if (selectedLeague === 'ucl' && m.league !== 'Champions League') return false;
      if (selectedLeague === 'laliga' && m.league !== 'La Liga') return false;
    }
    if (liveOnly && m.status !== 'LIVE' && m.status !== 'HT') return false;
    return true;
  });

  // Group matches by league
  const groupedLeagues = Array.from(new Set(filteredMatches.map((m) => m.league)));

  const liveFeaturedMatch = MATCHES.find((m) => m.id === 'm1');

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#09090B] pb-16 pt-4 transition-colors duration-150">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6">
        
        {/* ── Main 3-Column Layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ════════════════════════════════════════════════════════════════
              COLUMN 1: Left Navigation & Pinned Leagues (3 cols / 250px)
             ════════════════════════════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col gap-4 lg:col-span-3">
            
            {/* Quick Filter Card */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs p-3 transition-colors">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-3 py-1.5 mb-1">
                Feeds & Filters
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setSelectedLeague('all'); setLiveOnly(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    selectedLeague === 'all' && !liveOnly
                      ? 'bg-slate-100 dark:bg-[#1E1E24] text-slate-900 dark:text-white font-bold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Trophy size={14} className={selectedLeague === 'all' && !liveOnly ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'} />
                    All Matches
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono font-medium">24</span>
                </button>

                <button
                  onClick={() => setLiveOnly(!liveOnly)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    liveOnly
                      ? 'bg-slate-100 dark:bg-[#1E1E24] text-slate-900 dark:text-white font-bold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    Live Matches
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#27272A] text-slate-900 dark:text-zinc-200">
                    2 LIVE
                  </span>
                </button>

                <Link
                  href="/match-center"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Activity size={14} className="text-slate-400 dark:text-zinc-500" />
                    Match Center
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">→</span>
                </Link>
              </div>
            </div>

            {/* Popular Leagues Accordion */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs p-3 transition-colors">
              <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Popular Leagues
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">Pinned</span>
              </div>
              <div className="space-y-0.5">
                {LEAGUES.filter((l) => l.id !== 'all').map((league) => {
                  const isActive = selectedLeague === league.id;
                  return (
                    <button
                      key={league.id}
                      onClick={() => setSelectedLeague(league.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-100 dark:bg-[#1E1E24] text-slate-900 dark:text-white font-bold'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <LeagueLogo league={league.name} size={16} />
                        <span className="truncate">{league.name}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {league.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* ════════════════════════════════════════════════════════════════
              COLUMN 2: Center Main Matchday Stream (6 cols)
             ════════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-6 flex flex-col gap-4">
            
            {/* Mobile / Tablet Horizontal League & Filter Chips (lg:hidden) */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              <button
                onClick={() => { setSelectedLeague('all'); setLiveOnly(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  selectedLeague === 'all' && !liveOnly
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                    : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A]'
                }`}
              >
                All (24)
              </button>

              <button
                onClick={() => setLiveOnly(!liveOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  liveOnly
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                    : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                <span>Live (2)</span>
              </button>

              {LEAGUES.filter((l) => l.id !== 'all').map((league) => {
                const isActive = selectedLeague === league.id && !liveOnly;
                return (
                  <button
                    key={league.id}
                    onClick={() => { setSelectedLeague(league.id); setLiveOnly(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                        : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A]'
                    }`}
                  >
                    <LeagueLogo league={league.name} size={14} />
                    <span>{league.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 1. Date Picker Bar */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs p-1.5 flex items-center justify-between transition-colors">
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1E] flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDate('yesterday')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedDate === 'yesterday'
                      ? 'bg-slate-900 dark:bg-zinc-200 text-white dark:text-zinc-900 font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  Yesterday
                </button>

                <button
                  onClick={() => setSelectedDate('today')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedDate === 'today'
                      ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  Today
                </button>

                <button
                  onClick={() => setSelectedDate('tomorrow')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedDate === 'tomorrow'
                      ? 'bg-slate-900 dark:bg-zinc-200 text-white dark:text-zinc-900 font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  Tomorrow
                </button>
              </div>

              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1E] flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 2. Featured Match Hero Card */}
            {liveFeaturedMatch && (
              <div className="relative bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs overflow-hidden transition-colors p-3.5 sm:p-5 flex flex-col gap-2.5 sm:gap-3.5">
                {/* Ambient Team Glow */}
                <div className="absolute -top-16 -left-16 w-48 h-48 bg-red-500/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
                
                {/* Match Header — Seamless Integrated */}
                <div className="relative flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <LeagueLogo league={liveFeaturedMatch.league} size={14} />
                    <span className="font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] truncate max-w-[200px] sm:max-w-none">
                      {liveFeaturedMatch.league} · {liveFeaturedMatch.round}
                    </span>
                  </div>
                  <span className="text-slate-400 dark:text-zinc-500 text-[11px] font-medium hidden sm:inline">Old Trafford</span>
                </div>

                {/* Scoreboard Block */}
                <div className="relative">
                  
                  {/* Symmetrical Clubs, Score & Scorers — Single Unified Grid */}
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-4">
                    
                    {/* Home Team Column */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 text-right min-w-0">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg truncate leading-tight block">
                          <span className="hidden sm:inline">{liveFeaturedMatch.home}</span>
                          <span className="sm:hidden">{liveFeaturedMatch.homeCode}</span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium block truncate">
                          5th in PL
                        </span>
                      </div>
                      <ClubCrest code={liveFeaturedMatch.homeCode} size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                    </div>

                    {/* Center Column: Score & Minute (Without 'Live' text) */}
                    <div className="flex flex-col items-center justify-center px-1.5 sm:px-4 w-20 sm:w-32 shrink-0">
                      <div className="font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight tabular-nums flex items-center justify-center gap-1.5 sm:gap-2 font-mono">
                        <span>{liveFeaturedMatch.homeScore}</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal text-lg sm:text-2xl">-</span>
                        <span>{liveFeaturedMatch.awayScore}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {liveFeaturedMatch.minute}
                        </span>
                      </div>
                    </div>

                    {/* Away Team Column */}
                    <div className="flex items-center justify-start gap-2 sm:gap-3 text-left min-w-0">
                      <ClubCrest code={liveFeaturedMatch.awayCode} size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg truncate leading-tight block">
                          <span className="hidden sm:inline">{liveFeaturedMatch.away}</span>
                          <span className="sm:hidden">{liveFeaturedMatch.awayCode}</span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium block truncate">
                          2nd in PL
                        </span>
                      </div>
                    </div>

                    {/* Scorers Row in the SAME Grid — 100% Mathematically Centered */}
                    {((liveFeaturedMatch.scorers?.home && liveFeaturedMatch.scorers.home.length > 0) ||
                      (liveFeaturedMatch.scorers?.away && liveFeaturedMatch.scorers.away.length > 0)) && (
                      <>
                        <div className="col-span-3 border-t border-slate-100/80 dark:border-[#27272A]/70 my-2.5 sm:my-3" />

                        {/* Home Scorers (Right-aligned, max width up to center column) */}
                        <div className="space-y-0.5 sm:space-y-1 text-right min-w-0">
                          {liveFeaturedMatch.scorers?.home?.map((scorer, idx) => (
                            <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                              {scorer}
                            </div>
                          ))}
                        </div>

                        {/* Center Column: Soccer Ball Icon top-aligned with first scorer line */}
                        <div className="self-start flex justify-center items-center h-4 sm:h-4.5 w-20 sm:w-32 shrink-0 pt-0.5">
                          <SoccerBallIcon size={12} className="text-slate-400 dark:text-zinc-500" />
                        </div>

                        {/* Away Scorers (Left-aligned, or empty to preserve symmetrical column track) */}
                        <div className="space-y-0.5 sm:space-y-1 text-left min-w-0">
                          {liveFeaturedMatch.scorers?.away && liveFeaturedMatch.scorers.away.length > 0 ? (
                            liveFeaturedMatch.scorers.away.map((scorer, idx) => (
                              <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                                {scorer}
                              </div>
                            ))
                          ) : null}
                        </div>
                      </>
                    )}

                  </div>

                  {/* xG Momentum Bar + CTA */}
                  <div className="mt-3 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-[#27272A] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="font-bold text-red-600 dark:text-red-400">xG {liveFeaturedMatch.xgHome}</span>
                        <span className="text-slate-300 dark:text-zinc-600">—</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">xG {liveFeaturedMatch.xgAway}</span>
                      </div>
                      <Link
                        href="/match-center"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 dark:text-zinc-100 hover:text-tactiq-green dark:hover:text-tactiq-green transition-colors"
                      >
                        <span>Match Center</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                    {/* Dual Color xG Bar */}
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800 gap-0.5">
                      <div className="h-full bg-[#EF0107] rounded-full transition-all duration-300" style={{ width: '58%' }} />
                      <div className="h-full bg-[#6CABDD] rounded-full transition-all duration-300" style={{ width: '42%' }} />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 3. Grouped Matches By Competition */}
            <div className="space-y-4">
              {groupedLeagues.map((leagueName) => {
                const matchesInLeague = filteredMatches.filter((m) => m.league === leagueName);
                if (matchesInLeague.length === 0) return null;

                return (
                  <div key={leagueName} className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs overflow-hidden transition-colors">
                    
                    {/* League Subheader */}
                    <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-[#16161A] border-b border-slate-200/80 dark:border-[#27272A] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{leagueName}</span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">· {matchesInLeague[0].leagueCountry}</span>
                      </div>
                      <Link
                        href="/match-center"
                        className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>Standings</span>
                        <ChevronRight size={12} />
                      </Link>
                    </div>

                    {/* Match List Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-[#27272A]">
                      {matchesInLeague.map((match) => (
                        <Link
                          key={match.id}
                          href="/match-center"
                          className="block p-3.5 hover:bg-slate-50/80 dark:hover:bg-[#1A1A1E] transition-colors group"
                        >
                          <div className="grid grid-cols-[54px_1fr] items-center gap-3">
                            
                            {/* Status Column */}
                            <div className="text-center font-mono">
                              {match.status === 'LIVE' ? (
                                <span className="font-bold text-xs sm:text-[13px] text-rose-600 dark:text-rose-400 tracking-tight">
                                  {match.minute}
                                </span>
                              ) : match.status === 'HT' ? (
                                <span className="font-bold text-xs text-amber-600 dark:text-amber-400 tracking-tight">
                                  HT
                                </span>
                              ) : match.status === 'FT' ? (
                                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                                  FT
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                  {match.startTime}
                                </span>
                              )}
                            </div>

                            {/* Teams & Scorers */}
                            <div className="space-y-1.5 min-w-0 pr-1">
                              {/* Home Row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <ClubCrest code={match.homeCode} size={18} />
                                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {match.home}
                                  </span>
                                </div>
                                {match.homeScore !== undefined && (
                                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                    {match.homeScore}
                                  </span>
                                )}
                              </div>

                              {/* Away Row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <ClubCrest code={match.awayCode} size={18} />
                                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {match.away}
                                  </span>
                                </div>
                                {match.awayScore !== undefined && (
                                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                    {match.awayScore}
                                  </span>
                                )}
                              </div>
                            </div>

                          </div>
                        </Link>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>

          </main>

          {/* ════════════════════════════════════════════════════════════════
              COLUMN 3: Right Contextual Rail - Standings & Leaders (3 cols)
             ════════════════════════════════════════════════════════════════ */}
          <aside className="flex flex-col gap-4 lg:col-span-3">
            
            {/* 1. Mini League Standings */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs p-3.5 transition-colors">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-[#27272A]">
                <div className="flex items-center gap-2">
                  <LeagueLogo league="Premier League" size={16} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Premier League Table</span>
                </div>
                <Link href="/match-center" className="text-[11px] font-semibold text-slate-900 dark:text-zinc-100 hover:underline">
                  Full
                </Link>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-[20px_1fr_28px_32px_28px] text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider pb-1 px-1">
                <span>#</span>
                <span>Club</span>
                <span className="text-center">P</span>
                <span className="text-center">GD</span>
                <span className="text-right">PTS</span>
              </div>

              {/* Standings Rows */}
              <div className="divide-y divide-slate-100 dark:divide-[#27272A] text-xs">
                {STANDINGS.map((row) => (
                  <div
                    key={row.rank}
                    className="grid grid-cols-[20px_1fr_28px_32px_28px] items-center py-2 px-1 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors"
                  >
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                      {row.rank}
                    </span>
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <ClubCrest code={row.club} size={15} />
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {row.club}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 dark:text-zinc-400 text-center">{row.p}</span>
                    <span className="font-mono text-slate-600 dark:text-zinc-400 text-center">{row.gd}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-right">{row.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Top Performers */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs p-3.5 transition-colors">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-[#27272A]">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <SoccerBallIcon size={14} className="text-slate-700 dark:text-zinc-300" />
                  Top Scorers
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">GW 8</span>
              </div>

              <div className="space-y-2.5">
                {TOP_SCORERS.map((player, idx) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400 dark:text-zinc-500 w-3 text-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ClubCrest code={player.club} size={13} />
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                            {player.club}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {player.goals}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        G
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}
