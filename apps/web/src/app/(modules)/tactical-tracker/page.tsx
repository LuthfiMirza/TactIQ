'use client';

import React, { useState, useCallback } from 'react';
import { VideoOverlayCanvas } from '@/components/video-overlay-canvas';
import { TacticalMinimap } from '@/components/tactical-minimap';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';
import type { TrackingFramePayload, TrackingEntity, TacticalMetricsDTO } from '@tactiq/shared-types';
import {
  Radio,
  Activity,
  Gauge,
  Cpu,
  AlertCircle,
  Crosshair,
  Film,
  Sparkles,
  Video,
  Shield,
  Maximize2,
  Layers,
  TrendingUp,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { VideoImporterModal, type CustomVideoSessionConfig } from '@/components/video-importer-modal';
import {
  FA_COMMUNITY_SHIELD_ROSTER,
  calculateTacticalMetrics,
} from '@/lib/tactical-600-sequence';

const TACTICAL_SESSIONS = [
  {
    id: 'demo-session-tactical-001',
    title: 'Manchester United vs Manchester City',
    phase: 'FA Community Shield 2024 Final (82\' Garnacho / 89\' Bernardo Silva)',
    competition: 'FA Community Shield',
    venue: 'Wembley Stadium, London',
    homeCode: 'MUN',
    awayCode: 'MCI',
    youtubeUrl: 'https://www.youtube.com/embed/z4B7hN5sE_s?autoplay=1&mute=1&controls=1&loop=1&playlist=z4B7hN5sE_s',
    score: '1 (6) — 1 (7)',
    statusBadge: 'WEMBLEY 11v11',
  },
  {
    id: 'session-local-garnacho-clip',
    title: 'Local MP4: Garnacho Cut-Inside & Goal Clip',
    phase: 'YOLOv8 + ByteTrack Planar Homography Projection',
    competition: 'FA Community Shield 2024',
    venue: 'Wembley Stadium, London',
    homeCode: 'MUN',
    awayCode: 'MCI',
    youtubeUrl: '',
    videoSrc: '/sample_crossing.mp4',
    score: '1 — 0',
    statusBadge: 'LOCAL MP4 SYNC',
  },
  {
    id: 'demo-session-tactical-002',
    title: 'Real Madrid vs FC Barcelona',
    phase: 'El Clásico Rapid Transition Phase',
    competition: 'La Liga',
    venue: 'Santiago Bernabéu, Madrid',
    homeCode: 'RMA',
    awayCode: 'FCB',
    youtubeUrl: 'https://www.youtube.com/embed/6i2q6ZqjR4w?autoplay=1&mute=1&controls=1&loop=1&playlist=6i2q6ZqjR4w',
    score: '2 — 1',
    statusBadge: 'FT FINISHED',
  },
  {
    id: 'demo-session-tactical-003',
    title: 'Liverpool vs Bayer Leverkusen',
    phase: 'Gegenpressing & Turnover Phase',
    competition: 'UEFA Champions League',
    venue: 'Anfield, Liverpool',
    homeCode: 'LIV',
    awayCode: 'B04',
    youtubeUrl: 'https://www.youtube.com/embed/8v_5w3K5zqk?autoplay=1&mute=1&controls=1&loop=1&playlist=8v_5w3K5zqk',
    score: '3 — 0',
    statusBadge: 'FT FINISHED',
  },
  {
    id: 'demo-session-metrica-game2',
    title: 'Metrica Sports Open Tracking Dataset',
    phase: 'Full 25 FPS 22-Player Broadcast Tracking',
    competition: 'Open Research Benchmark',
    venue: 'Open Data Arena',
    homeCode: 'MCI',
    awayCode: 'ARS',
    youtubeUrl: 'https://www.youtube.com/embed/z4B7hN5sE_s?autoplay=1&mute=1&controls=1&loop=1&playlist=z4B7hN5sE_s',
    score: '2 — 1',
    statusBadge: '25 FPS OPEN DATA',
  },
  {
    id: 'demo-session-statsbomb360-cl',
    title: 'StatsBomb 360 Open Event Coordinates',
    phase: 'Freeze-Frame Defensive Overload Phase',
    competition: 'UEFA Champions League',
    venue: 'Wembley Stadium, London',
    homeCode: 'RMA',
    awayCode: 'B04',
    youtubeUrl: 'https://www.youtube.com/embed/6i2q6ZqjR4w?autoplay=1&mute=1&controls=1&loop=1&playlist=6i2q6ZqjR4w',
    score: '2 — 0',
    statusBadge: '360 FREEZE-FRAME',
  },
];

export default function TacticalTrackerPage() {
  const [customSessions, setCustomSessions] = useState<typeof TACTICAL_SESSIONS>([]);
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('demo-session-tactical-001');

  const allSessions = [...customSessions, ...TACTICAL_SESSIONS];
  const currentSession = allSessions.find((s) => s.id === activeSessionId) || allSessions[0];

  const [latestFrame, setLatestFrame] = useState<TrackingFramePayload | null>(null);
  const [isStartingPipeline, setIsStartingPipeline] = useState<boolean>(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away' | 'ball'>('all');

  const handleFrameUpdate = useCallback((frame: TrackingFramePayload) => {
    setLatestFrame(frame);
  }, []);

  // Apply custom YouTube URL or Local MP4 file from modal
  const handleApplyCustomVideo = (config: CustomVideoSessionConfig) => {
    const newSession = {
      id: config.id,
      title: config.title,
      phase: config.sourceType === 'local_file' ? 'Local MP4 Custom Stream' : 'YouTube High-Cam Broadcast',
      competition: config.competition,
      venue: config.venue,
      homeCode: config.homeCode,
      awayCode: config.awayCode,
      youtubeUrl: config.youtubeUrl || '',
      videoSrc: config.videoSrc,
      score: config.score,
      statusBadge: config.statusBadge,
    };

    setCustomSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setPipelineMessage(
      `Video aktif diganti: ${newSession.title} (${
        config.sourceType === 'youtube' ? 'YouTube Embed' : 'Local Video MP4'
      }). Tracking & Cam FOV Box diaktifkan.`
    );

    if (config.youtubeUrl) {
      api.startTracking({ session_id: newSession.id, youtube_url: config.youtubeUrl }).catch(() => {});
    }
  };

  // Trigger ML background pipeline
  const handleStartPipeline = async () => {
    setIsStartingPipeline(true);
    setPipelineMessage(null);
    try {
      const data = await api.startTracking({
        session_id: activeSessionId,
        youtube_url: currentSession.youtubeUrl,
      });
      setPipelineMessage(data.message || 'Tracking pipeline triggered via Redis stream!');
    } catch {
      setPipelineMessage('Triggered locally. Click "Run Simulated Tracking" on the canvas controls to stream 10 FPS.');
    } finally {
      setIsStartingPipeline(false);
    }
  };

  // Filtered entities
  const rawEntities = latestFrame?.entities || [];
  const filteredEntities = rawEntities.filter((ent) => {
    if (filterTeam === 'all') return true;
    if (filterTeam === 'home') return ent.team === 'home';
    if (filterTeam === 'away') return ent.team === 'away';
    if (filterTeam === 'ball') return ent.team === 'ball';
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-6 pb-24 sm:pb-16">
      
      {/* ── Top Match Pass Header (Matchday Banner) ── */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 lg:p-6 shadow-xs overflow-hidden transition-colors">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
          {/* Match & Room Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            {/* Flat Scorecard */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <ClubCrest code={currentSession.homeCode} size={38} className="drop-shadow-xs" />
              </div>
              <div className="flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] px-1 text-center">
                <span className="font-mono font-black text-xl sm:text-2xl text-white tracking-tight tabular-nums">{currentSession.score}</span>
                <span className="text-[10px] font-mono text-tactiq-coral font-bold whitespace-nowrap">{currentSession.statusBadge}</span>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <ClubCrest code={currentSession.awayCode} size={38} className="drop-shadow-xs" />
              </div>
            </div>

            <div className="sm:border-l sm:border-[#27272A] sm:pl-5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  {currentSession.competition} · Final
                </span>
              </div>
              <h1 className="font-extrabold text-base sm:text-xl lg:text-2xl text-white tracking-tight mt-0.5">
                {currentSession.title}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                <LeagueLogo league={currentSession.competition} size={13} />
                <span>{currentSession.venue}</span>
              </div>
            </div>
          </div>

          {/* Controls & Session Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1 md:pt-0">
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="bg-[#18181C] border border-[#27272A] text-zinc-200 text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-emerald-500/50 transition-colors"
            >
              {allSessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.title} ({sess.competition})
                </option>
              ))}
            </select>

            {/* Clean Modal Launcher for YouTube or Local Video */}
            <button
              onClick={() => setIsImporterOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#18181C] hover:bg-[#222228] text-white text-xs font-mono font-bold rounded-xl border border-[#27272A] hover:border-zinc-500 transition-colors cursor-pointer"
              title="Input URL YouTube atau Pilih File Video MP4"
            >
              <Film size={14} className="text-emerald-400" />
              <span>+ Input Video / YouTube</span>
            </button>

            <button
              onClick={handleStartPipeline}
              disabled={isStartingPipeline}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 w-full sm:w-auto min-h-[38px] cursor-pointer"
            >
              <Radio size={14} className={isStartingPipeline ? 'animate-spin' : ''} />
              <span>{isStartingPipeline ? 'Menghubungkan...' : 'Sinkronkan Radar Taktis'}</span>
            </button>
          </div>
        </div>
      </div>

      {pipelineMessage && (
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-[#16161A] border border-slate-200 dark:border-[#27272A] rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-200 flex items-center gap-2 shadow-xs">
          <Activity size={14} className="text-slate-900 dark:text-zinc-100 shrink-0" />
          <span>{pipelineMessage}</span>
        </div>
      )}

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 cols: Video Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <VideoOverlayCanvas
            key={activeSessionId}
            sessionId={activeSessionId}
            youtubeUrl={currentSession.youtubeUrl}
            videoSrc={(currentSession as any).videoSrc}
            initialVideoMode={false}
            onFrameUpdate={handleFrameUpdate}
          />
        </div>

        {/* Right 4 cols: Planar Minimap & Interactive Entity Registry */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* 2D Minimap Frame */}
          <TacticalMinimap
            entities={latestFrame?.entities}
            selectedEntityId={selectedEntityId}
            onSelectEntity={(id) => setSelectedEntityId(id)}
          />

          {/* Entity Registry Table (Player Telemetry Cards) */}
          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 shadow-xs flex flex-col gap-3.5 transition-colors">
            
            {/* Header & Active Count */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-slate-500 dark:text-zinc-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Tracked Entity Stream
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold tracking-wider">
                  10 FPS TRACKING
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] px-2.5 py-0.5 rounded">
                {rawEntities.length || 23} Entities Active
              </span>
            </div>

            <div className="text-[10px] font-mono text-zinc-400 bg-[#18181C] border border-[#27272A] px-3 py-1.5 rounded-xl flex items-center justify-between">
              <span>Model Kinematika Lapangan 105×68m</span>
              <span className="text-zinc-300 font-semibold">22 Pemain Terlacak</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#18181C] border border-[#27272A] text-[11px] font-mono">
              <button
                onClick={() => setFilterTeam('all')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold ${
                  filterTeam === 'all'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({rawEntities.length || 23})
              </button>
              <button
                onClick={() => setFilterTeam('home')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'home'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ClubCrest code={currentSession.homeCode} size={13} />
                <span>{currentSession.homeCode} (11)</span>
              </button>
              <button
                onClick={() => setFilterTeam('away')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'away'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ClubCrest code={currentSession.awayCode} size={13} />
                <span>{currentSession.awayCode} (11)</span>
              </button>
              <button
                onClick={() => setFilterTeam('ball')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'ball'
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Ball</span>
              </button>
            </div>

            {/* Entity List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto font-mono text-xs pr-1 slim-scrollbar">
              {filteredEntities.length > 0 ? (
                filteredEntities.map((entity: TrackingEntity) => {
                  const isBall = entity.team === 'ball';
                  const isHome = entity.team === 'home';
                  const jNumber = entity.jerseyNumber || entity.id;
                  const rosterKey = `${entity.team}_${jNumber}`;
                  const rosterInfo = FA_COMMUNITY_SHIELD_ROSTER[rosterKey] || {
                    name: isHome ? `Man United #${jNumber}` : `Man City #${jNumber}`,
                    pos: (isHome ? 'MID' : 'FWD') as any,
                    team: entity.team as any,
                    num: jNumber,
                    dist: '8.4 km',
                  };
                  const speed = entity.speedKmh || (isBall ? 22.4 : 18.2);
                  const speedPercent = Math.min(100, Math.round((speed / 34) * 100));
                  const isSelected = selectedEntityId === entity.id;

                  return (
                    <div
                      key={entity.id}
                      onClick={() => setSelectedEntityId(isSelected ? null : entity.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-300 dark:border-zinc-500 bg-slate-100 dark:bg-[#1E1E24] shadow-xs'
                          : 'border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#18181C]/60 hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                      }`}
                    >
                      {/* Top Row: Identity & Speed */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 ${
                              isBall
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                : isHome
                                ? 'bg-gradient-to-br from-[#DA291C] to-[#9B1B1B]'
                                : 'bg-gradient-to-br from-[#6CABDD] to-[#458BB8]'
                            }`}
                          >
                            {isBall ? <SoccerBallIcon size={14} className="text-white" /> : jNumber}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs block truncate">
                              {isBall ? 'Nike Flight Match Ball' : rosterInfo.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                              {isBall ? 'Pitch Center' : `${isHome ? 'Man United' : 'Man City'} · ${rosterInfo.pos}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block tabular-nums">
                            {speed.toFixed(1)} <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal">km/h</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                            {isBall ? 'In Flight' : rosterInfo.dist}
                          </span>
                        </div>
                      </div>

                      {/* Speed Meter Bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <Gauge size={11} className="text-slate-400 shrink-0" />
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isBall
                                ? 'bg-amber-500'
                                : speed > 26
                                ? 'bg-amber-500'
                                : isHome
                                ? 'bg-[#DA291C]'
                                : 'bg-[#6CABDD]'
                            }`}
                            style={{ width: `${speedPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 dark:text-zinc-400 shrink-0 tabular-nums">
                          {speedPercent}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 dark:text-zinc-400 font-mono text-xs space-y-2">
                  <AlertCircle size={20} className="mx-auto text-slate-400 dark:text-zinc-500" />
                  <p className="font-bold text-slate-900 dark:text-white">No entities match filter</p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Select another filter tab or trigger the simulation stream.
                  </p>
                </div>
              )}
            </div>

            {/* Technical Calibration Specs Footer */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-[#27272A] text-[10px] font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crosshair size={11} className="text-slate-700 dark:text-zinc-300" />
                <span>Click player to lock target</span>
              </span>
              <span className="text-slate-900 dark:text-white font-semibold">105m × 68m Pitch</span>
            </div>

          </div>

        </div>

      </div>

      {/* ── Modern Real-Time Tactical Kinematics Analytics Section ───────── */}
      {(() => {
        const metrics: TacticalMetricsDTO =
          latestFrame?.tacticalMetrics || calculateTacticalMetrics(rawEntities);
        const homeDefLine = metrics.homeDefensiveLineMeters ?? 38.5;
        const awayDefLine = metrics.awayDefensiveLineMeters ?? 42.0;
        const homeHull = metrics.homeCompactnessAreaM2 ?? 780;
        const awayHull = metrics.awayCompactnessAreaM2 ?? 640;
        const homeInterLine = metrics.homeInterLineDistanceMeters ?? 14.8;
        const awayInterLine = metrics.awayInterLineDistanceMeters ?? 13.5;

        // Pitch total area is 105m x 68m = 7140 m^2
        const totalPitchArea = 7140;
        const homePitchPercent = Math.min(100, Math.round((homeHull / totalPitchArea) * 100));
        const awayPitchPercent = Math.min(100, Math.round((awayHull / totalPitchArea) * 100));

        return (
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-xs flex flex-col gap-5 transition-colors">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#27272A] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#CEFF00]/10 border border-[#CEFF00]/30 flex items-center justify-center text-[#CEFF00] shrink-0">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                      Metrik Taktis Real-Time Modern (Kinematika Lapangan 11v11)
                    </h2>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#CEFF00]/20 text-[#CEFF00] border border-[#CEFF00]/40 text-[9px] font-mono font-bold">
                      LIVE 10 FPS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">
                    Kalkulasi matematis kontinu: Garis Pertahanan, Luas Kompaksi Tim (Convex Hull), & Jarak Antar Lini
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] text-[10px] font-mono text-zinc-300">
                  <Zap size={11} className="text-[#CEFF00]" />
                  <span>Homography 3×3</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  <CheckCircle2 size={11} />
                  <span>Time-Locked Sync</span>
                </div>
              </div>
            </div>

            {/* 3 Analytics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Defensive Line Height (Garis Tinggi Pertahanan) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200/80 dark:border-[#27272A] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-zinc-200 font-mono">
                      Garis Tinggi Pertahanan
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Jarak dari gawang (m)</span>
                </div>

                {/* Values & Progress */}
                <div className="space-y-3">
                  {/* Home Line */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#DA291C]" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Man United</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {homeDefLine.toFixed(1)} <span className="text-[10px] font-normal text-zinc-400">meter</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#DA291C] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (homeDefLine / 52.5) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Away Line */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Man City</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {awayDefLine.toFixed(1)} <span className="text-[10px] font-normal text-zinc-400">meter</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6CABDD] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (awayDefLine / 52.5) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>Blok: {homeDefLine > 40 ? 'High Line' : 'Mid-Block'}</span>
                  <span>Garis Tengah: 52.5m</span>
                </div>
              </div>

              {/* Card 2: Team Compactness Hull Area (Luas Kompaksi Tim) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200/80 dark:border-[#27272A] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 size={16} className="text-[#CEFF00]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-zinc-200 font-mono">
                      Luas Kompaksi Tim
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Convex Hull (m²)</span>
                </div>

                <div className="space-y-3">
                  {/* Home Hull */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#DA291C]" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Man United</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {homeHull} <span className="text-[10px] font-normal text-zinc-400">m² ({homePitchPercent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#DA291C] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (homeHull / 1500) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Away Hull */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Man City</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {awayHull} <span className="text-[10px] font-normal text-zinc-400">m² ({awayPitchPercent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6CABDD] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (awayHull / 1500) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>Shoelace Area Algoritma</span>
                  <span>Total Lapangan: 7,140 m²</span>
                </div>
              </div>

              {/* Card 3: Inter-Line Distance (Jarak Antar Lini) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200/80 dark:border-[#27272A] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-sky-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-zinc-200 font-mono">
                      Jarak Antar Lini (Bek - Gel)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Separasi Vertikal (m)</span>
                </div>

                <div className="space-y-3">
                  {/* Home Inter-Line */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#DA291C]" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Man United</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {homeInterLine.toFixed(1)} <span className="text-[10px] font-normal text-zinc-400">meter</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#DA291C] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (homeInterLine / 25) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Away Inter-Line */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6CABDD]" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">Man City</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {awayInterLine.toFixed(1)} <span className="text-[10px] font-normal text-zinc-400">meter</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6CABDD] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (awayInterLine / 25) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>Target Ideal: 12 - 16m</span>
                  <span className={homeInterLine <= 16 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {homeInterLine <= 16 ? 'Sangat Kompak' : 'Sedang'}
                  </span>
                </div>
              </div>

            </div>

            {/* Tactical Synchronization Telemetry Status Bar */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200 dark:border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-700 dark:text-zinc-200 font-semibold">2D Optical Tracking Engine</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400">10 FPS Canonical Pitch Projection</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 self-end sm:self-auto font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                <span>Standard 105×68m Field Dimensions</span>
              </div>
            </div>

          </div>
        );
      })()}

      {/* Video Importer Modal (YouTube URL & Local MP4 File) */}
      <VideoImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onApplyVideo={handleApplyCustomVideo}
      />

    </div>
  );
}
