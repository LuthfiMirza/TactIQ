import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { TopProgressBar } from '@/components/ui/top-progress-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'TactIQ — Football Intelligence & Matchday Hub',
  description: 'Real-time tactical analytics, xG tracking, and scouting intelligence for the modern game.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F0F2F5' },
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
  ],
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090B] text-zinc-100 font-sans antialiased relative">
        {/* Subtle Pitch Mesh Atmosphere (Web & Mobile) */}
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          {/* Top Radial Stadium Pitch Glow */}
          <div className="absolute -top-[12%] sm:-top-[22%] left-1/2 -translate-x-1/2 w-[550px] sm:w-[950px] lg:w-[1300px] h-[340px] sm:h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#CEFF00]/[0.05] via-emerald-500/[0.02] to-transparent blur-2xl sm:blur-3xl" />
        </div>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <div className="relative z-10">
          <Navbar />
          <div className="pb-20 md:pb-0">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
