'use client';

import React, { useState, useCallback } from 'react';
import { VideoOverlayCanvas } from '@/components/video-overlay-canvas';
import { TacticalMinimap } from '@/components/tactical-minimap';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';
import type { TrackingFramePayload, TrackingEntity } from '@tactiq/shared-types';
import { Radio, Activity, Gauge, Cpu, AlertCircle, Crosshair } from 'lucide-react';

const ROSTER_MAP: Record<number, { name: string; pos: string; dist: string }> = {
  1: { name: 'David Raya', pos: 'GK', dist: '4.2 km' },
  2: { name: 'William Saliba', pos: 'CB', dist: '7.8 km' },
  6: { name: 'Gabriel Magalhães', pos: 'CB', dist: '7.5 km' },
  4: { name: 'Ben White', pos: 'RB', dist: '8.4 km' },
  41: { name: 'Declan Rice', pos: 'DM', dist: '10.1 km' },
  8: { name: 'Martin Ødegaard', pos: 'AM', dist: '9.8 km' },
  7: { name: 'Bukayo Saka', pos: 'RW', dist: '9.2 km' },
  11: { name: 'Gabriel Martinelli', pos: 'LW', dist: '8.9 km' },
  29: { name: 'Kai Havertz', pos: 'CF', dist: '9.4 km' },
  31: { name: 'Ederson Moraes', pos: 'GK', dist: '3.9 km' },
  3: { name: 'Rúben Dias', pos: 'CB', dist: '7.9 km' },
  25: { name: 'Manuel Akanji', pos: 'CB', dist: '7.7 km' },
  24: { name: 'Joško Gvardiol', pos: 'LB', dist: '8.6 km' },
  16: { name: 'Rodri Cascante', pos: 'DM', dist: '10.4 km' },
  17: { name: 'Kevin De Bruyne', pos: 'AM', dist: '8.8 km' },
  20: { name: 'Bernardo Silva', pos: 'RW', dist: '10.2 km' },
  47: { name: 'Phil Foden', pos: 'LW', dist: '9.1 km' },
  9: { name: 'Erling Haaland', pos: 'ST', dist: '7.4 km' },
};

export default function TacticalTrackerPage() {
  const [activeSessionId] = useState<string>('demo-session-tactical-001');
  const [latestFrame, setLatestFrame] = useState<TrackingFramePayload | null>(null);
  const [isStartingPipeline, setIsStartingPipeline] = useState<boolean>(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [filterTeam, setFilterTeam] = useState<'all' | 'home' | 'away' | 'ball'>('all');

  const handleFrameUpdate = useCallback((frame: TrackingFramePayload) => {
    setLatestFrame(frame);
  }, []);

  // Trigger ML background pipeline
  const handleStartPipeline = async () => {
    setIsStartingPipeline(true);
    setPipelineMessage(null);
    try {
      const res = await fetch('http://localhost:4000/api/v1/tracking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          youtube_url: 'https://www.youtube.com/watch?v=sample_tactical_cam',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPipelineMessage(json.data.message || 'Tracking pipeline triggered via Redis stream!');
      } else {
        throw new Error('Failed to start pipeline');
      }
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
    <div className="w-full flex flex-col gap-6 pb-16">
      
      {/* ── Top Match Pass Header (Matchday Banner) ── */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 sm:p-6 lg:p-7 shadow-xs overflow-hidden transition-colors">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          {/* Match & Room Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <ClubCrest code="ARS" size={44} className="drop-shadow-xs" />
              <div className="flex flex-col items-center px-1.5 sm:px-2">
                <span className="font-mono font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight tabular-nums">2 — 1</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 font-bold whitespace-nowrap">68&apos; LIVE</span>
              </div>
              <ClubCrest code="MCI" size={44} className="drop-shadow-xs" />
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:dark:border-[#27272A] sm:pl-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-zinc-100" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-bold">
                  2D Optical Radar
                </span>
              </div>
              <h1 className="font-extrabold text-lg sm:text-xl lg:text-2xl text-slate-900 dark:text-white tracking-tight mt-0.5">
                Tactical Tracker · Live Radar
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                <LeagueLogo league="Premier League" size={14} />
                <span>Emirates Stadium · Premier League GW08</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartPipeline}
              disabled={isStartingPipeline}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              <Radio size={14} className={isStartingPipeline ? 'animate-spin' : ''} />
              <span>{isStartingPipeline ? 'Connecting...' : 'Connect CV Pipeline'}</span>
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
            sessionId={activeSessionId}
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
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A] px-2.5 py-0.5 rounded">
                {rawEntities.length || 23} Entities Active
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-50 dark:bg-[#18181C] border border-slate-200/80 dark:border-[#27272A] text-[11px] font-mono">
              <button
                onClick={() => setFilterTeam('all')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold ${
                  filterTeam === 'all'
                    ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-300 dark:border-[#27272A] shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({rawEntities.length || 23})
              </button>
              <button
                onClick={() => setFilterTeam('home')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'home'
                    ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-300 dark:border-[#27272A] shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ClubCrest code="ARS" size={13} />
                <span>ARS (11)</span>
              </button>
              <button
                onClick={() => setFilterTeam('away')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'away'
                    ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-300 dark:border-[#27272A] shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ClubCrest code="MCI" size={13} />
                <span>MCI (11)</span>
              </button>
              <button
                onClick={() => setFilterTeam('ball')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'ball'
                    ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-300 dark:border-[#27272A] shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
                  const rosterInfo = ROSTER_MAP[jNumber] || {
                    name: isHome ? `Arsenal Player #${jNumber}` : `Man City Player #${jNumber}`,
                    pos: isHome ? 'MID' : 'FWD',
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
                                ? 'bg-gradient-to-br from-[#EF0107] to-[#BA0C2F]'
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
                              {isBall ? 'Pitch Center' : `${isHome ? 'Arsenal' : 'Man City'} · ${rosterInfo.pos}`}
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
                                ? 'bg-[#EF0107]'
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
              <span className="text-slate-900 dark:text-white font-semibold">Coordinate: [X, Y, Z]</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
