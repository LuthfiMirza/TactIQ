'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Trophy, Crosshair, ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

export const TACTIQ_NAV_ITEMS: NavItem[] = [
  { name: 'Overview', url: '/', icon: Home },
  { name: 'Scouting', url: '/scouting', icon: Users },
  { name: 'Match Center', url: '/match-center', icon: Trophy },
  { name: 'Tactical Tracker', url: '/tactical-tracker', icon: Crosshair },
];

export function TubelightNavbar({
  items = TACTIQ_NAV_ITEMS,
  className,
}: {
  items?: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(items[0].url);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Sync active route
  useEffect(() => {
    const current = items.find((item) =>
      item.url === '/' ? pathname === '/' : pathname.startsWith(item.url)
    );
    if (current) {
      setActiveTab(current.url);
    }
  }, [pathname, items]);

  // Smart Hide on Scroll Down, Reveal on Scroll Up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at top of page
      if (currentScrollY < 60) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 10) {
        // Scrolling down -> hide navbar
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        // Scrolling up -> reveal navbar
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* ── Desktop Top Floating Bar ─────────────────────────────────────────── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-20 pointer-events-none transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          
          {/* Brand Logo (Left) */}
          <div className="pointer-events-auto">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#00DF59] flex items-center justify-center font-display font-black text-xs text-black shadow-lg shadow-[#00DF59]/20 transition-transform group-hover:scale-105">
                TQ
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-lg tracking-tight text-white leading-none">
                  Tact<span className="text-[#00DF59]">IQ</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Tubelight Island (Center - Desktop) */}
          <div className={cn("hidden sm:flex pointer-events-auto", className)}>
            <div className="flex items-center gap-1 bg-[#141A24]/90 border border-[#222B3D] backdrop-blur-xl py-1.5 px-2 rounded-full shadow-2xl">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.url;

                return (
                  <Link
                    key={item.name}
                    href={item.url}
                    onClick={() => setActiveTab(item.url)}
                    className={cn(
                      'relative cursor-pointer text-xs font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-2',
                      isActive
                        ? 'text-white'
                        : 'text-[#8E9EB5] hover:text-white hover:bg-[#1D2534]/60'
                    )}
                  >
                    <Icon size={14} className={isActive ? 'text-[#00DF59]' : 'text-[#8E9EB5]'} />
                    <span>{item.name}</span>

                    {/* Tubelight Lamp Effect */}
                    {isActive && (
                      <motion.div
                        layoutId="tubelight-lamp"
                        className="absolute inset-0 w-full bg-[#1D2534] rounded-full -z-10 border border-[#222B3D]"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 30,
                        }}
                      >
                        {/* Glow Lamp Bar */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00DF59] rounded-t-full">
                          <div className="absolute w-12 h-5 bg-[#00DF59]/30 rounded-full blur-md -top-2 -left-2" />
                          <div className="absolute w-8 h-5 bg-[#00DF59]/25 rounded-full blur-md -top-1" />
                          <div className="absolute w-4 h-3 bg-[#00DF59]/40 rounded-full blur-sm top-0 left-2" />
                        </div>
                      </motion.div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Button */}
          <div className="pointer-events-auto flex items-center gap-3">
            <Link
              href="/scouting"
              className="flex items-center gap-2 px-4 py-2 bg-[#00DF59] hover:bg-[#00C84F] text-black text-xs font-black uppercase tracking-wider rounded-lg shadow-md shadow-[#00DF59]/20 transition-all active:scale-95"
            >
              <span>Launch</span>
              <ArrowRight size={13} />
            </Link>
          </div>

        </div>
      </header>

      {/* ── Mobile Bottom Floating Bar ───────────────────────────────────────── */}
      <div
        className={cn(
          "sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm transition-transform duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "translate-y-28 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-around bg-[#141A24]/95 border border-[#222B3D] backdrop-blur-xl py-2 px-3 rounded-full shadow-2xl">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.url;

            return (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => setActiveTab(item.url)}
                className={cn(
                  'relative p-2.5 rounded-full transition-colors flex flex-col items-center justify-center',
                  isActive ? 'text-white' : 'text-[#8E9EB5] hover:text-white'
                )}
                aria-label={item.name}
              >
                <Icon size={18} className={isActive ? 'text-[#00DF59]' : 'text-[#8E9EB5]'} />
                
                {/* Mobile Tubelight Lamp Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="tubelight-lamp-mobile"
                    className="absolute inset-0 bg-[#202838] rounded-full -z-10 border border-[#263145]"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 30,
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#00DF59] rounded-full">
                      <div className="absolute w-8 h-4 bg-[#00DF59]/30 rounded-full blur-sm -top-1 -left-1" />
                    </div>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function NavBar({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  return <TubelightNavbar items={items} className={className} />;
}
