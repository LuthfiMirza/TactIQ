'use client';

import React, { useState, useRef } from 'react';
import { X, Youtube, Upload, Film, CheckCircle2, AlertCircle, Sparkles, Play, ShieldAlert } from 'lucide-react';

export interface CustomVideoSessionConfig {
  id: string;
  title: string;
  competition: string;
  venue: string;
  homeCode: string;
  awayCode: string;
  score: string;
  statusBadge: string;
  youtubeUrl?: string;
  videoSrc?: string;
  sourceType: 'youtube' | 'local_file';
}

interface VideoImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVideo: (config: CustomVideoSessionConfig) => void;
}

const PRESET_MATCHES = [
  {
    title: 'Man City vs Arsenal (Tactical Pressing)',
    competition: 'Premier League',
    url: 'https://www.youtube.com/watch?v=z4B7hN5sE_s',
    home: 'MCI',
    away: 'ARS',
  },
  {
    title: 'Real Madrid vs Barcelona (El Clásico)',
    competition: 'La Liga',
    url: 'https://www.youtube.com/watch?v=6i2q6ZqjR4w',
    home: 'RMA',
    away: 'FCB',
  },
  {
    title: 'Liverpool vs Leverkusen (Turnover Gegenpress)',
    competition: 'UEFA Champions League',
    url: 'https://www.youtube.com/watch?v=8v_5w3K5zqk',
    home: 'LIV',
    away: 'B04',
  },
];

/**
 * Normalizes any YouTube URL variant into an autoplaying embedded iframe URL
 */
