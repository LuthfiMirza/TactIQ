'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import {
  Users,
  Shield,
  Crosshair,
  TrendingUp,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  Radio,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tactiq-card via-tactiq-card to-tactiq-surface border border-tactiq-border p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-tactiq-emerald/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-72 h-72 bg-tactiq-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-tactiq-emerald/10 border border-tactiq-emerald/20 text-tactiq-emerald text-xs font-semibold">
            <Activity size={14} className="animate-spin" />
            <span>TactIQ Core Platform Online</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Data-Driven Football Intelligence & Real-Time Tactical Tracking
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Unifying high-dimensional player radar analytics, statistical match outcome forecasting, and computer-vision entity coordinate tracking across high-performance microservices.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/scouting"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-tactiq-emerald text-tactiq-bg font-bold text-sm hover:bg-tactiq-emerald/90 transition-all shadow-glow-emerald"
            >
              <span>Explore Scouting Hub</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/tactical-tracker"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-tactiq-surface border border-tactiq-border text-white font-semibold text-sm hover:border-tactiq-cyan hover:text-tactiq-cyan transition-all"
            >
              <Crosshair size={16} />
              <span>Launch Tactical Visualizer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Indexed Players"
          value="20+"
          change="+100% Elite"
          isPositive={true}
          icon={Users}
          subtext="7-Axis Radar Metrics & Bio"
        />
        <StatCard
          title="Active Clubs"
          value="4"
          change="Tier 1"
          isPositive={true}
          icon={Shield}
          subtext="Premier League & European Elite"
        />
        <StatCard
          title="Match Forecasting"
          value="98.2%"
          change="Form Calibrated"
          isPositive={true}
          icon={TrendingUp}
          subtext="Multi-factor Poisson/Elo Model"
        />
        <StatCard
          title="Tracking Stream"
          value="10 FPS"
          change="Ultra-low Latency"
          isPositive={true}
          icon={Radio}
          subtext="Redis Pub/Sub & Socket.io Hub"
        />
      </section>

      {/* 3 Core Architectural Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Core Operational Modules</h2>
            <p className="text-xs text-tactiq-muted">Integrated microservices built across our 3 engineering leads.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Scouting */}
          <Link
            href="/scouting"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-tactiq-card border border-tactiq-border hover:border-tactiq-emerald/50 transition-all duration-300 hover:shadow-glow-emerald/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-tactiq-emerald/10 border border-tactiq-emerald/20 flex items-center justify-center text-tactiq-emerald group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-tactiq-emerald transition-colors">
                Scouting & Player Similarity
              </h3>
              <p className="text-xs text-tactiq-muted leading-relaxed">
                Filter across positions, leagues, and passing thresholds. Discover similar player profiles using high-dimensional cosine similarity vectors computed in FastAPI.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-tactiq-emerald">
              <span>Launch Scouting Table</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 2: Match Center */}
          <Link
            href="/match-center"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-tactiq-card border border-tactiq-border hover:border-tactiq-cyan/50 transition-all duration-300 hover:shadow-glow-cyan/20"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-tactiq-cyan/10 border border-tactiq-cyan/20 flex items-center justify-center text-tactiq-cyan group-hover:scale-110 transition-transform">
                <Shield size={20} />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-tactiq-cyan transition-colors">
                Match Center & Head-to-Head
              </h3>
              <p className="text-xs text-tactiq-muted leading-relaxed">
                Analyze upcoming clashes, historical H2H records, and trigger AI win probability forecasting with automated scoreline expectation.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-tactiq-cyan">
              <span>View Fixture Breakdown</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 3: Tactical Tracker */}
          <Link
            href="/tactical-tracker"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-tactiq-card border border-tactiq-border hover:border-rose-500/50 transition-all duration-300"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Crosshair size={20} />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                Tactical Vision Tracker
              </h3>
              <p className="text-xs text-tactiq-muted leading-relaxed">
                Live HTML5 2D pitch overlay canvas synchronized with Socket.io and Redis. Real-time player coordinates, speed metrics, and tactical heat trails.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-rose-400">
              <span>Open Tactical Stream</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Engineering Lead Ownership Mapping */}
      <section className="p-6 bg-tactiq-card/60 border border-tactiq-border rounded-2xl">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Layers size={16} className="text-tactiq-emerald" />
          <span>TactIQ Distributed Architecture & Team Ownership</span>
        </h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-tactiq-surface/50 border border-tactiq-border">
            <div className="font-bold text-slate-200">1. apps/api (Luthfi)</div>
            <p className="text-tactiq-muted mt-1">Node.js, Express, Prisma ORM, PostgreSQL, Redis Pub/Sub, and Socket.io WebSocket Hub.</p>
          </div>
          <div className="p-4 rounded-xl bg-tactiq-surface/50 border border-tactiq-border">
            <div className="font-bold text-slate-200">2. services/ml (Fuad)</div>
            <p className="text-tactiq-muted mt-1">Python 3.11, FastAPI, Scikit-learn Cosine Similarity, Match Outcome Modeling, CV Worker.</p>
          </div>
          <div className="p-4 rounded-xl bg-tactiq-surface/50 border border-tactiq-border">
            <div className="font-bold text-slate-200">3. apps/web (Ferrel)</div>
            <p className="text-tactiq-muted mt-1">Next.js App Router, Tailwind CSS Sports Theme, Chart.js Radar Charts, HTML5 Canvas 2D Overlay.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
