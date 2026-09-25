'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronRight } from 'lucide-react';

const BREADCRUMB_MAP: Record<string, string[]> = {
  '/': ['TactIQ'],
  '/scouting': ['Players', 'Premier League', 'Scouting & Similarity'],
  '/match-center': ['Match Center', 'Premier League', 'Gameweek 8'],
  '/tactical-tracker': ['Analysis', 'Tactical Tracker', 'Live Session'],
};

export const Topbar: React.FC = () => {
  const pathname = usePathname();
  const crumbs = BREADCRUMB_MAP[pathname] ?? ['TactIQ'];

  return (
    <header className="fixed top-0 right-0 z-30 h-14 flex items-center justify-between gap-4 px-5 border-b border-tactiq-border bg-tactiq-card"
      style={{ left: 'var(--sidebar-width, 224px)' }}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-tactiq-muted min-w-0">
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight size={13} className="text-tactiq-dim shrink-0" />}
            <span
              className={`truncate ${
                idx === crumbs.length - 1 ? 'text-slate-200 font-medium' : 'text-tactiq-dim'
              }`}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right side controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-2.5 text-tactiq-dim pointer-events-none" />
          <input
            type="text"
            placeholder="Search players, teams... ⌘K"
            readOnly
            className="h-8 pl-8 pr-3 w-56 bg-tactiq-surface border border-tactiq-border rounded-lg text-xs text-slate-300 placeholder:text-tactiq-dim focus:outline-none focus:border-tactiq-emerald transition-colors cursor-pointer"
          />
        </div>

        {/* Notification bell */}
        <button className="relative w-8 h-8 rounded-lg bg-tactiq-surface border border-tactiq-border flex items-center justify-center text-tactiq-muted hover:text-slate-200 hover:border-tactiq-borderHover transition-colors">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tactiq-emerald border border-tactiq-card" />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-tactiq-surface border border-transparent hover:border-tactiq-border transition-all">
          <div className="w-6 h-6 rounded-full bg-tactiq-emeraldMid border border-tactiq-emeraldSubtle flex items-center justify-center text-[11px] font-bold text-tactiq-emerald">
            F
          </div>
          <span className="text-xs font-medium text-slate-200 hidden sm:block">Ferrel</span>
          <ChevronRight size={12} className="text-tactiq-dim rotate-90" />
        </button>
      </div>
    </header>
  );
};
