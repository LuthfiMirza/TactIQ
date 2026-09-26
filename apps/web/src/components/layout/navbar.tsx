'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Trophy,
  Users,
  Crosshair,
  Search,
  Activity,
  Sun,
  Moon,
  X,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold font-mono text-base shadow-xs transition-colors">
                    TQ
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                    Tact<span className="text-slate-400 dark:text-zinc-500">IQ</span>
                  </span>
                </Link>

                {/* Desktop Primary Navigation Tabs */}
                <nav className="hidden md:flex items-center gap-1 ml-2">
                  {navItems.map((item) => {
                    const active = isCurrent(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          active
                            ? 'bg-slate-100 dark:bg-[#202026] text-slate-900 dark:text-white font-bold shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                        }`}
                      >
                        <Icon size={14} className={active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Right Elements: Search & Theme Toggle */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Desktop Search Bar */}
                <div className="relative hidden md:block w-48 lg:w-64">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                  />
                  <input
                    type="text"
                    placeholder="Search team, player, xG..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#F0F2F5] dark:bg-[#18181C] border border-transparent focus:border-slate-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-[#1F1F24] text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-8 pr-3 py-1.5 rounded-lg outline-none transition-all"
                  />
                </div>

                {/* Mobile Search Button (Opsi B) */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Open search"
                  className="md:hidden w-9 h-9 rounded-lg border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181C] hover:bg-slate-100 dark:hover:bg-[#222228] flex items-center justify-center text-slate-700 dark:text-zinc-300 transition-colors shadow-xs"
                >
                  <Search size={16} />
                </button>

                {/* Dark / Light Mode Switcher — Zero Layout Shift & Smooth Morphing */}
                <button
                  onClick={toggleTheme}
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181C] hover:bg-slate-100 dark:hover:bg-[#222228] active:scale-90 flex items-center justify-center text-slate-700 dark:text-zinc-300 transition-all shadow-xs overflow-hidden group shrink-0"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {/* Sun Icon */}
                  <Sun
                    size={17}
                    className={`absolute transition-all duration-300 ease-out ${
                      mounted
                        ? isDarkMode
                          ? 'rotate-0 scale-100 opacity-100 text-amber-400 group-hover:rotate-45 group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'rotate-90 scale-0 opacity-0 pointer-events-none'
                        : 'hidden dark:block dark:rotate-0 dark:scale-100 text-amber-400'
                    }`}
                  />

                  {/* Moon Icon */}
                  <Moon
                    size={17}
                    className={`absolute transition-all duration-300 ease-out ${
                      mounted
                        ? isDarkMode
                          ? '-rotate-90 scale-0 opacity-0 pointer-events-none'
                          : 'rotate-0 scale-100 opacity-100 text-slate-700 group-hover:-rotate-12 group-hover:text-slate-900 drop-shadow-[0_0_8px_rgba(15,23,42,0.15)]'
                        : 'block dark:hidden rotate-0 scale-100 text-slate-700'
                    }`}
                  />
                </button>
              </div>
            </>
          )}

        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar (< 768px) ─────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#27272A] shadow-lg transition-colors duration-150 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
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
                className={`relative flex flex-col items-center justify-center py-1 min-h-[48px] rounded-lg transition-transform active:scale-95 ${
                  active
                    ? 'text-slate-950 dark:text-white'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {active && (
                  <span className="absolute top-0.5 w-6 h-0.5 rounded-full bg-slate-900 dark:bg-zinc-100" />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.4 : 1.8}
                  className="transition-colors"
                />
                <span
                  className={`text-[10px] mt-1 tracking-tight truncate max-w-full px-1 ${
                    active
                      ? 'font-bold text-slate-950 dark:text-white'
                      : 'font-medium text-slate-500 dark:text-zinc-400'
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
