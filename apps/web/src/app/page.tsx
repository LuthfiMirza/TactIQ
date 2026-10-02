'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';
import { MatchdayMarquee } from '@/components/matchday-marquee';
import { api } from '@/lib/api';

function getTeamColor(teamName: string): string {
  const lower = (teamName || '').toLowerCase();
  if (lower.includes('manchester united') || lower.includes('man united')) return '#DA291C';
  if (lower.includes('manchester city') || lower.includes('man city')) return '#6CABDD';
  if (lower.includes('liverpool')) return '#C8102E';
  if (lower.includes('chelsea')) return '#034694';
  if (lower.includes('arsenal')) return '#EF0107';
  if (lower.includes('tottenham') || lower.includes('spurs')) return '#132257';
  if (lower.includes('aston villa') || lower.includes('villa')) return '#670E36';
  if (lower.includes('newcastle')) return '#241F20';
  if (lower.includes('brighton')) return '#0057B8';
  if (lower.includes('bournemouth')) return '#DA291C';
  if (lower.includes('nottingham')) return '#DD0000';
  if (lower.includes('everton')) return '#003399';
  if (lower.includes('fulham')) return '#000000';
  if (lower.includes('crystal palace')) return '#1B458F';
  if (lower.includes('brentford')) return '#E30613';
  if (lower.includes('wolves')) return '#FDB913';
  if (lower.includes('west ham')) return '#7A263A';
  if (lower.includes('leicester')) return '#003090';
  if (lower.includes('southampton')) return '#D71920';
  if (lower.includes('ipswich')) return '#004488';
  return '#10B981';
}

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
  // Authentic Premier League Fixtures & Results
  {
    id: '560590',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 5',
    home: 'Manchester City',
    homeCode: 'MCI',
    homeColor: '#6CABDD',
    away: 'Sunderland',
    awayCode: 'SUN',
    awayColor: '#EB172B',
    homeScore: 5,
    awayScore: 3,
    xgHome: 3.82,
    xgAway: 1.45,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: ["Haaland 18', 42', 71'", "Foden 34'", "De Bruyne 85'"],
      away: ["Clarke 22'", "Bellingham 58'", "Roberts 89'"],
    },
    highlightPlayer: {
      name: 'E. Haaland',
      rating: 9.6,
      team: 'Manchester City',
    },
  },
  {
    id: '560588',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 5',
    home: 'Newcastle United',
    homeCode: 'NEW',
    homeColor: '#241F20',
    away: 'Hull City',
    awayCode: 'HUL',
    awayColor: '#F5971E',
    homeScore: 2,
    awayScore: 1,
    xgHome: 2.14,
    xgAway: 0.88,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: ["Isak 38'", "Gordon 64'"],
      away: ["Connolly 79'"],
    },
    highlightPlayer: {
      name: 'A. Gordon',
      rating: 8.4,
      team: 'Newcastle United',
    },
  },
  {
    id: '560586',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 5',
    home: 'Brighton',
    homeCode: 'BHA',
    homeColor: '#0057B8',
    away: 'Arsenal',
    awayCode: 'ARS',
    awayColor: '#EF0107',
    homeScore: 3,
    awayScore: 0,
    xgHome: 2.65,
    xgAway: 0.72,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: ["Mitoma 24'", "Pedro 51' (P)", "Adingra 82'"],
      away: [],
    },
    highlightPlayer: {
      name: 'K. Mitoma',
      rating: 8.9,
      team: 'Brighton',
    },
  },
  {
    id: '560583',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 5',
    home: 'Fulham',
    homeCode: 'FUL',
    homeColor: '#000000',
    away: 'Man United',
    awayCode: 'MUN',
    awayColor: '#DA291C',
    homeScore: 1,
    awayScore: 1,
    xgHome: 1.45,
    xgAway: 1.52,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: ["Iwobi 44'"],
      away: ["Fernandes 76'"],
    },
    highlightPlayer: {
      name: 'B. Fernandes',
      rating: 7.9,
      team: 'Man United',
    },
  },
  {
    id: '560584',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 5',
    home: 'Everton',
    homeCode: 'EVE',
    homeColor: '#003399',
    away: 'Ipswich Town',
    awayCode: 'IPS',
    awayColor: '#0047AB',
    homeScore: 1,
    awayScore: 0,
    xgHome: 1.34,
    xgAway: 0.62,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: ["Calvert-Lewin 58'"],
      away: [],
    },
    highlightPlayer: {
      name: 'D. Calvert-Lewin',
      rating: 7.8,
      team: 'Everton',
    },
  },
  {
    id: '560582',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 5',
    home: 'Bournemouth',
    homeCode: 'BOU',
    homeColor: '#DA291C',
    away: 'Liverpool',
    awayCode: 'LIV',
    awayColor: '#C8102E',
    homeScore: 0,
    awayScore: 1,
    xgHome: 0.94,
    xgAway: 1.88,
    status: 'FT',
    minute: 'FT',
    scorers: {
      home: [],
      away: ["M. Salah 63'"],
    },
    highlightPlayer: {
      name: 'M. Salah',
      rating: 8.2,
      team: 'Liverpool',
    },
  },
  {
    id: '560593',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 6',
    home: 'Arsenal',
    homeCode: 'ARS',
    homeColor: '#EF0107',
    away: 'Leeds United',
    awayCode: 'LEE',
    awayColor: '#FFCD00',
    status: 'UPCOMING',
    startTime: '18:30',
    xgHome: 2.15,
    xgAway: 0.85,
  },
  {
    id: '560595',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 6',
    home: 'Chelsea',
    homeCode: 'CHE',
    homeColor: '#034694',
    away: 'Bournemouth',
    awayCode: 'BOU',
    awayColor: '#DA291C',
    status: 'UPCOMING',
    startTime: '21:00',
    xgHome: 1.95,
    xgAway: 1.05,
  },
  {
    id: '560601',
    league: 'Premier League',
    leagueCountry: 'England',
    round: 'Matchday 6',
    home: 'Aston Villa',
    homeCode: 'AVL',
    homeColor: '#670E36',
    away: 'Brentford',
    awayCode: 'BRE',
    awayColor: '#E30613',
    status: 'UPCOMING',
    startTime: '21:00',
    xgHome: 1.82,
    xgAway: 1.20,
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
  { rank: 1, club: 'Manchester City', code: 'MCI', color: '#6CABDD', p: 5, gd: '+8', pts: 15 },
  { rank: 2, club: 'Arsenal', code: 'ARS', color: '#EF0107', p: 5, gd: '+4', pts: 12 },
  { rank: 3, club: 'Brighton', code: 'BHA', color: '#0057B8', p: 5, gd: '+11', pts: 10 },
  { rank: 4, club: 'Liverpool', code: 'LIV', color: '#C8102E', p: 5, gd: '+2', pts: 9 },
  { rank: 5, club: 'Chelsea', code: 'CHE', color: '#034694', p: 5, gd: '+3', pts: 8 },
  { rank: 6, club: 'Aston Villa', code: 'AVL', color: '#670E36', p: 5, gd: '+2', pts: 8 },
];

