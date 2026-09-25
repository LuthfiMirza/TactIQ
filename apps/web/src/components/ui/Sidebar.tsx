'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Video,
  GitCompare,
  TrendingUp,
  Settings,
  HelpCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: 'live' | 'count';
}


const MENU_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    label: 'Match Center',
    href: '/match-center',
    icon: Shield,
    badge: '2:1',
    badgeType: 'live',
  },
  { label: 'Scouting', href: '/scouting', icon: Users },
];

const ANALYSIS_ITEMS: NavItem[] = [
  { label: 'Tactical Tracker', href: '/tactical-tracker', icon: Video },
  { label: 'Compare', href: '/scouting', icon: GitCompare },
  { label: 'Predictor', href: '/match-center', icon: TrendingUp },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href));

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        className={`sidebar-link group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'sidebar-link-active'
            : 'text-tactiq-muted hover:text-slate-200'
        }`}
      >
        <Icon
          size={16}
          className={isActive ? 'text-tactiq-emerald' : 'text-tactiq-dim group-hover:text-slate-300'}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && item.badgeType === 'live' && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-tactiq-emeraldBg border border-tactiq-emeraldSubtle">
                <span className="w-1.5 h-1.5 rounded-full bg-tactiq-emerald animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-tactiq-emerald">{item.badge}</span>
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col border-r border-tactiq-border bg-tactiq-card transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-tactiq-border shrink-0">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-tactiq-emeraldMid border border-tactiq-emeraldSubtle flex items-center justify-center shrink-0">
              <Zap size={14} className="text-tactiq-emerald" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-sm tracking-tight text-white">
                Tact<span className="text-tactiq-emerald">IQ</span>
              </span>
              <span className="text-[9px] text-tactiq-dim uppercase tracking-widest">
                Football Intel
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <div className="w-7 h-7 rounded-lg bg-tactiq-emeraldMid border border-tactiq-emeraldSubtle flex items-center justify-center">
              <Zap size={14} className="text-tactiq-emerald" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-tactiq-dim hover:text-slate-300 transition-colors p-1 rounded"
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {/* Main Menu */}
        <div className="space-y-0.5">
          {!collapsed && (
            <span className="px-3 mb-1 text-[10px] uppercase tracking-widest text-tactiq-dim font-semibold block">
              Menu
            </span>
          )}
          {MENU_ITEMS.map(renderItem)}
        </div>

        {/* Analysis */}
        <div className="space-y-0.5">
          {!collapsed && (
            <span className="px-3 mb-1 text-[10px] uppercase tracking-widest text-tactiq-dim font-semibold block">
              Analysis
            </span>
          )}
          {ANALYSIS_ITEMS.map(renderItem)}
        </div>

        {/* Bottom section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <span className="px-3 mb-1 text-[10px] uppercase tracking-widest text-tactiq-dim font-semibold block">
              System
            </span>
          )}
          <Link
            href="/"
            className="sidebar-link group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-tactiq-muted hover:text-slate-200 transition-all"
          >
            <Settings size={16} className="text-tactiq-dim group-hover:text-slate-300" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <Link
            href="/"
            className="sidebar-link group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-tactiq-muted hover:text-slate-200 transition-all"
          >
            <HelpCircle size={16} className="text-tactiq-dim group-hover:text-slate-300" />
            {!collapsed && <span>Help center</span>}
          </Link>
        </div>
      </div>

      {/* Live match mini widget — pinned bottom */}
      {!collapsed && (
        <Link
          href="/match-center"
          className="mx-2 mb-3 rounded-lg overflow-hidden border border-tactiq-emeraldSubtle bg-tactiq-emeraldBg hover:border-tactiq-emerald transition-colors group"
        >
          <div className="relative h-16 bg-gradient-to-b from-[#0F2D1A] to-tactiq-emeraldBg">
            {/* Score overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[9px] text-tactiq-muted uppercase tracking-widest">Arsenal vs City</span>
              <span className="text-lg font-black text-white font-mono tracking-tighter">2 : 1</span>
            </div>
            {/* Live badge */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tactiq-emerald animate-pulse" />
              <span className="text-[9px] font-bold text-tactiq-emerald">68&apos;</span>
            </div>
          </div>
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-[9px] text-tactiq-muted">Premier League • GW8</span>
            <ChevronRight size={10} className="text-tactiq-dim group-hover:text-tactiq-emerald transition-colors" />
          </div>
        </Link>
      )}
    </aside>
  );
};
