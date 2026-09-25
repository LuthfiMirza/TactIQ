'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users, Trophy, Crosshair, Cpu } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: Trophy },
    { label: 'Scouting & Radar', href: '/scouting', icon: Users },
    { label: 'Match Center', href: '/match-center', icon: Shield },
    { label: 'Tactical Tracker', href: '/tactical-tracker', icon: Crosshair },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-tactiq-border/80 bg-tactiq-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-tactiq-emerald to-tactiq-cyan flex items-center justify-center shadow-glow-emerald transition-transform group-hover:scale-105">
            <span className="font-extrabold text-tactiq-bg text-lg tracking-tighter">TQ</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
              Tact<span className="text-tactiq-emerald">IQ</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-tactiq-emerald/10 text-tactiq-emerald border border-tactiq-emerald/30">
                PRO
              </span>
            </span>
            <span className="text-[10px] text-tactiq-muted tracking-wider uppercase">
              Football Intelligence
            </span>
          </div>
        </Link>

        {/* Primary Navigation Links */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-tactiq-surface text-tactiq-emerald border border-tactiq-emerald/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-tactiq-surface/50'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Microservices Status Pill */}
        <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-tactiq-border">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-tactiq-card border border-tactiq-border">
            <span className="w-2 h-2 rounded-full bg-tactiq-emerald animate-pulse" />
            <span className="text-[11px] font-mono text-slate-300">FastAPI & Express Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};