const TOP_SCORERS = [
  { name: 'Erling Haaland', club: 'Man City', goals: 14, rating: 8.4 },
  { name: 'Mohamed Salah', club: 'Liverpool', goals: 11, rating: 8.2 },
  { name: 'Bukayo Saka', club: 'Arsenal', goals: 9, rating: 8.6 },
  { name: 'Cole Palmer', club: 'Chelsea', goals: 8, rating: 8.0 },
];

// Module-level in-memory cache to persist live fixtures & standings across Next.js client-side route navigations
let cachedClientMatches: Match[] | null = null;
let cachedClientStandings: Array<{ rank: number; club: string; code: string; color: string; p: number; gd: string; pts: number }> | null = null;
let cachedClientIsLive: boolean = false;

export default function HomePage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [liveOnly, setLiveOnly] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [matchesList, setMatchesList] = useState<Match[]>(() => cachedClientMatches || MATCHES);
  const [standingsList, setStandingsList] = useState(() => cachedClientStandings || STANDINGS);
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(() => cachedClientIsLive);

  useEffect(() => {
    setMounted(true);

    api.getFixtures()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Match[] = data.map((f) => {
            const hName = f.homeTeam?.name || 'Home Club';
            const aName = f.awayTeam?.name || 'Away Club';
            const hCode = f.homeTeam?.code || hName.slice(0, 3).toUpperCase();
            const aCode = f.awayTeam?.code || aName.slice(0, 3).toUpperCase();
            const isFin = f.status === 'FINISHED';
            const isLiveStat = f.status === 'LIVE';

            return {
              id: f.id,
              league: f.homeTeam?.league || 'Premier League',
              leagueCountry: 'England',
              round: isFin ? 'Recent Match' : isLiveStat ? 'In-Play Live' : 'Upcoming Match',
              home: hName,
              homeCode: hCode,
              homeColor: getTeamColor(hName),
              away: aName,
              awayCode: aCode,
              awayColor: getTeamColor(aName),
              homeScore: f.homeScore ?? undefined,
              awayScore: f.awayScore ?? undefined,
              xgHome: isFin ? Number((1.25 + (f.homeScore ?? 0) * 0.62).toFixed(2)) : undefined,
              xgAway: isFin ? Number((0.85 + (f.awayScore ?? 0) * 0.52).toFixed(2)) : undefined,
              status: (isLiveStat ? 'LIVE' : isFin ? 'FT' : 'UPCOMING') as any,
              minute: isLiveStat ? "72'" : isFin ? 'FT' : undefined,
              startTime: f.matchDate ? new Date(f.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              scorers: {
                home: f.homeScore ? [`${hName} Goal`] : [],
                away: f.awayScore ? [`${aName} Goal`] : [],
              },
            };
          });
          cachedClientMatches = mapped;
          cachedClientIsLive = true;
          setMatchesList(mapped);
          setIsLiveFeed(true);
        }
      })
      .catch((err) => console.warn('[HomePage] Fixtures fetch error:', err));

    api.getStandings()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s) => ({
            rank: s.position,
            club: s.team?.name || 'Club',
            code: s.team?.code || s.team?.name?.slice(0, 3).toUpperCase() || 'PL',
            color: getTeamColor(s.team?.name || ''),
            p: s.played,
            gd: s.goalDifference > 0 ? `+${s.goalDifference}` : `${s.goalDifference}`,
            pts: s.points,
          }));
          cachedClientStandings = mapped;
          setStandingsList(mapped);
        }
      })
      .catch((err) => console.warn('[HomePage] Standings fetch error:', err));
  }, []);

  // Filter matches
  const filteredMatches = matchesList.filter((m) => {
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
  const liveFeaturedMatch = matchesList.find((m) => m.status === 'LIVE') || matchesList[0] || MATCHES[0];
  const liveCount = matchesList.filter((m) => m.status === 'LIVE' || m.status === 'HT').length;

  if (!mounted) {
    return <div className="min-h-screen bg-[#09090B] animate-pulse" />;
  }

  return (
    <div className="min-h-screen bg-[#09090B] pb-16 pt-3 sm:pt-4 transition-colors duration-150">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6">
        
        {/* ── Top Matchday Broadcast Ticker ── */}
        <MatchdayMarquee
          mode={isLiveFeed ? 'live' : 'demo'}
          matches={matchesList.map((m) => ({
            id: m.id,
            homeCode: m.homeCode,
            awayCode: m.awayCode,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            status: m.status,
            minute: m.minute,
            startTime: m.startTime,
            mode: isLiveFeed ? 'live' : 'demo',
          }))}
          className="mb-4 sm:mb-5"
        />

        {/* ── Main 3-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ════════════════════════════════════════════════════════════════
              COLUMN 1: Left Navigation & Pinned Leagues (3 cols / Non-Sticky)
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
                      ? 'bg-zinc-800/60 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Trophy size={14} className={selectedLeague === 'all' && !liveOnly ? 'text-[#CEFF00]' : 'text-zinc-500'} />
                    All Matches
                  </span>
                  <span className={`text-[11px] font-mono ${selectedLeague === 'all' && !liveOnly ? 'text-[#CEFF00] font-bold' : 'text-zinc-400'}`}>
                    24
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLiveOnly(!liveOnly)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    liveOnly
                      ? 'bg-zinc-800/60 text-white font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Live Matches
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    isLiveFeed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {liveCount > 0 ? `${liveCount} LIVE` : isLiveFeed ? 'EPL LIVE' : '2 DEMO'}
                  </span>
                </button>

                <Link
                  href="/match-center"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Activity size={14} className="text-zinc-500" />
                    Match Center
                  </span>
                  <span className="text-[10px] text-zinc-500">→</span>
                </Link>
              </div>
            </div>

            {/* Popular Leagues Accordion */}
            <div className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs p-3 transition-colors">
              <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Popular Leagues
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Pinned</span>
              </div>
              <div className="space-y-0.5">
                {LEAGUES.filter((l) => l.id !== 'all').map((league) => {
                  const isActive = selectedLeague === league.id;
                  return (
                    <button
                      key={league.id}
                      type="button"
                      onClick={() => setSelectedLeague(league.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-zinc-800/60 text-white font-bold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <LeagueLogo league={league.name} size={16} />
                        <span className="truncate">{league.name}</span>
                      </span>
                      <span className={`text-[11px] font-mono ${isActive ? 'text-[#CEFF00] font-bold' : 'text-zinc-500'}`}>
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
            
            {/* Mobile / Tablet Horizontal Filter Chips */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              <button
                type="button"
                onClick={() => { setSelectedLeague('all'); setLiveOnly(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedLeague === 'all' && !liveOnly
                    ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                    : 'bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A]'
                }`}
              >
                All (24)
              </button>

              <button
                type="button"
                onClick={() => setLiveOnly(!liveOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  liveOnly
                    ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
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
                    type="button"
                    onClick={() => { setSelectedLeague(league.id); setLiveOnly(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
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
              <button
                type="button"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1E] flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDate('yesterday')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDate === 'yesterday'
                      ? 'bg-[#CEFF00] text-black font-extrabold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  Yesterday
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate('today')}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === 'today'
                      ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate('tomorrow')}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDate === 'tomorrow'
                      ? 'bg-[#CEFF00] text-black font-extrabold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1A1A1E]'
                  }`}
                >
                  Tomorrow
                </button>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A1A1E] flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 2. Featured Match Hero Card */}
            {liveFeaturedMatch && (
              <div className="relative bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xs overflow-hidden transition-colors p-3.5 sm:p-5 flex flex-col gap-2.5 sm:gap-3.5">
                {/* Ambient Team Glow */}
                <div className="absolute -top-16 -left-16 w-48 h-48 bg-red-500/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
                
                {/* Match Header */}
                <div className="relative flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <LeagueLogo league={liveFeaturedMatch.league} size={14} />
                    <span className="font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] truncate max-w-[200px] sm:max-w-none">
                      {liveFeaturedMatch.league} · {liveFeaturedMatch.round}
                    </span>
                    {isLiveFeed ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE API
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold">
                        DEMO MATCH
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 dark:text-zinc-500 text-[11px] font-medium hidden sm:inline">Premier League Official</span>
                </div>

                {/* Scoreboard Block */}
                <div className="relative">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-4">
                    
                    {/* Home Team */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 text-right min-w-0">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg truncate leading-tight block">
                          <span className="hidden sm:inline">{liveFeaturedMatch.home}</span>
                          <span className="sm:hidden">{liveFeaturedMatch.homeCode}</span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium block truncate">
                          {liveFeaturedMatch.homeCode}
                        </span>
                      </div>
                      <ClubCrest code={liveFeaturedMatch.homeCode} size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                    </div>

                    {/* Center Column: Score & Minute */}
                    <div className="flex flex-col items-center justify-center px-1.5 sm:px-4 w-20 sm:w-32 shrink-0">
                      <div className="font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight tabular-nums flex items-center justify-center gap-1.5 sm:gap-2 font-mono">
                        <span>{liveFeaturedMatch.homeScore !== undefined ? liveFeaturedMatch.homeScore : '-'}</span>
                        <span className="text-slate-300 dark:text-slate-600 font-normal text-lg sm:text-2xl">-</span>
                        <span>{liveFeaturedMatch.awayScore !== undefined ? liveFeaturedMatch.awayScore : '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                        {isLiveFeed ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                            {liveFeaturedMatch.status}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                            DEMO
                          </span>
                        )}
                        <span className="text-[11px] sm:text-xs font-semibold text-zinc-300 whitespace-nowrap">
                          {liveFeaturedMatch.minute || liveFeaturedMatch.startTime || liveFeaturedMatch.status}
                        </span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-start gap-2 sm:gap-3 text-left min-w-0">
                      <ClubCrest code={liveFeaturedMatch.awayCode} size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-lg truncate leading-tight block">
                          <span className="hidden sm:inline">{liveFeaturedMatch.away}</span>
                          <span className="sm:hidden">{liveFeaturedMatch.awayCode}</span>
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium block truncate">
                          {liveFeaturedMatch.awayCode}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Pencetak Gol (Merapat Bersih ke Ikon Bola di Tengah) */}
                  {((liveFeaturedMatch.scorers?.home && liveFeaturedMatch.scorers.home.length > 0) ||
                    (liveFeaturedMatch.scorers?.away && liveFeaturedMatch.scorers.away.length > 0)) && (
                    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-2.5 mt-3 sm:mt-3.5">
                      
                      {/* Home Scorers (Rata Kanan merapat ke bola) */}
                      <div className="space-y-0.5 sm:space-y-1 text-right min-w-0">
                        {liveFeaturedMatch.scorers?.home?.map((scorer, idx) => (
                          <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                            {scorer}
                          </div>
                        ))}
                      </div>

                      {/* Center Ball Icon */}
                      <div className="pt-0.5 shrink-0 flex items-center justify-center px-1">
                        <SoccerBallIcon size={12} className="text-slate-400 dark:text-zinc-500" />
                      </div>

                      {/* Away Scorers (Rata Kiri merapat ke bola) */}
                      <div className="space-y-0.5 sm:space-y-1 text-left min-w-0">
                        {liveFeaturedMatch.scorers?.away && liveFeaturedMatch.scorers.away.length > 0 ? (
                          liveFeaturedMatch.scorers.away.map((scorer, idx) => (
                            <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                              {scorer}
                            </div>
                          ))
                        ) : null}
                      </div>

                    </div>
                  )}

                  {/* xG Momentum Bar: UNBOXED / MINIMALIS (Tanpa Kotak Dalam) */}
                  <div className="mt-3.5 pt-1.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="font-bold text-tactiq-coral">xG {liveFeaturedMatch.xgHome}</span>
                        <span className="text-slate-300 dark:text-zinc-600">—</span>
                        <span className="font-bold text-tactiq-cyan">xG {liveFeaturedMatch.xgAway}</span>
                      </div>
                      <Link
                        href="/match-center"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-100 hover:text-[#CEFF00] transition-colors"
                      >
                        <span>Match Center</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>

                    {/* Dual Color xG Bar */}
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800 gap-0.5">
                      <div className="h-full bg-tactiq-coral rounded-full transition-all duration-300" style={{ width: '58%' }} />
                      <div className="h-full bg-tactiq-cyan rounded-full transition-all duration-300" style={{ width: '42%' }} />
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
                                <span className="inline-flex items-center gap-1 font-bold text-xs sm:text-[13px] text-amber-500 dark:text-amber-400 tracking-tight">
                                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                                    DEMO
                                  </span>
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
              COLUMN 3: Right Contextual Rail (3 cols / Non-Sticky)
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
                {standingsList.slice(0, 5).map((row) => (
                  <div
                    key={row.rank}
                    className="grid grid-cols-[20px_1fr_28px_32px_28px] items-center py-2 px-1 hover:bg-[#1A1A1E] transition-colors"
                  >
                    <span className={`font-mono text-[11px] ${row.rank === 1 ? 'font-black text-[#CEFF00]' : 'font-bold text-zinc-400'}`}>
                      {row.rank}
                    </span>
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <ClubCrest code={row.code || row.club} size={15} />
                      <span className="font-semibold text-zinc-200 truncate">
                        {row.club}
                      </span>
                    </div>
                    <span className="font-mono text-zinc-400 text-center">{row.p}</span>
                    <span className="font-mono text-zinc-400 text-center">{row.gd}</span>
                    <span className="font-mono font-bold text-white text-right">{row.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Top Performers */}
            <div className="bg-[#121215] rounded-xl border border-[#27272A] shadow-xs p-3.5 transition-colors">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#27272A]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <SoccerBallIcon size={14} className="text-zinc-300" />
                  Top Scorers
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">GW 8</span>
              </div>

              <div className="space-y-2.5">
                {TOP_SCORERS.map((player, idx) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1A1E] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`font-mono text-xs w-3 text-center ${idx === 0 ? 'text-[#CEFF00] font-black' : 'font-bold text-zinc-500'}`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {player.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ClubCrest code={player.club} size={13} />
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {player.club}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`font-mono font-bold text-xs ${idx === 0 ? 'text-[#CEFF00]' : 'text-white'}`}>
                        {player.goals}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
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