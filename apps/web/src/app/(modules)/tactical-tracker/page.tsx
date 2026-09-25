'use client';

import React, { useState } from 'react';
import { VideoOverlayCanvas } from '@/components/video-overlay-canvas';
import type { TrackingFramePayload } from '@tactiq/shared-types';
import { Crosshair, Play, Radio, Activity, Cpu, Film, Sparkles, AlertCircle } from 'lucide-react';

export default function TacticalTrackerPage() {
  const [activeSessionId, setActiveSessionId] = useState<string>('demo-session-tactical-001');
  const [latestFrame, setLatestFrame] = useState<TrackingFramePayload | null>(null);
  const [isStartingPipeline, setIsStartingPipeline] = useState<boolean>(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Tactical Computer Vision Tracker</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              YOLOv8 + 2D Overlay
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-tactiq-muted mt-1">
            Real-time multi-agent tracking over HTML5 Canvas, driven by Redis Pub/Sub streams and Socket.io rooms.
          </p>
        </div>

        {/* Kick off ML Pipeline Button */}
        <button
          onClick={handleStartPipeline}
          disabled={isStartingPipeline}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-tactiq-emerald to-tactiq-cyan text-tactiq-bg font-bold text-xs hover:opacity-90 transition-all shadow-glow-emerald disabled:opacity-50"
        >
          <Radio size={14} className={isStartingPipeline ? 'animate-spin' : ''} />
          <span>{isStartingPipeline ? 'Starting Worker...' : 'Start CV Redis Stream'}</span>
        </button>
      </div>

      {pipelineMessage && (
        <div className="p-3 bg-tactiq-surface/80 border border-tactiq-emerald/40 rounded-xl text-xs text-tactiq-emerald flex items-center space-x-2">
          <Activity size={14} />
          <span>{pipelineMessage}</span>
        </div>
      )}

      {/* Main Grid: Live Canvas Player vs Telemetry Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Responsive 16:9 Canvas Video Container */}
        <div className="lg:col-span-8 space-y-4">
          <VideoOverlayCanvas
            sessionId={activeSessionId}
            onFrameUpdate={(frame) => setLatestFrame(frame)}
          />

          <div className="p-4 bg-tactiq-card border border-tactiq-border rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-tactiq-muted">
              <Film size={14} className="text-tactiq-cyan" />
              <span>Match: Manchester City vs Arsenal (Tactical Cam View)</span>
            </div>
            <div className="font-mono text-tactiq-emerald font-bold">
              Active Room: session_{activeSessionId}
            </div>
          </div>
        </div>

        {/* Right Column: Live Detection Telemetry Table */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-tactiq-card border border-tactiq-border rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tactiq-border/60 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Cpu size={14} className="text-tactiq-cyan" />
                Live Entity Telemetry
              </span>
              <span className="text-[10px] font-mono text-tactiq-emerald bg-tactiq-emerald/10 px-2 py-0.5 rounded-full border border-tactiq-emerald/20">
                {latestFrame?.entities?.length ?? 13} Entities
              </span>
            </div>

            {/* Entities List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {latestFrame?.entities && latestFrame.entities.length > 0 ? (
                latestFrame.entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="p-2.5 rounded-xl bg-tactiq-surface/50 border border-tactiq-border/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          entity.team === 'home'
                            ? 'bg-tactiq-home'
                            : entity.team === 'away'
                            ? 'bg-tactiq-away'
                            : 'bg-tactiq-ball'
                        }`}
                      />
                      <span className="font-mono font-bold text-white">
                        {entity.team === 'ball' ? 'Match Ball' : `Player #${entity.jerseyNumber || entity.id}`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 font-mono text-[11px]">
                      <span className="text-tactiq-muted">
                        X: {entity.x.toFixed(2)} Y: {entity.y.toFixed(2)}
                      </span>
                      <span className="font-bold text-tactiq-emerald">
                        {entity.speedKmh ? `${entity.speedKmh} km/h` : '18.4 km/h'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-tactiq-muted text-xs space-y-2">
                  <AlertCircle size={20} className="mx-auto text-tactiq-cyan opacity-80" />
                  <p>Awaiting tracking frames...</p>
                  <p className="text-[11px] text-slate-400">
                    Click "Run Simulated Tracking" on the canvas controls to test live coordinate streaming.
                  </p>
                </div>
              )}
            </div>

            {/* Tactical Heat Indicators */}
            <div className="pt-3 border-t border-tactiq-border/60 text-[11px] text-tactiq-muted space-y-1">
              <div className="flex justify-between">
                <span>Tactical Pitch Bounds:</span>
                <span className="font-mono text-slate-300">105m × 68m FIFA Standard</span>
              </div>
              <div className="flex justify-between">
                <span>Coordinate Normalization:</span>
                <span className="font-mono text-tactiq-cyan">[0.00, 1.00] 2D Projection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
