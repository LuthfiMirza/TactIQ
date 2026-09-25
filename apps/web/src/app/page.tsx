'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

// ─── Realtime Match Telemetry (FotMob Match Card + Multi-Metric Data) ───────

const LIVE_STATS = [
  {
    label: 'Expected Goals (xG)',
    value: '2.31',
    sub: 'Emirates Domination',
  },
  {
    label: 'Possession Share',
    value: '54.2%',
    sub: '448 Completed Passes',
  },
  {
    label: 'Pressing Intensity (PPDA)',
    value: '8.2',
    sub: 'High Block Sequence',
  },
  {
    label: 'Big Chances Created',
    value: '3 — 1',
    sub: 'Arsenal Conversion 66%',
  },
  {
    label: 'Box Touches',
    value: '28 vs 14',
    sub: 'Territory Edge',
  },
];

function StatGrid() {
  return (
    <div className="relative rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border border-[#222B3D] bg-[#141A24] shadow-2xl shadow-black/80 overflow-hidden">
      
      {/* 1. FotMob Matchday Pass Header */}
      <div className="px-5 py-3 border-b border-[#222B3D] bg-[#10151E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00DF59] animate-pulse" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
            MATCH PASS · GW 8
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8E9EB5]">Emirates Stadium</span>
          <span className="px-2 py-0.5 rounded bg-[#092B16] border border-[#145A30] text-[#00DF59] text-[11px] font-mono font-bold">
            68&apos; LIVE
          </span>
        </div>
      </div>

      {/* 2. Main FotMob Scoreboard with Atmospheric Club Lighting */}
      <div className="relative p-6 overflow-hidden">
        {/* Subtle Club Atmospheric Glows */}
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#EF0107]/20 via-[#EF0107]/5 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#6CABDD]/20 via-[#6CABDD]/5 to-transparent pointer-events-none" />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          
          {/* Home: Arsenal */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#EF0107] to-[#BA0C2F] border border-white/20 flex items-center justify-center font-display font-black text-xs text-white shrink-0 shadow-[0_0_20px_rgba(239,1,7,0.45)]">
              ARS
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-white block truncate">Arsenal</span>
              <span className="text-[10px] text-[#FF5A5F] font-semibold block truncate mt-0.5 font-mono">
                Saka 34&apos;, Mart. 58&apos;
              </span>
            </div>
          </div>

          {/* Center Score + Rating Pill (Zero Wrapping) */}
          <div className="flex flex-col items-center justify-center px-3 shrink-0">
            <div className="font-display font-black text-3xl text-white tracking-tight tabular-nums flex items-center gap-2 whitespace-nowrap">
              <span>2</span>
              <span className="text-[#596982] text-xl font-light">-</span>
              <span>1</span>
            </div>
            <span className="fm-rating-high text-[10px] mt-1.5 whitespace-nowrap shadow-sm">
              8.4 FotMob
            </span>
          </div>

          {/* Away: Manchester City */}
          <div className="flex items-center justify-end gap-3 min-w-0 text-right">
            <div className="min-w-0">
              <span className="text-sm font-bold text-white block truncate">Man City</span>
              <span className="text-[10px] text-[#6CABDD] font-semibold block truncate mt-0.5 font-mono">
                Haaland 42&apos; (P)
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6CABDD] to-[#458BB8] border border-white/20 flex items-center justify-center font-display font-black text-xs text-white shrink-0 shadow-[0_0_20px_rgba(108,171,221,0.45)]">
              MCI
            </div>
          </div>

        </div>
      </div>

      {/* 3. Ticket Perforated Divider with Cutout Notches */}
      <div className="relative flex items-center my-0">
        {/* Left Concave Cutout */}
        <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-[#0B0E14] border border-[#222B3D] z-10 shadow-inner" />
        {/* Dashed Perforation Line */}
        <div className="w-full border-t border-dashed border-[#222B3D] mx-4" />
        {/* Right Concave Cutout */}
        <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-[#0B0E14] border border-[#222B3D] z-10 shadow-inner" />
      </div>

      {/* 4. Ticket Stub Telemetry Section */}
      <div className="p-5 bg-[#10151E]/60 flex flex-col gap-2.5 font-mono text-xs">
        <div className="flex items-center justify-between text-[10px] text-[#596982] tracking-wider uppercase pb-1 border-b border-[#222B3D]/30">
          <span>Telemetry Stream</span>
          <span className="font-mono">#TQ-8849-LIVE</span>
        </div>
        {LIVE_STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between py-1.5 border-b border-[#222B3D]/40 last:border-b-0 hover:bg-[#1D2534]/50 px-2 rounded transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#8E9EB5]">{stat.label}</span>
              <span className="text-[10px] text-[#596982] mt-0.5">{stat.sub}</span>
            </div>
            <span className="text-sm font-bold text-white tabular-nums">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scout Spotlight (FotMob Player Dossier + StatsBomb Metrics) ─────────────

function ScoutSpotlightCard() {
  return (
    <section className="py-10 bg-[#10151E] border-y border-[#222B3D]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border border-[#222B3D] bg-[#141A24] p-6 lg:p-7 shadow-xl hover:border-[#35425C] transition-colors overflow-hidden">
          {/* Subtle Arsenal Club Glow on Dossier */}
          <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-[#EF0107]/10 via-[#EF0107]/2 to-transparent pointer-events-none" />

          <Link href="/scouting" className="relative group block">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

              {/* Tag & Player Identity */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EF0107] to-[#BA0C2F] border-2 border-white/20 flex items-center justify-center font-display font-black text-base text-white shadow-[0_0_18px_rgba(239,1,7,0.35)] group-hover:scale-105 transition-transform">
                    MØ
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-[#141A24] border border-[#222B3D] text-[10px] font-bold leading-none">
                    🇳🇴
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-display font-black text-xl text-white leading-none">
                      Martin Ødegaard
                    </span>
                    <span className="fm-rating-high text-xs">
                      8.4 FotMob Rating
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#1D2534] text-[#8E9EB5] text-xs font-mono font-bold">
                      AM / CM
                    </span>
                  </div>
                  <p className="text-xs text-[#8E9EB5] mt-1.5 truncate">
                    Arsenal FC · Age 25 · 2,520 mins · Premier League 2024–25
                  </p>
                </div>
              </div>

              {/* Multi-Metric Tactical Columns */}
              <div className="grid grid-cols-3 gap-6 shrink-0 border-t lg:border-t-0 lg:border-l border-[#222B3D] pt-4 lg:pt-0 lg:pl-8 font-mono">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#596982] block">AI Match</span>
                  <span className="text-xl font-black text-[#00DF59] block mt-0.5">94.2%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#F59E0B] block">Key Passes</span>
                  <span className="text-xl font-black text-[#F59E0B] block mt-0.5">2.84</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#38BDF8] block">Exp. Assist</span>
                  <span className="text-xl font-black text-[#38BDF8] block mt-0.5">0.34</span>
                </div>
              </div>

              {/* Inspect Button */}
              <div className="shrink-0 flex items-center justify-end">
                <span className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D2534] border border-[#222B3D] text-white text-xs font-bold uppercase tracking-wider group-hover:bg-[#00DF59] group-hover:text-black transition-colors">
                  <span>Player Profile</span>
                  <ArrowUpRight size={14} />
                </span>
              </div>

            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Matchday Scoreboard (FotMob Match Fixtures) ─────────────────────────────

const FOTMOB_FIXTURES = [
  {
    league: 'Premier League', round: 'Matchday 8',
    home: 'Arsenal FC', homeCode: 'ARS', homeColor: '#EF0107',
    away: 'Manchester City', awayCode: 'MCI', awayColor: '#6CABDD',
    homeScore: 2, awayScore: 1,
    minute: "68'", status: 'live' as const,
    xgHome: '2.31', xgAway: '1.14',
    ratingHome: '7.8', ratingAway: '6.9',
  },
  {
    league: 'La Liga', round: 'El Clásico',
    home: 'FC Barcelona', homeCode: 'BAR', homeColor: '#A50044',
    away: 'Real Madrid', awayCode: 'RMA', awayColor: '#FEBE10',
    homeScore: 0, awayScore: 0,
    minute: 'HT', status: 'ht' as const,
    xgHome: '0.42', xgAway: '0.61',
    ratingHome: '7.0', ratingAway: '7.1',
  },
  {
    league: 'Premier League', round: 'Gameweek 8',
    home: 'Liverpool FC', homeCode: 'LIV', homeColor: '#C8102E',
    away: 'Chelsea FC', awayCode: 'CHE', awayColor: '#034694',
    homeScore: 3, awayScore: 1,
    minute: 'FT', status: 'ft' as const,
    xgHome: '2.88', awayXg: '0.94',
    ratingHome: '8.1', ratingAway: '6.4',
  },
];

function LiveMatchStrip() {
  return (
    <section className="py-14 bg-[#0B0E14] border-b border-[#222B3D]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00DF59]" />
            <h3 className="font-display font-black text-base uppercase tracking-wider text-white">
              FotMob Matchday Scoreboard
            </h3>
          </div>
          <Link href="/match-center" className="text-xs font-bold text-[#00DF59] hover:underline flex items-center gap-1 uppercase tracking-wider">
            <span>View All Matches</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Match Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FOTMOB_FIXTURES.map((m) => (
            <Link key={m.homeCode + m.awayCode} href="/match-center" className="group block">
              <div className="relative rounded-tl-2xl rounded-br-2xl rounded-tr-md rounded-bl-md border border-[#222B3D] bg-[#141A24] hover:border-[#35425C] p-5 shadow-xl transition-all overflow-hidden">
                
                {/* Subtle Dual Club Lighting in Background */}
                <div
                  className="absolute inset-y-0 left-0 w-2/5 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at left, ${m.homeColor}, transparent 75%)`,
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-2/5 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at right, ${m.awayColor}, transparent 75%)`,
                  }}
                />

                {/* League Header */}
                <div className="relative flex items-center justify-between pb-3.5 border-b border-[#222B3D]">
                  <span className="text-xs font-semibold text-[#8E9EB5]">
                    {m.league} · {m.round}
                  </span>
                  
                  {m.status === 'live' ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#092B16] border border-[#145A30] text-[11px] font-mono font-bold text-[#00DF59]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00DF59] animate-pulse" />
                      <span>{m.minute} LIVE</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#1D2534] text-[11px] font-mono font-bold text-[#8E9EB5]">
                      {m.minute}
                    </span>
                  )}
                </div>

                {/* Score & Clubs */}
                <div className="relative py-6 flex items-center justify-between">
                  {/* Home */}
                  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-xs text-white shadow-lg transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: m.homeColor,
                        boxShadow: `0 0 18px ${m.homeColor}55`,
                      }}
                    >
                      {m.homeCode}
                    </div>
                    <span className="text-xs font-bold text-white truncate text-center w-full">
                      {m.home}
                    </span>
                  </div>

                  {/* Big Athletic Score */}
                  <div className="flex flex-col items-center justify-center px-4 shrink-0">
                    <div className="flex items-center gap-2.5 font-display font-black text-4xl text-white tracking-tight tabular-nums">
                      <span>{m.homeScore}</span>
                      <span className="text-[#596982] text-2xl font-light">-</span>
                      <span>{m.awayScore}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#596982] mt-1 font-mono">VS</span>
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-xs text-white shadow-lg transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: m.awayColor,
                        boxShadow: `0 0 18px ${m.awayColor}55`,
                      }}
                    >
                      {m.awayCode}
                    </div>
                    <span className="text-xs font-bold text-white truncate text-center w-full">
                      {m.away}
                    </span>
                  </div>
                </div>

                {/* FotMob xG Footer (Multi-Metric Amber Accent) */}
                <div className="pt-3 border-t border-[#222B3D] flex items-center justify-between text-xs font-mono text-[#8E9EB5]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#F59E0B] font-bold">xG</span>
                    <span className="font-bold text-white">{m.xgHome}</span>
                  </div>
                  <span className="text-[10px] text-[#596982]">Expected Goals</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{m.awayXg}</span>
                    <span className="text-[10px] text-[#F59E0B] font-bold">xG</span>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Product Preview Mockup (With FotMob Rating Chips) ───────────────────────

function ProductPreview() {
  const PLAYERS = [
    { name: 'Martin Ødegaard', flag: '🇳🇴', pos: 'MID', club: 'Arsenal FC', match: '94.2', xg: '0.34', kp: '2.84', rating: '8.4', ratingClass: 'fm-rating-high' },
    { name: 'Dominik Szoboszlai', flag: '🇭🇺', pos: 'MID', club: 'Liverpool FC', match: '91.8', xg: '0.29', kp: '2.68', rating: '8.1', ratingClass: 'fm-rating-high' },
    { name: 'Gianluca Busio', flag: '🇺🇸', pos: 'MID', club: 'Venezia FC', match: '89.4', xg: '0.21', kp: '2.12', rating: '7.9', ratingClass: 'fm-rating-good' },
    { name: 'Arda Güler', flag: '🇹🇷', pos: 'MID', club: 'Real Madrid', match: '87.1', xg: '0.28', kp: '2.75', rating: '8.2', ratingClass: 'fm-rating-high' },
  ];

  return (
    <div className="w-full rounded-2xl border border-[#222B3D] overflow-hidden bg-[#141A24] shadow-2xl">
      <div className="flex items-center justify-between px-5 h-11 border-b border-[#222B3D] bg-[#19212E]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#00DF59]" />
          <span className="ml-3 text-[11px] text-[#8E9EB5] font-mono">tactiq.io / player-scouting</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00DF59] animate-pulse" />
          <span className="text-[10px] font-mono text-[#00DF59] font-bold uppercase">FotMob Ratings Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1.5fr_1fr] px-5 py-3 border-b border-[#222B3D] text-[#596982] text-[10px] uppercase tracking-wider font-bold">
        <span>Player Profile</span>
        <span>Similarity</span>
        <span>xG / 90</span>
        <span>Key Passes</span>
        <span>Club</span>
        <span>Rating</span>
      </div>

      {PLAYERS.map((p, i) => (
        <div
          key={p.name}
          className={`grid grid-cols-[2.5fr_1fr_1fr_1fr_1.5fr_1fr] items-center px-5 py-3.5 border-b border-[#222B3D]/60 last:border-b-0 transition-colors ${
            i === 0 ? 'bg-[#1D2534]' : 'hover:bg-[#1D2534]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-base">{p.flag}</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">{p.name}</span>
              <span className="text-[10px] text-[#596982]">{p.pos}</span>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-[#00DF59]">{p.match}%</span>
          <span className="text-xs font-mono text-[#F59E0B] font-semibold">{p.xg}</span>
          <span className="text-xs font-mono text-[#38BDF8] font-semibold">{p.kp}</span>
          <span className="text-xs text-[#8E9EB5]">{p.club}</span>
          <div>
            <span className={p.ratingClass}>{p.rating}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white bg-[#0B0E14]">
      {/* ── HERO SECTION: Generous Breathing Room Under Floating Navbar ── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center pt-36 pb-20 border-b border-[#222B3D]">
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left 7 cols: Bold Athletic Typography */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="font-display leading-[0.9] tracking-tight">
                <h1 className="text-[clamp(54px,7.5vw,104px)] font-black text-white uppercase">
                  Football
                </h1>
                <h1 className="text-[clamp(54px,7.5vw,104px)] font-black italic text-[#00DF59] uppercase">
                  Intelligence,
                </h1>
                <h1 className="text-[clamp(54px,7.5vw,104px)] font-black text-white uppercase">
                  Redefined.
                </h1>
              </div>

              <p className="text-base text-[#8E9EB5] leading-relaxed max-w-lg">
                High-density optical tracking, AI player similarity benchmarking, and live match analytics built for football purists, scouts, and performance directors.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-4 pt-2">
                <Link
                  href="/scouting"
                  className="flex items-center gap-2.5 px-7 py-3.5 bg-[#00DF59] hover:bg-[#00C84F] text-black text-sm font-black uppercase tracking-wider rounded-lg shadow-lg shadow-[#00DF59]/25 transition-all duration-150 active:scale-95"
                >
                  <span>Explore Platform</span>
                  <ArrowRight size={14} />
                </Link>
                
                <Link
                  href="/match-center"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#222B3D] hover:border-[#35425C] text-sm font-semibold text-white hover:bg-[#141A24] transition-colors"
                >
                  <span>Watch Demo</span>
                  <ArrowUpRight size={14} className="text-[#8E9EB5]" />
                </Link>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#222B3D] max-w-md font-mono">
                <div>
                  <div className="text-3xl font-black text-white">1,842</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#596982] mt-0.5">Profiles Screened</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">31</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#596982] mt-0.5">Live Fixtures</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">4.2K</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#596982] mt-0.5">Tactical Events</div>
                </div>
              </div>

            </div>

            {/* Right 5 cols: FotMob Realtime Match Telemetry */}
            <div className="lg:col-span-5">
              <StatGrid />
            </div>

          </div>
        </div>
      </section>

      {/* ── C: SCOUT SPOTLIGHT ────────────────────────────────────────────── */}
      <ScoutSpotlightCard />

      {/* ── A: LIVE MATCH STRIP ───────────────────────────────────────────── */}
      <LiveMatchStrip />

      {/* ── SECTION: WHAT WE TRACK ────────────────────────────────────────── */}
      <section className="py-24 border-b border-[#222B3D] bg-[#10151E]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2.5 mb-14">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00DF59]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E9EB5]">Core Analytics Capabilities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                title: 'Player Scouting & Profiler',
                desc: 'Cosine-similarity engine comparing 40+ performance attributes across Europe top 5 leagues to find high-compatibility targets.',
                href: '/scouting',
                tags: ['Radar Profiling', 'Anchor Benchmarks', 'Market Value ROI'],
              },
              {
                number: '02',
                title: 'Live Match Intelligence',
                desc: 'Realtime expected goals (xG), pressing intensity (PPDA), head-to-head records, and Monte Carlo probability forecasts.',
                href: '/match-center',
                tags: ['xG Trajectory', 'H2H Breakdown', 'Monte Carlo Sim'],
              },
              {
                number: '03',
                title: '2D & Video Tactical Tracker',
                desc: 'Computer-vision optical frame coordinates plotted to interactive tactical pitch radar with automated event scrubbing.',
                href: '/tactical-tracker',
                tags: ['Optical Tracking', '2D Radar Minimap', 'Scrubber Replay'],
              },
            ].map((item) => (
              <div
                key={item.number}
                className="bg-[#141A24] border border-[#222B3D] hover:border-[#35425C] rounded-2xl p-6 flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[#00DF59]">{item.number}</span>
                    <Link href={item.href} className="w-8 h-8 rounded-lg bg-[#1D2534] flex items-center justify-center text-[#8E9EB5] group-hover:text-white group-hover:bg-[#00DF59] group-hover:text-black transition-colors">
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                  <h3 className="font-display font-black text-xl text-white mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#8E9EB5] leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#222B3D]">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded bg-[#1D2534] text-[10px] font-mono text-[#8E9EB5]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION: PLATFORM PREVIEW ─────────────────────────────────────── */}
      <section className="py-24 border-b border-[#222B3D] bg-[#0B0E14]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#00DF59]" />
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#8E9EB5]">Data Matrix Preview</span>
              </div>
              <h2 className="font-display text-3xl lg:text-4xl font-black text-white uppercase tracking-tight">
                Benchmark Radar & Scouting Sheet
              </h2>
            </div>
            <Link href="/scouting" className="hidden md:flex items-center gap-2 text-xs font-bold text-[#00DF59] hover:underline uppercase tracking-wider">
              Launch Profiler <ArrowRight size={13} />
            </Link>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* ── FOOTER CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#080B10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="border border-[#222B3D] rounded-2xl p-8 lg:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-[#141A24] shadow-2xl">
            <div>
              <h2 className="font-display text-3xl lg:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                Ready to elevate your<br />
                <span className="text-[#00DF59] italic">tactical workflow?</span>
              </h2>
              <p className="text-sm text-[#8E9EB5] mt-3 max-w-md">
                No sign-up required. Jump straight into live match analytics, player comparison radars, and optical tracking.
              </p>
            </div>
            
            <Link
              href="/scouting"
              className="flex items-center gap-2.5 px-8 py-4 bg-[#00DF59] hover:bg-[#00C84F] text-black text-sm font-black tracking-wide uppercase rounded-lg shadow-xl shadow-[#00DF59]/20 transition-all duration-150 active:scale-95 shrink-0"
            >
              <span>Get Started Now</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#222B3D] py-8 bg-[#0B0E14]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-sm text-white">Tact<span className="text-[#00DF59]">IQ</span></span>
            <span className="text-[#596982]">© 2026 TactIQ Platform · Luthfi (API) · Fuad (ML) · Ferrel (Front-End)</span>
          </div>
          <div className="flex items-center gap-6 text-[#596982]">
            <Link href="/scouting" className="hover:text-white transition-colors">Scouting</Link>
            <Link href="/match-center" className="hover:text-white transition-colors">Match Center</Link>
            <Link href="/tactical-tracker" className="hover:text-white transition-colors">Tactical Tracker</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
