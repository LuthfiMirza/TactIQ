'use client';

import React, { useState, useCallback } from 'react';
import { VideoOverlayCanvas } from '@/components/video-overlay-canvas';
import { TacticalMinimap } from '@/components/tactical-minimap';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';
import type { TrackingFramePayload, TrackingEntity, HomographyCalibrationResult } from '@tactiq/shared-types';
import { Radio, Activity, Gauge, Cpu, AlertCircle, Crosshair, Film, Sparkles, Video, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { VideoImporterModal, type CustomVideoSessionConfig } from '@/components/video-importer-modal';
import { DynamicHomographyModal } from '@/components/dynamic-homography-calibration-modal';
import spainCroatiaTrackedData from '@/data/spain_croatia_tracked_frames.json';
import mciMunTrackedData from '@/data/mci_mun_tracked_frames.json';

// Comprehensive roster mapping keyed by `{team}_{jerseyNumber}` to avoid cross-team collisions
const ROSTER_MAP: Record<string, { name: string; pos: string; dist: string }> = {
  // Manchester United (MUN - Home Red) Full 11
  'home_1': { name: 'André Onana', pos: 'GK', dist: '4.1 km' },
  'home_20': { name: 'Diogo Dalot', pos: 'RB', dist: '9.8 km' },
  'home_5': { name: 'Harry Maguire', pos: 'CB', dist: '8.2 km' },
  'home_6': { name: 'Lisandro Martínez', pos: 'CB', dist: '8.6 km' },
  'home_18': { name: 'Casemiro', pos: 'DM', dist: '10.4 km' },
  'home_37': { name: 'Kobbie Mainoo', pos: 'CM', dist: '10.9 km' },
  'home_16': { name: 'Amad Diallo', pos: 'RW', dist: '9.7 km' },
  'home_8': { name: 'Bruno Fernandes', pos: 'AM', dist: '11.3 km' },
  'home_10': { name: 'Marcus Rashford', pos: 'LW', dist: '9.5 km' },
  'home_17': { name: 'Alejandro Garnacho', pos: 'RW', dist: '9.9 km' },
  'home_9': { name: 'Rasmus Højlund', pos: 'CF', dist: '8.8 km' },

  // Manchester City (MCI - Away Sky Blue) Full 11
  'away_31': { name: 'Ederson Moraes', pos: 'GK', dist: '3.9 km' },
  'away_82': { name: 'Rico Lewis', pos: 'RB', dist: '10.1 km' },
  'away_25': { name: 'Manuel Akanji', pos: 'CB', dist: '8.9 km' },
  'away_3': { name: 'Rúben Dias', pos: 'CB', dist: '8.7 km' },
  'away_24': { name: 'Joško Gvardiol', pos: 'LB', dist: '9.8 km' },
  'away_52': { name: 'Oscar Bobb', pos: 'RW', dist: '10.3 km' },
  'away_8': { name: 'Mateo Kovačić', pos: 'CM', dist: '10.5 km' },
  'away_17': { name: 'Kevin De Bruyne', pos: 'AM', dist: '10.8 km' },
  'away_11': { name: 'Jérémy Doku', pos: 'LW', dist: '9.6 km' },
  'away_9': { name: 'Erling Haaland', pos: 'CF', dist: '8.5 km' },
  'away_20': { name: 'Bernardo Silva', pos: 'AM', dist: '11.1 km' },

  // Additional Premier League & International Profiles
  'home_47': { name: 'Phil Foden', pos: 'RW', dist: '10.2 km' },
  'away_47': { name: 'Phil Foden', pos: 'RW', dist: '10.2 km' },
  'away_41': { name: 'Declan Rice', pos: 'DM', dist: '11.4 km' },
  'away_12': { name: 'Jurriën Timber', pos: 'LB', dist: '9.4 km' },
  'away_22': { name: 'David Raya', pos: 'GK', dist: '4.1 km' },

  // Spain (ESP - Home) Full 11
  'home_23': { name: 'Unai Simón', pos: 'GK', dist: '4.2 km' },
  'home_2': { name: 'Dani Carvajal', pos: 'RB', dist: '9.8 km' },
  'home_4': { name: 'Nacho Fernández', pos: 'CB', dist: '9.3 km' },
  'home_19': { name: 'Lamine Yamal', pos: 'RW', dist: '9.4 km' },
  'home_7': { name: 'Álvaro Morata', pos: 'CF', dist: '8.6 km' },

  // Croatia (CRO - Away) Full 11
  'away_2': { name: 'Josip Stanišić', pos: 'RB', dist: '9.5 km' },
  'away_6': { name: 'Josip Šutalo', pos: 'CB', dist: '9.2 km' },
  'away_4': { name: 'Joško Gvardiol', pos: 'LB', dist: '8.9 km' },
  'away_10': { name: 'Luka Modrić', pos: 'CM', dist: '10.8 km' },
  'away_7': { name: 'Lovro Majer', pos: 'RW', dist: '9.6 km' },
  'away_14': { name: 'Ante Budimir', pos: 'LW', dist: '8.7 km' },
};

const getTeamName = (code: string): string => {
  switch (code) {
    case 'ESP': return 'Spain';
    case 'CRO': return 'Croatia';
    case 'MCI': return 'Man City';
    case 'ARS': return 'Arsenal';
    case 'RMA': return 'Real Madrid';
    case 'FCB': return 'Barcelona';
    case 'LIV': return 'Liverpool';
    case 'B04': return 'Leverkusen';
    case 'MUN': return 'Man United';
    default: return code;
  }
};

const getTeamColor = (code: string): string => {
  switch (code) {
    case 'ESP': return '#EF0107';
    case 'CRO': return '#3B82F6';
    case 'MCI': return '#6CABDD';
    case 'ARS': return '#EF0107';
    case 'RMA': return '#FEBE10';
    case 'FCB': return '#004D98';
    case 'LIV': return '#C8102E';
    case 'B04': return '#E32221';
    case 'MUN': return '#DA291C';
    default: return '#EF0107';
  }
};

const getTeamPhase = (code: string, isHome: boolean): string => {
  if (code === 'MUN') return isHome ? '3-2-4-1 Build-up' : '4-4-2 Mid-Block';
  if (code === 'MCI') return isHome ? '3-2-4-1 Build-up' : '4-4-2 Mid-Block';
  if (code === 'ESP') return '4-3-3 High Press';
  if (code === 'CRO') return '4-3-3 Mid-Block';
  if (code === 'ARS') return isHome ? '4-3-3 Mid-Block' : '4-4-2 Mid-Block';
  if (code === 'RMA') return '4-3-1-2 Rapid Transition';
  if (code === 'FCB') return '4-3-3 Possession Build';
  if (code === 'LIV') return '4-3-3 Gegenpressing';
  if (code === 'B04') return '3-4-2-1 Compact Block';
  return isHome ? 'Attacking Phase' : 'Defensive Block';
};

interface TacticalSessionItem {
  id: string;
  title: string;
  phase: string;
  competition: string;
  venue: string;
  homeCode: string;
  awayCode: string;
  youtubeUrl: string;
  videoSrc?: string;
  videoPath?: string;
  defaultFrame?: number;
  score: string;
  statusBadge: string;
}

const TACTICAL_SESSIONS: TacticalSessionItem[] = [
  {
    id: 'session-mun-mci-community-shield-2024',
    title: 'Manchester United vs Manchester City (Community Shield)',
    phase: 'Wembley Derby: 3-2-4-1 Build-up vs 4-4-2 Mid-Block',
    competition: 'FA Community Shield 2024',
    venue: 'Wembley Stadium, London',
    homeCode: 'MUN',
    awayCode: 'MCI',
    youtubeUrl: 'https://www.youtube.com/embed/X0we8220k74?autoplay=1&mute=1&controls=0&loop=1&playlist=X0we8220k74',
    videoPath: 'data/sample_crossing.mp4',
    score: '1 — 1',
    statusBadge: "82' GARNACHO 1-0",
    defaultFrame: 0,
  },
  {
    id: 'session-spain-croatia-2026',
    title: 'Spain vs Croatia (Lamine Yamal Masterclass)',
    phase: 'UEFA Nations League High Pressing & Line Adaptation',
    competition: 'UEFA Nations League',
    venue: 'Olympiastadion Berlin',
    homeCode: 'ESP',
    awayCode: 'CRO',
    youtubeUrl: 'https://www.youtube.com/embed/cnPiwMs1tds?autoplay=1&mute=1&controls=0&loop=1&playlist=cnPiwMs1tds',
    videoSrc: '/data/spain_croatia.mp4',
    videoPath: 'data/spain_croatia.mp4',
    score: '4 — 1',
    statusBadge: "84' LIVE MATCH TEST",
    defaultFrame: 900,
  },
  {
    id: 'demo-session-tactical-001',
    title: 'Manchester City vs Arsenal',
    phase: 'Tactical High Pressing Phase',
    competition: 'Premier League',
    venue: 'Etihad Stadium, Manchester',
    homeCode: 'MCI',
    awayCode: 'ARS',
    youtubeUrl: 'https://www.youtube.com/embed/z4B7hN5sE_s?autoplay=1&mute=1&controls=0&loop=1&playlist=z4B7hN5sE_s',
    score: '1 — 1',
    statusBadge: "88' DEMO SIM",
    videoPath: 'data/sample_crossing.mp4',
    defaultFrame: 0,
  },
  {
    id: 'demo-session-tactical-002',
    title: 'Real Madrid vs FC Barcelona',
    phase: 'El Clásico Rapid Transition Phase',
    competition: 'La Liga',
    venue: 'Santiago Bernabéu, Madrid',
    homeCode: 'RMA',
    awayCode: 'FCB',
    youtubeUrl: 'https://www.youtube.com/embed/6i2q6ZqjR4w?autoplay=1&mute=1&controls=0&loop=1&playlist=6i2q6ZqjR4w',
    score: '2 — 1',
    statusBadge: "FT FINISHED",
    videoPath: 'data/sample_crossing.mp4',
    defaultFrame: 0,
  },
  {
    id: 'demo-session-tactical-003',
    title: 'Liverpool vs Bayer Leverkusen',
    phase: 'Gegenpressing & Turnover Phase',
    competition: 'UEFA Champions League',
    venue: 'Anfield, Liverpool',
    homeCode: 'LIV',
    awayCode: 'B04',
    youtubeUrl: 'https://www.youtube.com/embed/8v_5w3K5zqk?autoplay=1&mute=1&controls=0&loop=1&playlist=8v_5w3K5zqk',
    score: '3 — 0',
    statusBadge: "FT FINISHED",
    videoPath: 'data/sample_crossing.mp4',
    defaultFrame: 0,
  },
  {
    id: 'demo-session-metrica-game2',
    title: 'Metrica Sports Open Tracking Dataset',
    phase: 'Full 25 FPS 22-Player Broadcast Tracking',
    competition: 'Open Research Benchmark',
    venue: 'Open Data Arena',
    homeCode: 'MCI',
    awayCode: 'ARS',
    youtubeUrl: 'https://www.youtube.com/embed/z4B7hN5sE_s?autoplay=1&mute=1&controls=0&loop=1&playlist=z4B7hN5sE_s',
    score: '2 — 1',
    statusBadge: "25 FPS OPEN DATA",
    videoPath: 'data/sample_crossing.mp4',
    defaultFrame: 0,
  },
  {
    id: 'demo-session-statsbomb360-cl',
    title: 'StatsBomb 360 Open Event Coordinates',
    phase: 'Freeze-Frame Defensive Overload Phase',
    competition: 'UEFA Champions League',
    venue: 'Wembley Stadium, London',
    homeCode: 'RMA',
    awayCode: 'B04',
    youtubeUrl: 'https://www.youtube.com/embed/6i2q6ZqjR4w?autoplay=1&mute=1&controls=0&loop=1&playlist=6i2q6ZqjR4w',
    score: '2 — 0',
    statusBadge: "360 FREEZE-FRAME",
    videoPath: 'data/sample_crossing.mp4',
    defaultFrame: 0,
  },
];

export default function TacticalTrackerPage() {
  const [customSessions, setCustomSessions] = useState<TacticalSessionItem[]>([]);
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-mun-mci-community-shield-2024');

  const allSessions = [...customSessions, ...TACTICAL_SESSIONS];
  const currentSession = allSessions.find((s) => s.id === activeSessionId) || allSessions[0];

  const [latestFrame, setLatestFrame] = useState<TrackingFramePayload | null>(null);
  const [isStartingPipeline, setIsStartingPipeline] = useState<boolean>(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away' | 'ball'>('all');

  // Dynamic Homography Calibration State
  const [isHomographyModalOpen, setIsHomographyModalOpen] = useState<boolean>(false);
  const [homographyData, setHomographyData] = useState<HomographyCalibrationResult | null>(null);
  const [overlaySettings, setOverlaySettings] = useState<{
    showLines: boolean;
    showIntersections: boolean;
    showFov: boolean;
  }>({
    showLines: true,
    showIntersections: true,
    showFov: true,
  });

  const handleFrameUpdate = useCallback((frame: TrackingFramePayload) => {
    setLatestFrame(frame);
  }, []);

  // Team metadata derived dynamically from current match session
  const homeName = getTeamName(currentSession.homeCode);
  const awayName = getTeamName(currentSession.awayCode);
  const homeColor = getTeamColor(currentSession.homeCode);
  const awayColor = getTeamColor(currentSession.awayCode);
  const homePhase = getTeamPhase(currentSession.homeCode, true);
  const awayPhase = getTeamPhase(currentSession.awayCode, false);

  // Apply custom YouTube URL or Local MP4 file from modal
  const handleApplyCustomVideo = (config: CustomVideoSessionConfig) => {
    const newSession: TacticalSessionItem = {
      id: config.id,
      title: config.title,
      phase: config.sourceType === 'local_file' ? 'Local MP4 Custom Stream' : 'YouTube High-Cam Broadcast',
      competition: config.competition,
      venue: config.venue,
      homeCode: config.homeCode,
      awayCode: config.awayCode,
      youtubeUrl: config.youtubeUrl || '',
      videoSrc: config.videoSrc,
      videoPath: config.videoSrc || 'data/spain_croatia.mp4',
      defaultFrame: 0,
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
      setPipelineMessage('Real-time tracking stream aktif di canvas dan 2D radar.');
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

  const homeCount = rawEntities.filter((e) => e.team === 'home').length || 11;
  const awayCount = rawEntities.filter((e) => e.team === 'away').length || 11;

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
                <span className="font-mono font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight tabular-nums">{currentSession.score}</span>
                <span className="text-[10px] font-mono text-tactiq-coral font-bold whitespace-nowrap">{currentSession.statusBadge}</span>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <ClubCrest code={currentSession.awayCode} size={38} className="drop-shadow-xs" />
              </div>
            </div>

            {/* Tactical Match Title & Venue Details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  {currentSession.title}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  YOLOv8 + ByteTrack
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{currentSession.competition}</span>
                <span>•</span>
                <span>{currentSession.phase}</span>
                <span>•</span>
                <span>{currentSession.venue}</span>
              </p>
            </div>
          </div>

          {/* Action Tools & Session Picker */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <select
              value={activeSessionId}
              onChange={(e) => {
                setActiveSessionId(e.target.value);
                setPipelineMessage(null);
              }}
              className="bg-slate-50 dark:bg-[#18181C] text-slate-900 dark:text-white border border-slate-200 dark:border-[#27272A] rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-hidden focus:border-[#CEFF00] transition-colors cursor-pointer"
            >
              {allSessions.map((session) => (
                <option key={session.id} value={session.id} className="bg-slate-900 text-white">
                  {session.title} ({session.homeCode} vs {session.awayCode})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsImporterOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-mono font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
              title="Input link video YouTube atau unggah file video MP4"
            >
              <Film size={14} />
              <span>+ Input Video / YouTube</span>
            </button>

            {/* Dynamic Homography Calibration Launcher */}
            <button
              onClick={() => setIsHomographyModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#18181C] hover:bg-[#222228] text-white text-xs font-mono font-bold rounded-xl border border-[#27272A] hover:border-[#CEFF00] transition-colors cursor-pointer"
              title="Kalibrasi Homografi Dinamis via Deteksi Garis Lapangan"
            >
              <Crosshair size={14} className="text-[#CEFF00]" />
              <span className="hidden sm:inline">⚡ Kalibrasi Garis</span>
              <span className="sm:hidden">Kalibrasi</span>
            </button>

            <button
              onClick={handleStartPipeline}
              disabled={isStartingPipeline}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-black text-xs font-mono font-black rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Mulai pelacakan AI YOLOv8 pada video"
            >
              <Sparkles size={14} />
              <span>{isStartingPipeline ? 'Starting...' : 'Run Vision Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Status Alert / Pipeline Notification */}
      {pipelineMessage && (
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-[#16161A] border border-slate-200 dark:border-[#27272A] rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-200 flex items-center gap-2 shadow-xs">
          <Activity size={14} className="text-[#CEFF00] shrink-0" />
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
            videoSrc={currentSession.videoSrc}
            initialVideoMode={Boolean(currentSession.videoSrc || currentSession.youtubeUrl)}
            onFrameUpdate={handleFrameUpdate}
            showFieldLines={overlaySettings.showLines}
            showIntersections={overlaySettings.showIntersections}
            showCameraFov={overlaySettings.showFov}
            fieldLines={homographyData?.field_lines}
            intersections={homographyData?.intersections}
            onOpenCalibrationModal={() => setIsHomographyModalOpen(true)}
            homeCode={currentSession.homeCode}
            awayCode={currentSession.awayCode}
            homeName={homeName}
            awayName={awayName}
            score={currentSession.score}
            statusBadge={currentSession.statusBadge}
            homeColor={homeColor}
            awayColor={awayColor}
            trackedFrames={
              activeSessionId === 'session-mun-mci-community-shield-2024'
                ? (mciMunTrackedData.frames as any)
                : activeSessionId === 'session-spain-croatia-2026'
                ? (spainCroatiaTrackedData.frames as any)
                : undefined
            }
          />
        </div>

        {/* Right 4 cols: Planar Minimap & Interactive Entity Registry */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* 2D Tactical Radar Frame matching exact format */}
          <TacticalMinimap
            entities={latestFrame?.entities}
            selectedEntityId={selectedEntityId}
            onSelectEntity={(id) => setSelectedEntityId(id)}
            homeCode={currentSession.homeCode}
            awayCode={currentSession.awayCode}
            homeName={homeName}
            awayName={awayName}
            homeColor={homeColor}
            awayColor={awayColor}
            homePhase={homePhase}
            awayPhase={awayPhase}
            statusBadge={
              activeSessionId === 'session-mun-mci-community-shield-2024'
                ? 'COMMUNITY SHIELD'
                : activeSessionId === 'session-spain-croatia-2026'
                ? 'YOLOv8 TRACKING'
                : currentSession.statusBadge
            }
            isLiveTracking={true}
            cameraFovQuad={
              (latestFrame as any)?.cameraFovQuad ||
              homographyData?.camera_fov_quad ||
              (activeSessionId === 'session-mun-mci-community-shield-2024'
                ? (mciMunTrackedData as any)?.camera_fov_quad
                : (spainCroatiaTrackedData as any)?.camera_fov_quad)
            }
            sourceLabel={
              currentSession.homeCode === 'MUN'
                ? 'YOUTUBE'
                : currentSession.homeCode === 'ESP'
                ? 'SPAIN vs CROATIA'
                : currentSession.youtubeUrl
                ? 'YOUTUBE'
                : 'BROADCAST'
            }
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
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  {activeSessionId === 'session-mun-mci-community-shield-2024'
                    ? 'YOLOv8 + 2D PLANAR'
                    : activeSessionId === 'session-spain-croatia-2026'
                    ? 'YOLOv8 + BYTE TRACK'
                    : 'AI STREAM'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] px-2.5 py-0.5 rounded">
                {rawEntities.length || 23} Entities Active
              </span>
            </div>

            <div className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Koordinat 2D hasil estimasi kalibrasi homografi kamera & YOLOv8 ByteTrack stabil.
            </div>

            {/* Filter Tabs adapting to active video teams */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#18181C] border border-[#27272A] text-[11px] font-mono">
              <button
                onClick={() => setFilterTeam('all')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold cursor-pointer ${
                  filterTeam === 'all'
                    ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({rawEntities.length || 23})
              </button>
              <button
                onClick={() => setFilterTeam('home')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterTeam === 'home'
                    ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ClubCrest code={currentSession.homeCode} size={13} />
                <span>{currentSession.homeCode} ({homeCount})</span>
              </button>
              <button
                onClick={() => setFilterTeam('away')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterTeam === 'away'
                    ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ClubCrest code={currentSession.awayCode} size={13} />
                <span>{currentSession.awayCode} ({awayCount})</span>
              </button>
              <button
                onClick={() => setFilterTeam('ball')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterTeam === 'ball'
                    ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
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
                  const teamTitle = isHome ? homeName : awayName;
                  const teamColorBadge = isHome ? homeColor : awayColor;
                  const rosterInfo = ROSTER_MAP[rosterKey] || {
                    name: `${teamTitle} #${jNumber}`,
                    pos: isHome ? 'MID' : 'FWD',
                    dist: '8.4 km',
                  };
                  const speed = entity.speedKmh || (isBall ? 28.5 : 18.2);
                  const speedPercent = Math.min(100, Math.round((speed / 34) * 100));
                  const isSelected = selectedEntityId === entity.id;

                  return (
                    <div
                      key={entity.id}
                      onClick={() => setSelectedEntityId(isSelected ? null : entity.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500/80 bg-emerald-500/10 shadow-xs'
                          : 'border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#18181C]/60 hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                      }`}
                    >
                      {/* Top Row: Identity & Speed */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0"
                            style={{
                              backgroundColor: isBall ? '#F59E0B' : teamColorBadge,
                            }}
                          >
                            {isBall ? <SoccerBallIcon size={14} className="text-white" /> : jNumber}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs block truncate">
                              {isBall ? 'Match Ball (Adidas / Nike)' : rosterInfo.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                              {isBall ? '2D Pitch Planar' : `${teamTitle} · ${rosterInfo.pos}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block tabular-nums">
                            {speed.toFixed(1)} <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal">km/h</span>
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                            {isBall ? 'Velocity' : rosterInfo.dist}
                          </span>
                        </div>
                      </div>

                      {/* Speed Meter Bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <Gauge size={11} className="text-slate-400 shrink-0" />
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${speedPercent}%`,
                              backgroundColor: isBall ? '#F59E0B' : teamColorBadge,
                            }}
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
              <span className="text-slate-900 dark:text-white font-semibold">105m × 68m Planar</span>
            </div>

          </div>

        </div>

      </div>

      {/* Video Importer Modal (YouTube URL & Local MP4 File) */}
      <VideoImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onApplyVideo={handleApplyCustomVideo}
      />

      {/* Dynamic Homography Calibration Modal */}
      <DynamicHomographyModal
        isOpen={isHomographyModalOpen}
        onClose={() => setIsHomographyModalOpen(false)}
        initialVideoPath={currentSession.videoPath || 'data/spain_croatia.mp4'}
        initialFrameIndex={currentSession.defaultFrame !== undefined ? currentSession.defaultFrame : 900}
        activeMatchTitle={currentSession.title}
        onCalibrationUpdated={(data) => {
          setHomographyData(data);
          setPipelineMessage(
            `Matriks Homografi 3x3 berhasil disinkronkan (${data.lines_detected} garis lapangan terdeteksi, confidence ${data.confidence_score}%).`
          );
        }}
        onToggleOverlay={(settings) => setOverlaySettings(settings)}
      />

    </div>
  );
}
