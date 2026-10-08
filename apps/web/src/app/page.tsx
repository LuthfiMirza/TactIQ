'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Flame,
  Radio,
} from 'lucide-react';
import { ClubCrest, LeagueLogo, SoccerBallIcon, CountryFlag } from '@/components/ui/club-crest';
import { MatchdayMarquee } from '@/components/matchday-marquee';
import { api } from '@/lib/api';
import { type Match, INITIAL_AUTHENTIC_MATCHES, CALENDAR_DAYS, getMatchesByDateKey } from '@/lib/matchesRegistry';

// ─── TYPES & DATA ────────────────────────────────────────────────────────────

interface StandingItem {
  rank: number;
  club: string;
  code: string;
  p: number;
  gd: string;
  pts: number;
}

// 5 LIGA TOP EROPA UTAMA
const TOP_5_LEAGUES = [
  { id: 'all', code: 'ALL', name: 'All Top 5 Leagues', count: 25 },
  { id: 'epl', code: 'PL', name: 'Premier League', country: 'England', count: 8, popular: true },
  { id: 'laliga', code: 'PD', name: 'La Liga', country: 'Spain', count: 5, popular: true },
  { id: 'seriea', code: 'SA', name: 'Serie A', country: 'Italy', count: 4, popular: true },
  { id: 'bundesliga', code: 'BL1', name: 'Bundesliga', country: 'Germany', count: 4, popular: true },
  { id: 'ligue1', code: 'FL1', name: 'Ligue 1', country: 'France', count: 4, popular: true },
];


function MatchListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map((group) => (
        <div key={group} className="bg-[#121215] rounded-xl border border-[#27272A] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#16161A] border-b border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-zinc-800" />
              <div className="h-3.5 bg-zinc-800 rounded w-28" />
            </div>
            <div className="h-3 bg-zinc-800/60 rounded w-20" />
          </div>
          <div className="divide-y divide-[#27272A]">
            {[1, 2, 3].map((row) => (
              <div key={row} className="p-3.5 flex items-center gap-4">
                <div className="w-12 h-4 bg-zinc-800 rounded shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-zinc-800" />
                      <div className="h-3.5 bg-zinc-800 rounded w-24 sm:w-36" />
                    </div>
                    <div className="h-3.5 bg-zinc-800 rounded w-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-zinc-800" />
                      <div className="h-3.5 bg-zinc-800 rounded w-24 sm:w-36" />
                    </div>
                    <div className="h-3.5 bg-zinc-800 rounded w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [liveOnly, setLiveOnly] = useState<boolean>(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-10-10');
  const [isDateLoading, setIsDateLoading] = useState<boolean>(false);
  const [matches, setMatches] = useState<Match[]>(INITIAL_AUTHENTIC_MATCHES);

  const handleSelectDateKey = (dateKey: string) => {
    if (dateKey === selectedDateKey) return;
    setIsDateLoading(true);
    setSelectedDateKey(dateKey);
    const dateMatches = getMatchesByDateKey(dateKey);
    setMatches(dateMatches);
    setTimeout(() => {
      setIsDateLoading(false);
    }, 240);
  };

  const handlePrevDate = () => {
    const currentIndex = CALENDAR_DAYS.findIndex((d) => d.dateKey === selectedDateKey);
    if (currentIndex > 0) {
      handleSelectDateKey(CALENDAR_DAYS[currentIndex - 1].dateKey);
    }
  };

  const handleNextDate = () => {
    const currentIndex = CALENDAR_DAYS.findIndex((d) => d.dateKey === selectedDateKey);
    if (currentIndex < CALENDAR_DAYS.length - 1) {
      handleSelectDateKey(CALENDAR_DAYS[currentIndex + 1].dateKey);
    }
  };

  const [standings, setStandings] = useState<StandingItem[]>([
    { rank: 1, club: 'Manchester City', code: 'MCI', p: 8, gd: '+14', pts: 20 },
    { rank: 2, club: 'Arsenal', code: 'ARS', p: 8, gd: '+11', pts: 18 },
    { rank: 3, club: 'Liverpool', code: 'LIV', p: 8, gd: '+10', pts: 18 },
    { rank: 4, club: 'Aston Villa', code: 'AVL', p: 8, gd: '+6', pts: 17 },
    { rank: 5, club: 'Chelsea', code: 'CHE', p: 8, gd: '+8', pts: 14 },
    { rank: 6, club: 'Tottenham', code: 'TOT', p: 8, gd: '+5', pts: 13 },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update standings when selectedLeague changes
  useEffect(() => {
    const targetCode = selectedLeague === 'all' ? 'PL' :
      selectedLeague === 'epl' ? 'PL' :
      selectedLeague === 'laliga' ? 'PD' :
      selectedLeague === 'seriea' ? 'SA' :
      selectedLeague === 'bundesliga' ? 'BL1' :
      selectedLeague === 'ligue1' ? 'FL1' : 'PL';

    fetch(`http://localhost:4000/api/v1/matches/standings?league=${targetCode}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: StandingItem[] = json.data.slice(0, 7).map((s: any) => ({
            rank: s.position,
            club: s.team?.name || 'Club',
            code: s.team?.code || 'CLUB',
            p: s.played,
            gd: s.goalDifference > 0 ? `+${s.goalDifference}` : `${s.goalDifference}`,
            pts: s.points,
          }));
          setStandings(mapped);
        }
      })
      .catch(() => {});
  }, [selectedLeague]);

  // Filter matches - STRICT TOP 5 LEAGUES ONLY
  const TOP_5_CODES = ['PL', 'PD', 'SA', 'BL1', 'FL1'];
  const TOP_5_NAMES = ['premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1'];

  const filteredMatches = matches.filter((m) => {
    const isTop5 = TOP_5_CODES.includes(m.leagueCode) || TOP_5_NAMES.some((t) => (m.league || '').toLowerCase().includes(t));
    if (!isTop5) return false;

    if (selectedLeague !== 'all') {
      if (selectedLeague === 'epl' && m.leagueCode !== 'PL' && m.league !== 'Premier League') return false;
      if (selectedLeague === 'laliga' && m.leagueCode !== 'PD' && m.league !== 'La Liga') return false;
      if (selectedLeague === 'seriea' && m.leagueCode !== 'SA' && m.league !== 'Serie A') return false;
      if (selectedLeague === 'bundesliga' && m.leagueCode !== 'BL1' && m.league !== 'Bundesliga') return false;
      if (selectedLeague === 'ligue1' && m.leagueCode !== 'FL1' && m.league !== 'Ligue 1') return false;
    }
    if (liveOnly && m.status !== 'LIVE' && m.status !== 'HT') return false;
    return true;
  });

  // Group matches by league
  const groupedLeagues = Array.from(new Set(filteredMatches.map((m) => m.league)));

  const currentLeagueTitle = TOP_5_LEAGUES.find((l) => l.id === selectedLeague)?.name || 'Top 5 Leagues';

  if (!mounted) {
    return <div className="min-h-screen bg-[#09090B] animate-pulse" />;
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 pb-16 pt-3 sm:pt-4 transition-colors">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6">
        
        {/* ── Top Matchday Marquee Broadcast Ticker ── */}
        <MatchdayMarquee
          matches={filteredMatches.map((m) => ({
            id: m.id,
            homeCode: m.homeCode,
            awayCode: m.awayCode,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: m.status,
            minute: m.minute,
            startTime: m.startTime,
            mode: 'live',
          }))}
          className="mb-4 sm:mb-5"
        />

        {/* ── Main 3-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ════════════════════════════════════════════════════════════════
              COLUMN 1: Left Navigation & 5 Big Leagues (3 cols)
             ════════════════════════════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col gap-4 lg:col-span-3">
            
            {/* Quick Filter Card */}
            <div className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs p-3 transition-colors">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1.5 mb-1">
                Feeds & Filters
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setSelectedLeague('all'); setLiveOnly(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedLeague === 'all' && !liveOnly
                      ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Trophy size={14} className={selectedLeague === 'all' && !liveOnly ? 'text-white' : 'text-zinc-500'} />
                    All Matches
                  </span>
                  <span className={`text-[11px] font-mono ${selectedLeague === 'all' && !liveOnly ? 'text-zinc-300 font-bold' : 'text-zinc-400'}`}>
                    {matches.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLiveOnly(!liveOnly)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    liveOnly
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Matches
                  </span>
                </button>

                <Link
                  href="/match-center"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/30 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Activity size={14} className="text-zinc-500" />
                    Match Center Detail
                  </span>
                  <span className="text-[10px] text-zinc-500">→</span>
                </Link>
              </div>
            </div>

            {/* Top 5 European Leagues Navigation */}
            <div className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs p-3 transition-colors">
              <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Top 5 European Leagues
                </span>
              </div>
              <div className="space-y-0.5">
                {TOP_5_LEAGUES.filter((l) => l.id !== 'all').map((league) => {
                  const isActive = selectedLeague === league.id;
                  return (
                    <button
                      key={league.id}
                      type="button"
                      onClick={() => setSelectedLeague(league.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <LeagueLogo league={league.name} size={16} />
                        <span className="truncate">{league.name}</span>
                      </span>
                      <CountryFlag country={league.country} width={18} height={12} />
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
            
            {/* Mobile / Tablet Horizontal Filter Chips */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              <button
                type="button"
                onClick={() => { setSelectedLeague('all'); setLiveOnly(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedLeague === 'all' && !liveOnly
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'bg-[#121215] text-zinc-400 border border-[#27272A]'
                }`}
              >
                All (25)
              </button>

              <button
                type="button"
                onClick={() => setLiveOnly(!liveOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  liveOnly
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'bg-[#121215] text-zinc-400 border border-[#27272A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </button>

              {TOP_5_LEAGUES.filter((l) => l.id !== 'all').map((league) => {
                const isActive = selectedLeague === league.id && !liveOnly;
                return (
                  <button
                    key={league.id}
                    type="button"
                    onClick={() => { setSelectedLeague(league.id); setLiveOnly(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                        : 'bg-[#121215] text-zinc-400 border border-[#27272A]'
                    }`}
                  >
                    <LeagueLogo league={league.name} size={14} />
                    <span>{league.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 1. Date Selector: FotMob/Flashscore Calendar Strip (Compact & Centered) */}
            <div className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs px-2 py-1.5 flex items-center justify-between gap-1 transition-colors">
              <button
                type="button"
                onClick={handlePrevDate}
                disabled={selectedDateKey === CALENDAR_DAYS[0]?.dateKey}
                aria-label="Previous day"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  selectedDateKey === CALENDAR_DAYS[0]?.dateKey
                    ? 'text-zinc-600 opacity-40 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1A1A1E] cursor-pointer'
                }`}
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                {CALENDAR_DAYS.map((day) => {
                  const isSelected = day.dateKey === selectedDateKey;
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => handleSelectDateKey(day.dateKey)}
                      className={`flex flex-col items-center justify-center px-1.5 sm:px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer min-w-[46px] sm:min-w-[54px] ${
                        isSelected
                          ? 'bg-[#1E1E24] text-white font-bold border border-emerald-500/40 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181C]'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75 leading-tight flex items-center gap-1">
                        {day.dayName}
                        {day.isToday && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        )}
                      </span>
                      <span className="font-mono text-[11px] sm:text-xs font-bold tracking-tight leading-tight mt-0.5">
                        {day.dateLabel}
                      </span>
                      {day.isToday && (
                        <span className={`text-[7.5px] font-mono uppercase tracking-widest font-black leading-none mt-0.5 ${
                          isSelected ? 'text-emerald-400' : 'text-zinc-500'
                        }`}>
                          TODAY
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNextDate}
                disabled={selectedDateKey === CALENDAR_DAYS[CALENDAR_DAYS.length - 1]?.dateKey}
                aria-label="Next day"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  selectedDateKey === CALENDAR_DAYS[CALENDAR_DAYS.length - 1]?.dateKey
                    ? 'text-zinc-600 opacity-40 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1A1A1E] cursor-pointer'
                }`}
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* 2. Main Matchday Stream (with Skeleton Loading Transition) */}
            {isDateLoading ? (
              <MatchListSkeleton />
            ) : (
              <div className="space-y-4">
                  {groupedLeagues.map((leagueName) => {
                    const matchesInLeague = filteredMatches.filter((m) => m.league === leagueName);
                    if (matchesInLeague.length === 0) return null;

                    return (
                      <div key={leagueName} className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs overflow-hidden transition-colors">
                        
                        {/* League Subheader */}
                        <div className="px-4 py-2.5 bg-[#16161A] border-b border-[#27272A] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <LeagueLogo league={leagueName} size={18} />
                            <span className="text-sm font-bold text-white tracking-tight">{leagueName}</span>
                            <CountryFlag country={matchesInLeague[0]?.leagueCountry} width={16} height={11} />
                          </div>
                          <Link
                            href={`/match-center?league=${encodeURIComponent(leagueName)}`}
                            className="text-[11px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800/60"
                          >
                            <span>Klasemen Detail</span>
                            <ChevronRight size={12} />
                          </Link>
                        </div>

                        {/* Match List Rows (FotMob / SofaScore Pro Style) */}
                        <div className="divide-y divide-[#27272A]">
                          {matchesInLeague.map((match) => (
                            <Link
                              key={match.id}
                              href={`/match-center?id=${match.id}&league=${encodeURIComponent(match.league)}`}
                              className="group block px-3.5 py-3 sm:px-4 sm:py-3.5 hover:bg-[#18181D] transition-all relative overflow-hidden"
                            >
                              {/* Left accent hover indicator */}
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-lime-400 transition-colors" />

                              <div className="flex items-center justify-between gap-3 sm:gap-4">
                                
                                {/* Status / Kickoff Column */}
                                <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-center font-mono border-r border-[#27272A]/80 pr-2.5 sm:pr-3">
                                  {match.status === 'LIVE' ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-black tracking-tight text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      {match.minute}'
                                    </span>
                                  ) : match.status === 'HT' ? (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-tight text-amber-400 bg-amber-500/10 border border-amber-500/30">
                                      HT
                                    </span>
                                  ) : match.status === 'FT' ? (
                                    <span className="px-2 py-0.5 rounded text-[10.5px] font-bold text-zinc-400 bg-zinc-800/80 border border-zinc-700/50">
                                      FT
                                    </span>
                                  ) : (
                                    <span className="text-xs sm:text-[13px] font-bold text-zinc-200 tracking-tight group-hover:text-white transition-colors">
                                      {match.startTime || '20:00'}
                                    </span>
                                  )}
                                </div>

                                {/* Teams & Scores */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  {/* Home Row */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <ClubCrest code={match.homeCode} size={20} className="shrink-0 drop-shadow-xs" />
                                      <span className={`text-xs sm:text-[13px] truncate transition-colors ${
                                        match.status === 'FT' && match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore < match.awayScore
                                          ? 'text-zinc-400 font-medium'
                                          : 'text-zinc-100 font-semibold group-hover:text-lime-400'
                                      }`}>
                                        {match.home}
                                      </span>
                                    </div>
                                    {match.homeScore !== undefined && (
                                      <span className={`font-mono text-sm px-1.5 py-0.2 rounded font-bold ${
                                        match.awayScore !== undefined && match.homeScore > match.awayScore
                                          ? 'text-white font-extrabold bg-zinc-800/90'
                                          : match.awayScore !== undefined && match.homeScore < match.awayScore
                                          ? 'text-zinc-500'
                                          : 'text-zinc-200'
                                      }`}>
                                        {match.homeScore}
                                      </span>
                                    )}
                                  </div>

                                  {/* Away Row */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <ClubCrest code={match.awayCode} size={20} className="shrink-0 drop-shadow-xs" />
                                      <span className={`text-xs sm:text-[13px] truncate transition-colors ${
                                        match.status === 'FT' && match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore < match.homeScore
                                          ? 'text-zinc-400 font-medium'
                                          : 'text-zinc-100 font-semibold group-hover:text-lime-400'
                                      }`}>
                                        {match.away}
                                      </span>
                                    </div>
                                    {match.awayScore !== undefined && (
                                      <span className={`font-mono text-sm px-1.5 py-0.2 rounded font-bold ${
                                        match.homeScore !== undefined && match.awayScore > match.homeScore
                                          ? 'text-white font-extrabold bg-zinc-800/90'
                                          : match.homeScore !== undefined && match.awayScore < match.homeScore
                                          ? 'text-zinc-500'
                                          : 'text-zinc-200'
                                      }`}>
                                        {match.awayScore}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side: Round/Venue & Match Center Action */}
                                <div className="shrink-0 flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#27272A]/40">
                                  <div className="hidden sm:flex flex-col items-end text-right">
                                    {match.round && (
                                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                                        {match.round}
                                      </span>
                                    )}
                                    {match.venue ? (
                                      <span className="text-[11px] text-zinc-500 truncate max-w-[130px] lg:max-w-[160px]">
                                        {match.venue}
                                      </span>
                                    ) : match.status === 'FT' && match.xgHome !== undefined && match.xgAway !== undefined ? (
                                      <span className="text-[10px] font-mono text-zinc-500">
                                        xG {match.xgHome.toFixed(2)} - {match.xgAway.toFixed(2)}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex items-center">
                                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold text-zinc-400 group-hover:text-lime-400 bg-zinc-900 group-hover:bg-lime-400/10 border border-zinc-800 group-hover:border-lime-400/30 transition-all shadow-2xs">
                                      <span className="hidden md:inline">Match Center</span>
                                      <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                    </span>
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
            )}

          </main>

          {/* ════════════════════════════════════════════════════════════════
              COLUMN 3: Right Contextual Rail - Real Standings (3 cols)
             ════════════════════════════════════════════════════════════════ */}
          <aside className="flex flex-col gap-4 lg:col-span-3">
            
            {/* 1. Real Standings Card */}
            <div className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs p-3.5 transition-colors">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <LeagueLogo league={currentLeagueTitle} size={16} />
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">{currentLeagueTitle}</span>
                </div>
                <Link
                  href={`/match-center?league=${encodeURIComponent(currentLeagueTitle)}`}
                  className="text-[11px] font-semibold text-lime-400 hover:underline"
                >
                  Detail Full
                </Link>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-[20px_1fr_28px_32px_28px] text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-1 px-1">
                <span>#</span>
                <span>Club</span>
                <span className="text-center">P</span>
                <span className="text-center">GD</span>
                <span className="text-right">PTS</span>
              </div>

              {/* Standings Rows */}
              <div className="divide-y divide-[#27272A] text-xs">
                {standings.map((row) => (
                  <div
                    key={row.code + row.rank}
                    className="grid grid-cols-[20px_1fr_28px_32px_28px] items-center py-2 px-1 hover:bg-[#1A1A1E] transition-colors"
                  >
                    <span className={`font-mono text-[11px] ${row.rank === 1 ? 'font-black text-lime-400' : 'font-bold text-zinc-400'}`}>
                      {row.rank}
                    </span>
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <ClubCrest code={row.code} size={15} />
                      <span className="font-semibold text-zinc-200 truncate">
                        {row.club}
                      </span>
                    </div>
                    <span className="font-mono text-center text-zinc-400 text-[11px]">
                      {row.p}
                    </span>
                    <span className="font-mono text-center text-zinc-400 text-[11px]">
                      {row.gd}
                    </span>
                    <span className="font-mono font-bold text-right text-white text-[11px]">
                      {row.pts}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-[#27272A] text-center">
                <Link
                  href={`/match-center?league=${encodeURIComponent(currentLeagueTitle)}`}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Lihat klasemen lengkap 20 klub →
                </Link>
              </div>
            </div>

            {/* 2. Top 5 European Leagues Info Card */}
            <div className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs p-3.5 transition-colors">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                European Prestige Coverage
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                TactIQ memantau dan menganalisis performa taktis dari 5 liga elit dunia: Premier League, La Liga, Serie A, Bundesliga, dan Ligue 1.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                API Real-Time Connected
              </div>
            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}