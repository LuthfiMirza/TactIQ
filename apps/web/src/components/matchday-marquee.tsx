'use client';

import React from 'react';
import Link from 'next/link';
import { Marquee } from '@/components/ui/marquee';
import { ClubCrest } from '@/components/ui/club-crest';

export interface TickerMatch {
  id: string;
  homeCode: string;
  awayCode: string;
  homeScore?: number;
  awayScore?: number;
  status: 'LIVE' | 'HT' | 'FT' | 'UPCOMING';
  minute?: string;
  startTime?: string;
  mode?: 'live' | 'demo';
}

interface MatchdayMarqueeProps {
  matches: TickerMatch[];
  className?: string;
  mode?: 'live' | 'demo';
}

export function MatchdayMarquee({ matches, className = '', mode = 'demo' }: MatchdayMarqueeProps) {
  const isDemo = mode === 'demo';

  return (
    <div
      className={`relative w-full bg-[#121215] border border-[#27272A] rounded-xl overflow-hidden flex items-center h-10 shadow-xs ${className}`}
      aria-label="Matchday Scores Ticker"
    >
      {/* ── Left Badge (Responsive) ── */}
      <div className="shrink-0 flex items-center gap-2 pl-3 sm:pl-3.5 pr-2.5 sm:pr-3.5 py-1 sm:border-r border-[#27272A] z-20 bg-[#121215]">
        {isDemo ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400 whitespace-nowrap bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
              DEMO FEED
            </span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tactiq-coral opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tactiq-coral" />
            </span>
            <span className="hidden sm:inline text-[11px] font-mono font-black uppercase tracking-wider text-white whitespace-nowrap">
              Live Scores
            </span>
          </>
        )}
      </div>

      {/* ── Soft Edge Vignette Fades ── */}
      <div className="pointer-events-none absolute left-8 sm:left-[118px] top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-[#121215] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-[#121215] to-transparent" />

      {/* ── Flowing Marquee Track ── */}
      <Marquee pauseOnHover={true} speed={38} className="py-0 my-0 overflow-hidden" innerClassName="py-0 items-center">
        {matches.map((m) => {
          const isLive = m.status === 'LIVE' || m.status === 'HT';

          return (
            <Link
              key={m.id}
              href="/match-center"
              prefetch={true}
              className="flex items-center gap-2 px-3 py-1 mx-1.5 rounded-lg bg-[#18181D] hover:bg-[#202026] border border-[#27272A]/80 hover:border-zinc-700 transition-colors shrink-0 text-xs select-none active:scale-95"
            >
              {/* Match State */}
              <span className="shrink-0 font-mono text-[10px] font-bold">
                {isLive ? (
                  <span className="text-amber-400 font-black flex items-center gap-1">
                    <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      DEMO
                    </span>
                    {m.minute}
                  </span>
                ) : m.status === 'FT' ? (
                  <span className="text-zinc-500 font-bold">FT</span>
                ) : (
                  <span className="text-zinc-400 font-medium">{m.startTime || '19:45'}</span>
                )}
              </span>

              <span className="h-3 w-[1px] bg-zinc-800 shrink-0" />

              {/* Home Team */}
              <div className="flex items-center gap-1.5 min-w-0">
                <ClubCrest code={m.homeCode} size={15} />
                <span className="font-bold text-zinc-200 text-xs">{m.homeCode}</span>
              </div>

              {/* Score / VS Divider */}
              <div className="font-mono text-xs px-1 text-center shrink-0">
                {m.homeScore !== undefined && m.awayScore !== undefined ? (
                  <span className="font-black text-white tracking-tight">
                    {m.homeScore} - {m.awayScore}
                  </span>
                ) : (
                  <span className="text-zinc-500 font-semibold text-[11px]">vs</span>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-zinc-200 text-xs">{m.awayCode}</span>
                <ClubCrest code={m.awayCode} size={15} />
              </div>
            </Link>
          );
        })}
      </Marquee>
    </div>
  );
}
