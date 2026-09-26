'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

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
    { name: 'Matches', href: '/', icon: Trophy },
    { name: 'Match Center', href: '/match-center', icon: Activity },
    { name: 'Scouting', href: '/scouting', icon: Users },
    { name: 'Tactical Tracker', href: '/tactical-tracker', icon: Crosshair },
  ];

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#121215] border-b border-slate-200 dark:border-[#27272A] shadow-xs transition-colors duration-150">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand & Left Elements */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#00A83F] dark:bg-[#10B981] flex items-center justify-center text-white font-bold font-mono text-base shadow-sm group-hover:bg-[#008734] dark:group-hover:bg-[#059669] transition-colors">
              TQ
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              Tact<span className="text-[#00A83F] dark:text-[#10B981]">IQ</span>
            </span>
          </Link>

          {/* Quick Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navItems.map((item) => {
              const active = isCurrent(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

        {/* Search & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* TactIQ Search Bar */}
          <div className="relative w-44 sm:w-64">
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

          {/* Dark / Light Mode Switcher */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181C] hover:bg-slate-100 dark:hover:bg-[#222228] text-slate-700 dark:text-zinc-300 text-xs font-mono font-medium transition-all shadow-xs"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-slate-600" />
                  <span className="hidden sm:inline text-[11px]">Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Sub Navigation for Mobile ──────────────────────── */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-100 dark:border-[#27272A] no-scrollbar bg-slate-50 dark:bg-[#0E0E12]">
        {navItems.map((item) => {
          const active = isCurrent(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-semibold ${
                active
                  ? 'bg-white dark:bg-[#18181C] shadow-xs text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-[#27272A]'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
