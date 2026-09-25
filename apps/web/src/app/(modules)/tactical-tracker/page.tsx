'use client';

import React, { useState } from 'react';
import { VideoOverlayCanvas } from '@/components/video-overlay-canvas';
import { TacticalMinimap } from '@/components/tactical-minimap';
import type { TrackingFramePayload, TrackingEntity } from '@tactiq/shared-types';
import { Radio, Activity, Film, Cpu, AlertCircle, Gauge, Footprints, Video, Layers, Crosshair } from 'lucide-react';

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
    <div className="w-full flex flex-col gap-8 pb-16">
      
      {/* ── Top Match Pass Header (Concept B Ticket Silhouette & Dual Club Glow) ── */}
      <div className="relative rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg border border-[#222B3D] bg-[#141A24] p-6 lg:p-7 shadow-2xl overflow-hidden">
        {/* Subtle Club Atmospheric Glows (Isolated at edges, zero overlap to prevent purple tint) */}
        <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-[#EF0107]/15 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-[#6CABDD]/15 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Match & Room Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EF0107] to-[#BA0C2F] border border-white/20 flex items-center justify-center font-display font-black text-xs text-white shadow-[0_0_18px_rgba(239,1,7,0.4)]">
                ARS
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="font-display font-black text-2xl text-white tracking-tight tabular-nums">2 — 1</span>
                <span className="text-[10px] font-mono text-[#8E9EB5]">68&apos; LIVE</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6CABDD] to-[#458BB8] border border-white/20 flex items-center justify-center font-display font-black text-xs text-white shadow-[0_0_18px_rgba(108,171,221,0.4)]">
                MCI
              </div>
            </div>

            <div className="border-l border-[#222B3D] pl-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00DF59]" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9EB5]">
                  TACTICAL CV RADAR · HOMOGRAPHY 99.4%
                </span>
              </div>
              <h1 className="font-display font-black text-xl lg:text-2xl text-white uppercase tracking-tight mt-0.5">
                Computer Vision Optical Stream
              </h1>
              <p className="text-xs text-[#8E9EB5] font-mono mt-0.5">
                Emirates Stadium · High-Cam Broadcast (50mm f/2.8) · 29.97 FPS
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartPipeline}
              disabled={isStartingPipeline}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00DF59] hover:bg-[#00C84F] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-[#00DF59]/20 transition-all disabled:opacity-50"
            >
              <Radio size={14} className={isStartingPipeline ? 'animate-spin' : ''} />
              <span>{isStartingPipeline ? 'Starting...' : 'Connect CV Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {pipelineMessage && (
        <div className="p-4 bg-[#141A24] border border-[#222B3D] rounded-2xl text-xs font-mono text-[#00DF59] flex items-center gap-2 shadow-lg">
          <Activity size={14} />
          <span>{pipelineMessage}</span>
        </div>
      )}

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 cols: Video Viewport & Camera Specs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <VideoOverlayCanvas
            sessionId={activeSessionId}
            onFrameUpdate={(frame) => setLatestFrame(frame)}
          />

          {/* Camera Rig & Optical Calibration Banner */}
          <div className="p-5 rounded-2xl border border-[#222B3D] bg-[#141A24] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono shadow-xl">
            <div className="p-3 rounded-xl bg-[#10151E] border border-[#222B3D]/80">
              <span className="text-[10px] text-[#596982] uppercase block">Optical Engine</span>
              <span className="text-white font-bold block mt-1">YOLOv8x-Pose</span>
              <span className="text-[10px] text-[#00DF59] mt-0.5 block">Confidence 94.8%</span>
            </div>

            <div className="p-3 rounded-xl bg-[#10151E] border border-[#222B3D]/80">
              <span className="text-[10px] text-[#596982] uppercase block">Pitch Homography</span>
              <span className="text-white font-bold block mt-1">DLT Normalized</span>
              <span className="text-[10px] text-[#38BDF8] mt-0.5 block">Error: &lt; 0.12m</span>
            </div>

            <div className="p-3 rounded-xl bg-[#10151E] border border-[#222B3D]/80">
              <span className="text-[10px] text-[#596982] uppercase block">Stream Latency</span>
              <span className="text-white font-bold block mt-1">38 ms</span>
              <span className="text-[10px] text-[#00DF59] mt-0.5 block">Zero Frame Drop</span>
            </div>

            <div className="p-3 rounded-xl bg-[#10151E] border border-[#222B3D]/80">
              <span className="text-[10px] text-[#596982] uppercase block">Sensor Room</span>
              <span className="text-white font-bold block mt-1">session_{activeSessionId.slice(-7)}</span>
              <span className="text-[10px] text-[#8E9EB5] mt-0.5 block">Broadcast High-Cam</span>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Planar Minimap & Interactive Entity Registry */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* 2D Minimap Frame */}
          <TacticalMinimap
            entities={latestFrame?.entities}
            selectedEntityId={selectedEntityId}
            onSelectEntity={(id) => setSelectedEntityId(id)}
          />

          {/* Entity Registry Table (Player Telemetry Cards) */}
          <div className="rounded-2xl border border-[#222B3D] bg-[#141A24] p-5 shadow-xl flex flex-col gap-4">
            
            {/* Header & Active Count */}
            <div className="flex items-center justify-between border-b border-[#222B3D] pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-[#8E9EB5]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Tracked Entity Stream
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8E9EB5] bg-[#10151E] border border-[#222B3D] px-2.5 py-0.5 rounded">
                {rawEntities.length || 23} Entities Active
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#10151E] border border-[#222B3D] text-[11px] font-mono">
              <button
                onClick={() => setFilterTeam('all')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold ${
                  filterTeam === 'all'
                    ? 'bg-[#1D2534] text-white border border-[#35425C] shadow-sm'
                    : 'text-[#8E9EB5] hover:text-white'
                }`}
              >
                All ({rawEntities.length || 23})
              </button>
              <button
                onClick={() => setFilterTeam('home')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'home'
                    ? 'bg-[#1D2534] text-white border border-[#35425C] shadow-sm'
                    : 'text-[#8E9EB5] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF0107]" />
                <span>ARS (11)</span>
              </button>
              <button
                onClick={() => setFilterTeam('away')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'away'
                    ? 'bg-[#1D2534] text-white border border-[#35425C] shadow-sm'
                    : 'text-[#8E9EB5] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#6CABDD]" />
                <span>MCI (11)</span>
              </button>
              <button
                onClick={() => setFilterTeam('ball')}
                className={`flex-1 py-1 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1.5 ${
                  filterTeam === 'ball'
                    ? 'bg-[#1D2534] text-white border border-[#35425C] shadow-sm'
                    : 'text-[#8E9EB5] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#00DF59] bg-[#00DF59]/10 shadow-lg shadow-[#00DF59]/5'
                          : 'border-[#222B3D] bg-[#1D2534]/70 hover:bg-[#1D2534] hover:border-[#35425C]'
                      }`}
                    >
                      {/* Top Row: Identity & Speed */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0 ${
                              isBall
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                                : isHome
                                ? 'bg-gradient-to-br from-[#EF0107] to-[#BA0C2F]'
                                : 'bg-gradient-to-br from-[#6CABDD] to-[#458BB8]'
                            }`}
                          >
                            {isBall ? '⚽' : jNumber}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block truncate">
                              {isBall ? 'Nike Flight Match Ball' : rosterInfo.name}
                            </span>
                            <span className="text-[10px] text-[#8E9EB5] block">
                              {isBall ? 'Pitch Center' : `${isHome ? 'Arsenal' : 'Man City'} · ${rosterInfo.pos}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-white block tabular-nums">
                            {speed.toFixed(1)} <span className="text-[10px] text-[#596982]">km/h</span>
                          </span>
                          <span className="text-[10px] text-[#8E9EB5] block">
                            {isBall ? 'In Flight' : rosterInfo.dist}
                          </span>
                        </div>
                      </div>

                      {/* Speed Meter Bar */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <Gauge size={11} className="text-[#596982] shrink-0" />
                        <div className="w-full h-1.5 bg-[#10151E] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isBall
                                ? 'bg-amber-400'
                                : speed > 26
                                ? 'bg-[#F59E0B]'
                                : isHome
                                ? 'bg-[#EF0107]'
                                : 'bg-[#6CABDD]'
                            }`}
                            style={{ width: `${speedPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-[#596982] shrink-0 tabular-nums">
                          {speedPercent}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-[#8E9EB5] font-mono text-xs space-y-2">
                  <AlertCircle size={20} className="mx-auto text-[#00DF59]" />
                  <p className="font-bold text-white">No entities match filter</p>
                  <p className="text-[10px] text-[#596982]">
                    Select another filter tab or trigger the simulation stream.
                  </p>
                </div>
              )}
            </div>

            {/* Technical Calibration Specs Footer */}
            <div className="pt-3 border-t border-[#222B3D] text-[10px] font-mono text-[#8E9EB5] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crosshair size={11} className="text-[#00DF59]" />
                <span>Click player to lock target</span>
              </span>
              <span className="text-white">Coordinate: [X, Y, Z]</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
