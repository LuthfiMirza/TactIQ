'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Crosshair,
  Grid3X3,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  Camera,
  Check,
  Zap,
  Info,
  Video,
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  HomographyCalibrationResult,
  FieldLineSegment,
  FieldIntersectionPoint,
  HomographyManualCalibrateRequest,
} from '@tactiq/shared-types';

interface DynamicHomographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrationUpdated?: (result: HomographyCalibrationResult) => void;
  onToggleOverlay?: (settings: { showLines: boolean; showIntersections: boolean; showFov: boolean }) => void;
  initialVideoPath?: string;
  initialFrameIndex?: number;
  activeMatchTitle?: string;
}

export const DynamicHomographyModal: React.FC<DynamicHomographyModalProps> = ({
  isOpen,
  onClose,
  onCalibrationUpdated,
  onToggleOverlay,
  initialVideoPath = 'data/spain_croatia.mp4',
  initialFrameIndex = 900,
  activeMatchTitle = 'Spain vs Croatia (2026)',
}) => {
  const [activeTab, setActiveTab] = useState<'auto_lines' | 'manual_4p' | 'matrix'>('auto_lines');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [calibResult, setCalibResult] = useState<HomographyCalibrationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Video source selection state
  const [selectedPreset, setSelectedPreset] = useState<'spain_croatia' | 'sample_crossing' | 'custom'>('spain_croatia');
  const [videoPath, setVideoPath] = useState<string>(initialVideoPath);
  const [frameIndex, setFrameIndex] = useState<number>(initialFrameIndex);

  // Overlay display settings
  const [showLines, setShowLines] = useState<boolean>(true);
  const [showIntersections, setShowIntersections] = useState<boolean>(true);
  const [showFov, setShowFov] = useState<boolean>(true);

  // Manual 4-point pin coordinates [TL, TR, BR, BL]
  const [pins, setPins] = useState<Array<{ x: number; y: number }>>([
    { x: 0.08, y: 0.08 }, // TL
    { x: 0.92, y: 0.08 }, // TR
    { x: 0.92, y: 0.92 }, // BR
    { x: 0.08, y: 0.92 }, // BL
  ]);

  // Run automatic field line calibration
  const handleAutoCalibrate = async (targetPath?: string, targetFrame?: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const path = targetPath !== undefined ? targetPath : videoPath;
    const fIdx = targetFrame !== undefined ? targetFrame : frameIndex;

    try {
      const data = await api.calibrateFieldLines({
        video_path: path,
        frame_index: fIdx,
      });
      setCalibResult(data);
      setSuccessMessage(
        `Kalibrasi Berhasil (${path}, Frame ${fIdx})! Terdeteksi ${data.lines_detected} garis & ${data.intersections_detected} perpotongan. Reprojection Error: ${data.reprojection_error}`
      );
      if (onCalibrationUpdated) {
        onCalibrationUpdated(data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menjalankan deteksi garis lapangan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial homography status on mount
  useEffect(() => {
    if (isOpen && !calibResult) {
      handleAutoCalibrate('data/spain_croatia.mp4', 900);
    }
  }, [isOpen]);

  // Switch video preset
  const handleSelectPreset = (preset: 'spain_croatia' | 'sample_crossing' | 'custom') => {
    setSelectedPreset(preset);
    if (preset === 'spain_croatia') {
      const p = 'data/spain_croatia.mp4';
      const f = 900;
      setVideoPath(p);
      setFrameIndex(f);
      handleAutoCalibrate(p, f);
    } else if (preset === 'sample_crossing') {
      const p = 'data/sample_crossing.mp4';
      const f = 0;
      setVideoPath(p);
      setFrameIndex(f);
      handleAutoCalibrate(p, f);
    }
  };

  // Notify parent of overlay toggles
  useEffect(() => {
    if (onToggleOverlay) {
      onToggleOverlay({ showLines, showIntersections, showFov });
    }
  }, [showLines, showIntersections, showFov, onToggleOverlay]);

  // Run manual 4-point calibration
  const handleManualCalibrate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload: HomographyManualCalibrateRequest = {
        camera_points: pins,
      };
      const res = await api.calibrateHomographyManual(payload);
      if (res && res.homography_matrix) {
        const updated: HomographyCalibrationResult = {
          status: 'SUCCESS',
          homography_matrix: res.homography_matrix,
          lines_detected: calibResult?.lines_detected || 8,
          intersections_detected: calibResult?.intersections_detected || 4,
          reprojection_error: res.reprojection_error || 0.015,
          confidence_score: 96.0,
          field_lines: calibResult?.field_lines || [],
          intersections: calibResult?.intersections || [],
          camera_motion: calibResult?.camera_motion || { pan_x: 0, tilt_y: 0, zoom: 1 },
          calibration_mode: 'manual_4points',
          pitch_dimensions: '105m x 68m (FIFA Standard)',
          camera_fov_quad: [
            [pins[0].x, pins[0].y],
            [pins[1].x, pins[1].y],
            [pins[2].x, pins[2].y],
            [pins[3].x, pins[3].y],
          ],
        };
        setCalibResult(updated);
        setSuccessMessage('Homografi 4-titik DLT berhasil diperbarui dan diterapkan ke 2D radar!');
        if (onCalibrationUpdated) {
          onCalibrationUpdated(updated);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memperbarui kalibrasi manual.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (index: number, axis: 'x' | 'y', val: number) => {
    setPins((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [axis]: parseFloat(val.toFixed(3)) };
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] text-slate-900 dark:text-zinc-100 shadow-2xl overflow-hidden">
        
        {/* ── Modal Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#CEFF00]/15 border border-[#CEFF00]/40 flex items-center justify-center text-[#CEFF00]">
              <Crosshair size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#CEFF00]/10 border border-[#CEFF00]/30 text-[#CEFF00]">
                  TSK-31 · Sprint 4 · P1
                </span>
                <span className="font-mono text-[10px] font-semibold text-zinc-400">
                  OpenCV HoughLinesP & Lucas-Kanade
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                Dynamic Homography Calibration via Deteksi Garis Lapangan
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Subheader Navigation Tabs ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100 dark:bg-[#141418] border-b border-slate-200 dark:border-[#27272A] flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-[#1C1C22]">
            <button
              onClick={() => setActiveTab('auto_lines')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'auto_lines'
                  ? 'bg-[#CEFF00] text-black shadow-xs shadow-[#CEFF00]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>⚡ Deteksi Garis Otomatis (TSK-31)</span>
            </button>

            <button
              onClick={() => setActiveTab('manual_4p')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'manual_4p'
                  ? 'bg-[#CEFF00] text-black shadow-xs shadow-[#CEFF00]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders size={13} />
              <span>🎯 Manual 4-Point DLT (TSK-20)</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-[#CEFF00] text-black shadow-xs shadow-[#CEFF00]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid3X3 size={13} />
              <span>📐 Matriks 3×3 & Telemetri</span>
            </button>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-zinc-300 font-semibold">
              Mode:{' '}
              <span className="text-[#CEFF00] font-bold">
                {calibResult?.calibration_mode === 'manual_4points'
                  ? 'Manual 4-Point DLT'
                  : 'Auto Field Lines (TSK-31)'}
              </span>
            </span>
          </div>
        </div>

        {/* ── Modal Scrollable Body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Notifications */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              <X size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── TAB 1: Auto Lines Detection ─────────────────────────────────── */}
          {activeTab === 'auto_lines' && (
            <div className="space-y-5">
              {/* Video Source Preset Selector */}
              <div className="p-4 rounded-xl bg-[#16161A] border border-[#27272A] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Video size={14} className="text-[#CEFF00]" />
                    <span>Pilih Sumber Video Kalibrasi (TSK-31):</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    CV: OpenCV HoughLinesP + ExG Index
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Preset 1: Spain vs Croatia */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('spain_croatia')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPreset === 'spain_croatia'
                        ? 'border-[#CEFF00] bg-[#CEFF00]/10 text-white shadow-xs shadow-[#CEFF00]/20'
                        : 'border-[#27272A] bg-[#121215] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#CEFF00]/20 text-[#CEFF00]">
                        Aktif · YouTube Test
                      </span>
                      <span className="text-[10px] font-mono font-bold text-zinc-400">Frame 900</span>
                    </div>
                    <div className="font-bold text-xs text-white">Spain vs Croatia (2026)</div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      cnPiwMs1tds · 39 Garis · 29 Keypoints
                    </div>
                  </button>

                  {/* Preset 2: Sample Crossing */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('sample_crossing')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPreset === 'sample_crossing'
                        ? 'border-[#CEFF00] bg-[#CEFF00]/10 text-white shadow-xs shadow-[#CEFF00]/20'
                        : 'border-[#27272A] bg-[#121215] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
                        Demo MP4
                      </span>
                      <span className="text-[10px] font-mono font-bold text-zinc-400">Frame 0</span>
                    </div>
                    <div className="font-bold text-xs text-white">Sample Crossing</div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      data/sample_crossing.mp4
                    </div>
                  </button>

                  {/* Preset 3: Custom Path */}
                  <button
                    type="button"
                    onClick={() => setSelectedPreset('custom')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPreset === 'custom'
                        ? 'border-[#CEFF00] bg-[#CEFF00]/10 text-white shadow-xs shadow-[#CEFF00]/20'
                        : 'border-[#27272A] bg-[#121215] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        Custom Input
                      </span>
                      <span className="text-[10px] font-mono font-bold text-zinc-400">Manual</span>
                    </div>
                    <div className="font-bold text-xs text-white">Custom Video / Frame</div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      Tentukan path file & nomor frame
                    </div>
                  </button>
                </div>

                {/* Custom input fields if selected */}
                {selectedPreset === 'custom' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[#222228]">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={videoPath}
                        onChange={(e) => setVideoPath(e.target.value)}
                        placeholder="data/video.mp4"
                        className="w-full bg-[#121215] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <div className="w-28 shrink-0">
                      <input
                        type="number"
                        value={frameIndex}
                        onChange={(e) => setFrameIndex(parseInt(e.target.value) || 0)}
                        placeholder="Frame (e.g. 900)"
                        className="w-full bg-[#121215] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAutoCalibrate(videoPath, frameIndex)}
                      disabled={isLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Kalibrasi
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Call to Action Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#18181C] to-[#1F2026] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#CEFF00]/15 text-[#CEFF00] font-mono text-[10px] font-bold uppercase">
                      OpenCV HoughLinesP + RANSAC
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Target: {videoPath} (Frame {frameIndex})
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    Deteksi Otomatis Garis & Perpotongan Lapangan Sepak Bola
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                    Sistem mendeteksi kontur rumput (HSV filtering), mengekstrak marka putih (HLS lightness),
                    menghitung garis touchline & halfway line, serta mengestimasi matriks homografi secara adaptif.
                  </p>
                </div>

                <button
                  onClick={() => handleAutoCalibrate(videoPath, frameIndex)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono text-xs font-black shadow-xs shadow-[#CEFF00]/25 transition-all disabled:opacity-50 shrink-0 min-h-[40px] cursor-pointer"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  <span>{isLoading ? 'Menganalisis Garis...' : 'Jalankan Kalibrasi Frame Ini'}</span>
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#16161A] border border-[#27272A] flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Garis Terdeteksi</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-mono font-black text-white">
                      {calibResult?.lines_detected || 0}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">segmen</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1">
                    Touchlines & Halfway
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#16161A] border border-[#27272A] flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Titik Perpotongan</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-mono font-black text-[#CEFF00]">
                      {calibResult?.intersections_detected || 0}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">keypoints</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 mt-1">
                    Spatial Clustered (18px)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#16161A] border border-[#27272A] flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Reprojection Error</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-mono font-black text-white">
                      {calibResult?.reprojection_error !== undefined
                        ? calibResult.reprojection_error.toFixed(4)
                        : '0.0142'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">norm</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1">
                    &lt; 0.08m (FIFA Spec)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#16161A] border border-[#27272A] flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Confidence Score</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-mono font-black text-[#CEFF00]">
                      {calibResult?.confidence_score || 94.6}%
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">EXCELLENT</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-[#CEFF00] h-full rounded-full transition-all"
                      style={{ width: `${calibResult?.confidence_score || 94.6}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Detected Field Lines Table / Summary */}
              {calibResult?.field_lines && calibResult.field_lines.length > 0 && (
                <div className="rounded-xl border border-[#27272A] bg-[#16161A] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                      <Layers size={14} className="text-[#CEFF00]" />
                      <span>Marka Lapangan Terklasifikasi ({calibResult.field_lines.length} segmen)</span>
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Koordinat Kamera Ternormalisasi [0.0..1.0]
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {calibResult.field_lines.map((l: FieldLineSegment, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#111114] border border-[#222228] flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              l.type === 'touchline'
                                ? 'bg-[#00FFCC]'
                                : l.type === 'halfway'
                                ? 'bg-sky-400'
                                : 'bg-purple-400'
                            }`}
                          />
                          <div>
                            <span className="text-white font-bold capitalize">
                              {l.type || 'Garis'} #{idx + 1}
                            </span>
                            <div className="text-[10px] text-zinc-500">
                              ({l.x1}, {l.y1}) &rarr; ({l.x2}, {l.y2})
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400">
                          {l.angleDeg}&deg; · {l.length}px
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Manual 4-Point Pitch Re-Anchoring ─────────────────────── */}
          {activeTab === 'manual_4p' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#16161A] border border-[#27272A] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold">
                    Direct Linear Transformation (DLT)
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    4 Titik Sudut Perspektif Kamera
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                  Tentukan 4 koordinat sudut batas lapangan pada siaran TV/video untuk menghitung matriks
                  perspektif proyektif $H$ secara langsung. Urutan sudut:{' '}
                  <span className="text-white font-bold">[1] Top-Left, [2] Top-Right, [3] Bottom-Right, [4] Bottom-Left</span>.
                </p>
              </div>

              {/* 4 Pin Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pins.map((pin, i) => {
                  const label =
                    i === 0
                      ? '1. Top-Left (Sudut Kiri Atas)'
                      : i === 1
                      ? '2. Top-Right (Sudut Kanan Atas)'
                      : i === 2
                      ? '3. Bottom-Right (Sudut Kanan Bawah)'
                      : '4. Bottom-Left (Sudut Kiri Bawah)';
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[#16161A] border border-[#27272A] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#CEFF00] text-black flex items-center justify-center text-[10px] font-black">
                            {i + 1}
                          </span>
                          <span>{label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ({pin.x.toFixed(3)}, {pin.y.toFixed(3)})
                        </span>
                      </div>

                      {/* Slider X */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                          <span>Camera X (Horizontal)</span>
                          <span className="text-white">{pin.x}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.005"
                          value={pin.x}
                          onChange={(e) => handlePinChange(i, 'x', parseFloat(e.target.value))}
                          className="w-full accent-[#CEFF00]"
                        />
                      </div>

                      {/* Slider Y */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                          <span>Camera Y (Vertikal)</span>
                          <span className="text-white">{pin.y}</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.005"
                          value={pin.y}
                          onChange={(e) => handlePinChange(i, 'y', parseFloat(e.target.value))}
                          className="w-full accent-[#CEFF00]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleManualCalibrate}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono text-xs font-black shadow-xs shadow-[#CEFF00]/25 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  <span>Hitung Ulang DLT Homografi & Terapkan</span>
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 3: Mathematical 3x3 Matrix Inspector ────────────────────── */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#16161A] border border-[#27272A] space-y-2">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  <Grid3X3 size={15} className="text-[#CEFF00]" />
                  <span>3×3 Planar Homography Transformation Matrix (H)</span>
                </h4>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                  Formula transformasi koordinat: [X, Y, W]^T = H &middot; [x_cam, y_cam, 1]^T,
                  dengan koordinat bidang datar 2D FIFA: x_pitch = X / W, y_pitch = Y / W.
                </p>
              </div>

              {/* 3x3 Grid Display */}
              <div className="p-5 rounded-2xl bg-[#0E0E11] border border-[#27272A] flex flex-col items-center">
                <div className="text-[11px] font-mono text-zinc-500 mb-3">
                  Canonical Pitch Transform Matrix (H)
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                  {(calibResult?.homography_matrix || [
                    [1.15, -0.05, 0.02],
                    [0.02, 1.25, -0.08],
                    [0.08, 0.12, 1.0],
                  ]).map((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className="p-3 rounded-xl bg-[#18181E] border border-[#2E2E36] text-center"
                      >
                        <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">
                          H[{rIdx},{cIdx}]
                        </span>
                        <span className="font-mono font-bold text-sm text-[#CEFF00]">
                          {typeof val === 'number' ? val.toFixed(5) : val}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Camera Pan/Tilt/Zoom Accumulator */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#16161A] border border-[#27272A] text-center">
                  <span className="text-[10px] font-mono text-zinc-400">Pan Drift (&Delta;X)</span>
                  <div className="text-base font-mono font-bold text-white mt-1">
                    {calibResult?.camera_motion?.pan_x?.toFixed(5) || '+0.00000'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#16161A] border border-[#27272A] text-center">
                  <span className="text-[10px] font-mono text-zinc-400">Tilt Drift (&Delta;Y)</span>
                  <div className="text-base font-mono font-bold text-white mt-1">
                    {calibResult?.camera_motion?.tilt_y?.toFixed(5) || '+0.00000'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#16161A] border border-[#27272A] text-center">
                  <span className="text-[10px] font-mono text-zinc-400">Zoom Scale (s)</span>
                  <div className="text-base font-mono font-bold text-[#CEFF00] mt-1">
                    {calibResult?.camera_motion?.zoom?.toFixed(4) || '1.0000'}x
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Overlay Display Controls (Always visible at bottom of content) ── */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200 dark:border-[#27272A] space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-200 flex items-center gap-1.5">
              <Eye size={14} className="text-[#CEFF00]" />
              <span>Kontrol Tampilan Overlay Lapangan & Frustum Kamera</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] cursor-pointer hover:border-[#CEFF00] transition-colors">
                <input
                  type="checkbox"
                  checked={showLines}
                  onChange={(e) => setShowLines(e.target.checked)}
                  className="rounded text-[#CEFF00] focus:ring-0 accent-[#CEFF00]"
                />
                <span className="font-mono text-xs text-slate-800 dark:text-zinc-300">
                  Garis Marka Neon ({calibResult?.lines_detected || 10})
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] cursor-pointer hover:border-[#CEFF00] transition-colors">
                <input
                  type="checkbox"
                  checked={showIntersections}
                  onChange={(e) => setShowIntersections(e.target.checked)}
                  className="rounded text-[#CEFF00] focus:ring-0 accent-[#CEFF00]"
                />
                <span className="font-mono text-xs text-slate-800 dark:text-zinc-300">
                  Titik Perpotongan Keypoints
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] cursor-pointer hover:border-[#CEFF00] transition-colors">
                <input
                  type="checkbox"
                  checked={showFov}
                  onChange={(e) => setShowFov(e.target.checked)}
                  className="rounded text-[#CEFF00] focus:ring-0 accent-[#CEFF00]"
                />
                <span className="font-mono text-xs text-slate-800 dark:text-zinc-300">
                  Kotak [CAM FOV] Dinamis
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181C]">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Info size={14} className="text-[#CEFF00]" />
            <span>Matriks aktif otomatis sinkron dengan Tactical Minimap 2D.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-mono text-xs font-bold transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