export function formatYouTubeEmbedUrl(inputUrl: string): { embedUrl: string; videoId: string | null } {
  const trimmed = inputUrl.trim();
  let videoId: string | null = null;

  if (trimmed.includes('watch?v=')) {
    videoId = trimmed.split('watch?v=')[1]?.split('&')[0]?.split('#')[0] || null;
  } else if (trimmed.includes('youtu.be/')) {
    videoId = trimmed.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || null;
  } else if (trimmed.includes('youtube.com/shorts/')) {
    videoId = trimmed.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('&')[0] || null;
  } else if (trimmed.includes('youtube.com/embed/')) {
    videoId = trimmed.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0] || null;
  }

  if (!videoId || videoId.length < 5) {
    return { embedUrl: '', videoId: null };
  }

  // Construct optimized embed URL (mute & autoplay ensures seamless canvas overlay)
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${videoId}&rel=0`;
  return { embedUrl, videoId };
}

export const VideoImporterModal: React.FC<VideoImporterModalProps> = ({
  isOpen,
  onClose,
  onApplyVideo,
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'local'>('youtube');
  const [youtubeInput, setYoutubeInput] = useState<string>('https://www.youtube.com/watch?v=z4B7hN5sE_s');
  const [matchTitle, setMatchTitle] = useState<string>('Custom Tactical Match Analysis');
  const [homeTeam, setHomeTeam] = useState<string>('MCI');
  const [awayTeam, setAwayTeam] = useState<string>('ARS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localVideoPreviewUrl, setLocalVideoPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const { embedUrl, videoId } = formatYouTubeEmbedUrl(youtubeInput);
  const isValidYouTube = Boolean(videoId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMessage('File harus berupa video (MP4 atau WebM).');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      const blobUrl = URL.createObjectURL(file);
      setLocalVideoPreviewUrl(blobUrl);
      if (matchTitle === 'Custom Tactical Match Analysis') {
        setMatchTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_MATCHES[0]) => {
    setYoutubeInput(preset.url);
    setMatchTitle(preset.title);
    setHomeTeam(preset.home);
    setAwayTeam(preset.away);
    setErrorMessage(null);
  };

  const handleApply = () => {
    setErrorMessage(null);

    if (activeTab === 'youtube') {
      if (!isValidYouTube) {
        setErrorMessage('Format URL YouTube tidak valid. Pastikan link berisi video ID yang benar.');
        return;
      }

      onApplyVideo({
        id: `custom-yt-${Date.now()}`,
        title: matchTitle.trim() || 'Custom YouTube Tactical Match',
        competition: 'Custom Broadcast Video',
        venue: 'Video Intelligence Stream',
        homeCode: homeTeam.toUpperCase().trim() || 'HOM',
        awayCode: awayTeam.toUpperCase().trim() || 'AWA',
        score: '0 — 0',
        statusBadge: 'YOUTUBE SYNC',
        youtubeUrl: embedUrl,
        sourceType: 'youtube',
      });
      onClose();
    } else {
      if (!selectedFile || !localVideoPreviewUrl) {
        setErrorMessage('Pilih file video MP4 atau WebM dari perangkat Anda terlebih dahulu.');
        return;
      }

      onApplyVideo({
        id: `custom-local-${Date.now()}`,
        title: matchTitle.trim() || selectedFile.name,
        competition: 'Local File Stream',
        venue: 'Direct Client Video',
        homeCode: homeTeam.toUpperCase().trim() || 'HOM',
        awayCode: awayTeam.toUpperCase().trim() || 'AWA',
        score: '0 — 0',
        statusBadge: 'LOCAL MP4',
        videoSrc: localVideoPreviewUrl,
        sourceType: 'local_file',
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#16161A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#CEFF00]/10 border border-[#CEFF00]/30 text-[#CEFF00]">
              <Film size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white font-mono flex items-center gap-2">
                <span>Input Video / URL Match Tracker</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#CEFF00] text-black font-black uppercase">
                  YOLOv8 + FOV
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Pilih link YouTube atau file MP4 lokal untuk dianalisis bersamaan dengan radar 2D.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tactical Guidance Callout */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <p className="font-bold text-[11px]">
              Mengapa video siaran YouTube hanya menyorot bola sedangkan radar menampilkan seluruh lapangan?
            </p>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Kamera siaran TV (YouTube) menggunakan sudut pandang miring <em>(dynamic pan-tilt-zoom)</em> yang hanya menangkap area ~30×20m di sekitar bola. TactIQ menggunakan <strong>Homografi &amp; Cam FOV Box</strong> di radar 2D untuk memproyeksikan area video ke dalam keseluruhan 105×68m lapangan.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#27272A] px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold border-b-2 transition-all ${
              activeTab === 'youtube'
                ? 'border-[#CEFF00] text-[#CEFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Youtube size={15} />
            <span>YouTube Match Highlight</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold border-b-2 transition-all ${
              activeTab === 'local'
                ? 'border-[#CEFF00] text-[#CEFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload size={15} />
            <span>Upload File Video Lokal (MP4)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {activeTab === 'youtube' ? (
            <div className="space-y-4">
              {/* YouTube Input Field */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-300 font-bold mb-1.5 uppercase">
                  Paste URL YouTube Video / Shorts / Highlight
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={youtubeInput}
                    onChange={(e) => {
                      setYoutubeInput(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                    className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3.5 py-2.5 outline-none focus:border-[#CEFF00] transition-colors pr-24"
                  />
                  {isValidYouTube && (
                    <span className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                      <CheckCircle2 size={13} />
                      <span>Valid Video</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  Format didukung: <code>watch?v=...</code>, <code>youtu.be/...</code>, atau <code>shorts/...</code> (otomatis diubah ke format embed).
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[10px] font-mono text-zinc-400 font-bold uppercase mb-2">
                  Atau Pilih Contoh Cuplikan Taktis:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_MATCHES.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-2.5 rounded-xl bg-[#16161A] border border-[#27272A] hover:border-[#CEFF00]/60 text-left transition-colors group"
                    >
                      <span className="block text-[11px] font-bold text-zinc-200 group-hover:text-[#CEFF00] truncate">
                        {preset.title}
                      </span>
                      <span className="block text-[9px] font-mono text-zinc-500">
                        {preset.competition}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Embed (if valid) */}
              {isValidYouTube && (
                <div className="rounded-xl overflow-hidden border border-[#27272A] bg-black aspect-video relative max-h-48">
                  <iframe
                    src={embedUrl}
                    title="YouTube Preview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Local File Picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#27272A] hover:border-[#CEFF00]/70 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#16161A]/50 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-[#CEFF00] group-hover:bg-[#CEFF00]/10 transition-colors">
                  <Upload size={22} />
                </div>
                <p className="text-xs font-bold text-zinc-200">
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih file video MP4 / WebM'}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  Video dimuat langsung di browser via HTML5 Blob (100% cepat tanpa perlu proses upload server).
                </p>
              </div>

              {/* Local Video Preview */}
              {localVideoPreviewUrl && (
                <div className="rounded-xl overflow-hidden border border-[#27272A] bg-black aspect-video relative max-h-48">
                  <video
                    src={localVideoPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Match Details Configuration */}
          <div className="pt-2 border-t border-[#27272A] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-zinc-400 uppercase font-bold mb-1">
                Judul Analisis Pertandingan
              </label>
              <input
                type="text"
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00]"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase font-bold mb-1">
                  Home Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00] uppercase text-center"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase font-bold mb-1">
                  Away Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00] uppercase text-center"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#27272A] bg-[#16161A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e600] text-black text-xs font-mono font-black shadow-xs shadow-[#CEFF00]/20 transition-all cursor-pointer"
          >
            <Play size={14} />
            <span>Terapkan &amp; Jalankan Tracker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
