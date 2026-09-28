'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  Users,
  Crosshair,
  Search,
  Activity,
  X,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const navItems = [
    { name: 'Matches', shortName: 'Matches', href: '/', icon: Trophy },
    { name: 'Match Center', shortName: 'Match Center', href: '/match-center', icon: Activity },
    { name: 'Scouting', shortName: 'Scouting', href: '/scouting', icon: Users },
    { name: 'Tactical Tracker', shortName: 'Tracker', href: '/tactical-tracker', icon: Crosshair },
  ];

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#27272A] shadow-xs transition-colors duration-150">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          
          {/* Mobile Search Overlay / Full Input */}
          {isSearchOpen ? (
            <div className="flex items-center w-full gap-2 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search team, player, xG..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F0F2F5] dark:bg-[#18181C] border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-9 pr-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-zinc-100"
                />
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#18181C] text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#222228] transition-colors"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Brand & Left Elements */}
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center group py-0.5" aria-label="TactIQ Home">
                  <Image
                    src="/TactIQ.png"
                    alt="TactIQ"
                    width={130}
                    height={64}
                    className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                    priority
                  />
                </Link>

                {/* Desktop Primary Navigation Tabs: Segmented Dock Container */}
                <nav className="hidden md:flex items-center gap-0.5 ml-2 p-1 bg-[#141418] border border-[#27272A] rounded-xl shadow-xs">
                  {navItems.map((item) => {
                    const active = isCurrent(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none focus:outline-none focus-visible:outline-none select-none transition-colors ${
                          active
                            ? 'text-black font-extrabold'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="navbarActiveDock"
                            className="absolute inset-0 bg-[#CEFF00] rounded-lg shadow-sm shadow-[#CEFF00]/20 -z-0"
                            transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                          />
                        )}
                        <Icon size={14} className={`relative z-10 transition-colors ${active ? 'text-black' : 'text-zinc-400'}`} />
                        <span className="relative z-10">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Right Elements: Search Bar */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Desktop Search Bar */}
                <div className="relative hidden md:block w-48 lg:w-64">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="text"
                    placeholder="Search team, player, xG..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#18181C] border border-zinc-800 focus:border-[#CEFF00]/50 focus:ring-1 focus:ring-[#CEFF00]/30 focus:bg-[#1F1F24] text-xs text-zinc-100 placeholder-zinc-500 pl-8 pr-12 py-1.5 rounded-lg outline-none transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-[10px] font-mono text-zinc-400 pointer-events-none select-none">
                    <span>⌘</span>
                    <span>K</span>
                  </div>
                </div>

                {/* Mobile Search Button */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Open search"
                  className="md:hidden w-9 h-9 rounded-lg border border-[#27272A] bg-[#18181C] hover:bg-[#222228] flex items-center justify-center text-zinc-300 transition-colors shadow-xs"
                >
                  <Search size={16} />
                </button>
              </div>
            </>
          )}

        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar (< 768px) ─────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#121215]/95 backdrop-blur-md border-t border-[#27272A] shadow-lg transition-colors duration-150 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="grid grid-cols-4 items-center h-14 px-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const active = isCurrent(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative flex flex-col items-center justify-center py-1 min-h-[48px] rounded-lg outline-none focus:outline-none focus-visible:outline-none select-none transition-transform active:scale-95 ${
                  active
                    ? 'text-[#CEFF00]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {active && (
                  <span className="absolute top-0.5 w-6 h-0.5 rounded-full bg-[#CEFF00] shadow-[0_0_8px_rgba(206,255,0,0.8)]" />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.4 : 1.8}
                  className="transition-colors"
                />
                <span
                  className={`text-[10px] mt-1 tracking-tight truncate max-w-full px-1 ${
                    active
                      ? 'font-bold text-[#CEFF00]'
                      : 'font-medium text-zinc-400'
                  }`}
                >
                  {item.shortName}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
