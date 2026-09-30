'use client';

import React, { useState } from 'react';
import { X, Trophy, Plus, Sparkles, Check, Globe, Shield, Activity, Flame } from 'lucide-react';
import { ClubCrest } from '@/components/ui/club-crest';

export interface CustomMatchPayload {
  id: string;
  league: string;
  venue: string;
  homeTeam: string;
  homeShort: string;
  homeColor: string;
  awayTeam: string;
  awayShort: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  statusType: 'LIVE' | 'FINISHED' | 'UPCOMING';
  timeOrStatus: string;
  scorersHome: string[];
  scorersAway: string[];
  xgHome: number;
  xgAway: number;
  winProbHome: number;
  winProbDraw: number;
  winProbAway: number;
  isLiveFeed: boolean;
  events?: Array<{ minute: number; team: string; player: string; type: string; detail?: string }>;
  customLineup?: {
    home: any;
    away: any;
  };
}

interface CustomMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMatch: (match: CustomMatchPayload) => void;
}

const SPANISH_PRESET_MATCHES: Array<{
  id: string;
  title: string;
  competition: string;
  venue: string;
  homeTeam: string;
  homeShort: string;
  homeColor: string;
  awayTeam: string;
  awayShort: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  statusType: 'LIVE' | 'FINISHED' | 'UPCOMING';
  timeOrStatus: string;
  scorersHome: string[];
  scorersAway: string[];
  xgHome: number;
  xgAway: number;
  events: Array<{ minute: number; team: string; player: string; type: string; detail?: string }>;
  homeLineup: Array<{ num: number; name: string; pos: string; isCaptain?: boolean; isScorer?: boolean }>;
  awayLineup: Array<{ num: number; name: string; pos: string; isCaptain?: boolean; isScorer?: boolean }>;
}> = [
  {
    id: 'match-esp-eng',
    title: 'Spain vs England (Euro Final / Nations League)',
    competition: 'UEFA Nations League / Euro Championship',
    venue: 'Olympiastadion, Berlin',
    homeTeam: 'Spain',
    homeShort: 'ESP',
    homeColor: '#AA151B',
    awayTeam: 'England',
    awayShort: 'ENG',
    awayColor: '#CE1124',
    homeScore: 2,
    awayScore: 1,
    statusType: 'LIVE',
    timeOrStatus: "88'",
    scorersHome: ["Nico Williams 47'", "Mikel Oyarzabal 86'"],
    scorersAway: ["Cole Palmer 73'"],
    xgHome: 2.15,
    xgAway: 0.95,
    events: [
      { minute: 47, team: 'Spain', player: 'Nico Williams', type: 'Goal', detail: 'Low diagonal strike' },
      { minute: 73, team: 'England', player: 'Cole Palmer', type: 'Goal', detail: 'Long-range curling finish' },
      { minute: 86, team: 'Spain', player: 'Mikel Oyarzabal', type: 'Goal', detail: 'Sliding tap-in' },
    ],
    homeLineup: [
      { num: 23, name: 'Unai Simón', pos: 'GK' },
      { num: 2, name: 'Dani Carvajal', pos: 'RB' },
      { num: 3, name: 'Robin Le Normand', pos: 'CB' },
      { num: 14, name: 'Aymeric Laporte', pos: 'CB' },
      { num: 24, name: 'Marc Cucurella', pos: 'LB' },
      { num: 16, name: 'Rodri Hernández', pos: 'DM', isCaptain: true },
      { num: 8, name: 'Fabián Ruiz', pos: 'CM' },
      { num: 10, name: 'Dani Olmo', pos: 'AM' },
      { num: 19, name: 'Lamine Yamal', pos: 'RW' },
      { num: 17, name: 'Nico Williams', pos: 'LW', isScorer: true },
      { num: 7, name: 'Álvaro Morata', pos: 'CF' },
    ],
    awayLineup: [
      { num: 1, name: 'Jordan Pickford', pos: 'GK' },
      { num: 2, name: 'Kyle Walker', pos: 'RB' },
      { num: 5, name: 'John Stones', pos: 'CB' },
      { num: 6, name: 'Marc Guéhi', pos: 'CB' },
      { num: 3, name: 'Luke Shaw', pos: 'LB' },
      { num: 4, name: 'Declan Rice', pos: 'DM' },
      { num: 26, name: 'Kobbie Mainoo', pos: 'CM' },
      { num: 7, name: 'Bukayo Saka', pos: 'RW' },
      { num: 10, name: 'Jude Bellingham', pos: 'AM' },
      { num: 11, name: 'Phil Foden', pos: 'LW' },
      { num: 9, name: 'Harry Kane', pos: 'CF', isCaptain: true },
    ],
  },
  {
    id: 'match-rma-bar',
    title: 'Real Madrid vs FC Barcelona (El Clásico)',
    competition: 'La Liga EA Sports · El Clásico',
    venue: 'Estadio Santiago Bernabéu, Madrid',
    homeTeam: 'Real Madrid',
    homeShort: 'RMA',
    homeColor: '#EEA320',
    awayTeam: 'Barcelona',
    awayShort: 'BAR',
    awayColor: '#A50044',
    homeScore: 3,
    awayScore: 2,
    statusType: 'LIVE',
    timeOrStatus: "79'",
    scorersHome: ["Vinícius Jr 18' (P)", "Lucas Vázquez 73'", "Jude Bellingham 90'"],
    scorersAway: ["Andreas Christensen 6'", "Fermín López 69'"],
    xgHome: 2.48,
    xgAway: 1.82,
    events: [
      { minute: 6, team: 'Barcelona', player: 'Andreas Christensen', type: 'Goal', detail: 'Header from corner' },
      { minute: 18, team: 'Real Madrid', player: 'Vinícius Jr', type: 'Goal', detail: 'Penalty strike' },
      { minute: 69, team: 'Barcelona', player: 'Fermín López', type: 'Goal', detail: 'Rebound tap-in' },
      { minute: 73, team: 'Real Madrid', player: 'Lucas Vázquez', type: 'Goal', detail: 'Back-post volley' },
    ],
    homeLineup: [
      { num: 13, name: 'Andriy Lunin', pos: 'GK' },
      { num: 17, name: 'Lucas Vázquez', pos: 'RB', isScorer: true },
      { num: 22, name: 'Antonio Rüdiger', pos: 'CB' },
      { num: 18, name: 'Aurélien Tchouaméni', pos: 'CB' },
      { num: 12, name: 'Eduardo Camavinga', pos: 'LB' },
      { num: 15, name: 'Federico Valverde', pos: 'CM' },
      { num: 8, name: 'Toni Kroos', pos: 'CM' },
      { num: 10, name: 'Luka Modrić', pos: 'CM', isCaptain: true },
      { num: 5, name: 'Jude Bellingham', pos: 'AM' },
      { num: 11, name: 'Rodrygo Silva', pos: 'RW' },
      { num: 7, name: 'Vinícius Júnior', pos: 'LW', isScorer: true },
    ],
    awayLineup: [
      { num: 1, name: 'Marc-André ter Stegen', pos: 'GK', isCaptain: true },
      { num: 23, name: 'Jules Koundé', pos: 'RB' },
      { num: 33, name: 'Pau Cubarsí', pos: 'CB' },
      { num: 4, name: 'Ronald Araújo', pos: 'CB' },
      { num: 2, name: 'João Cancelo', pos: 'LB' },
      { num: 15, name: 'Andreas Christensen', pos: 'DM', isScorer: true },
      { num: 21, name: 'Frenkie de Jong', pos: 'CM' },
      { num: 22, name: 'İlkay Gündoğan', pos: 'CM' },
      { num: 27, name: 'Lamine Yamal', pos: 'RW' },
      { num: 11, name: 'Raphinha Dias', pos: 'LW' },
      { num: 9, name: 'Robert Lewandowski', pos: 'CF' },
    ],
  },
  {
    id: 'match-esp-fra',
    title: 'Spain vs France (Euro Semifinal Thriller)',
    competition: 'UEFA European Championship',
    venue: 'Munich Football Arena',
    homeTeam: 'Spain',
    homeShort: 'ESP',
    homeColor: '#AA151B',
    awayTeam: 'France',
    awayShort: 'FRA',
    awayColor: '#002654',
    homeScore: 2,
    awayScore: 1,
    statusType: 'FINISHED',
    timeOrStatus: 'FT Finished',
    scorersHome: ["Lamine Yamal 21'", "Dani Olmo 25'"],
    scorersAway: ["Randal Kolo Muani 9'"],
    xgHome: 1.62,
    xgAway: 1.15,
    events: [
      { minute: 9, team: 'France', player: 'Randal Kolo Muani', type: 'Goal', detail: 'Header from Mbappé cross' },
      { minute: 21, team: 'Spain', player: 'Lamine Yamal', type: 'Goal', detail: 'Spectacular 25-yard curler' },
      { minute: 25, team: 'Spain', player: 'Dani Olmo', type: 'Goal', detail: 'Superb footwork & deflected finish' },
    ],
    homeLineup: [
      { num: 23, name: 'Unai Simón', pos: 'GK' },
      { num: 22, name: 'Jesús Navas', pos: 'RB' },
      { num: 4, name: 'Nacho Fernández', pos: 'CB' },
      { num: 14, name: 'Aymeric Laporte', pos: 'CB' },
      { num: 24, name: 'Marc Cucurella', pos: 'LB' },
      { num: 16, name: 'Rodri Hernández', pos: 'DM' },
      { num: 8, name: 'Fabián Ruiz', pos: 'CM' },
      { num: 10, name: 'Dani Olmo', pos: 'AM', isScorer: true },
      { num: 19, name: 'Lamine Yamal', pos: 'RW', isScorer: true },
      { num: 17, name: 'Nico Williams', pos: 'LW' },
      { num: 7, name: 'Álvaro Morata', pos: 'CF', isCaptain: true },
    ],
    awayLineup: [
      { num: 16, name: 'Mike Maignan', pos: 'GK' },
      { num: 5, name: 'Jules Koundé', pos: 'RB' },
      { num: 4, name: 'Dayot Upamecano', pos: 'CB' },
      { num: 17, name: 'William Saliba', pos: 'CB' },
      { num: 22, name: 'Théo Hernandez', pos: 'LB' },
      { num: 8, name: 'Aurélien Tchouaméni', pos: 'DM' },
      { num: 13, name: 'N\'Golo Kanté', pos: 'CM' },
      { num: 14, name: 'Adrien Rabiot', pos: 'CM' },
      { num: 11, name: 'Ousmane Dembélé', pos: 'RW' },
      { num: 10, name: 'Kylian Mbappé', pos: 'LW', isCaptain: true },
      { num: 12, name: 'Randal Kolo Muani', pos: 'CF', isScorer: true },
    ],
  },
];

export const CustomMatchModal: React.FC<CustomMatchModalProps> = ({
  isOpen,
  onClose,
  onApplyMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Custom Form State
  const [homeTeam, setHomeTeam] = useState('Spain');
  const [homeCode, setHomeCode] = useState('ESP');
  const [homeScore, setHomeScore] = useState<number>(2);
  const [awayTeam, setAwayTeam] = useState('Germany');
  const [awayCode, setAwayCode] = useState('GER');
  const [awayScore, setAwayScore] = useState<number>(1);
  const [competition, setCompetition] = useState('UEFA Nations League · Group Phase');
  const [venue, setVenue] = useState('Estadio de La Cartuja, Sevilla');
  const [statusType, setStatusType] = useState<'LIVE' | 'FINISHED' | 'UPCOMING'>('LIVE');
  const [minuteOrStatus, setMinuteOrStatus] = useState("72'");
  const [scorersHomeStr, setScorersHomeStr] = useState("Dani Olmo 31', Mikel Merino 119'");
  const [scorersAwayStr, setScorersAwayStr] = useState("Florian Wirtz 89'");
  const [xgHome, setXgHome] = useState(2.18);
  const [xgAway, setXgAway] = useState(1.42);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof SPANISH_PRESET_MATCHES[0]) => {
    const totalScore = preset.homeScore + preset.awayScore;
    let pHome = 50;
    let pAway = 30;
    let pDraw = 20;

    if (preset.homeScore > preset.awayScore) {
      pHome = 68;
      pAway = 16;
      pDraw = 16;
    } else if (preset.awayScore > preset.homeScore) {
      pHome = 18;
      pAway = 65;
      pDraw = 17;
    }

    onApplyMatch({
      id: preset.id,
      league: preset.competition,
      venue: preset.venue,
      homeTeam: preset.homeTeam,
      homeShort: preset.homeShort,
      homeColor: preset.homeColor,
      awayTeam: preset.awayTeam,
      awayShort: preset.awayShort,
      awayColor: preset.awayColor,
      homeScore: preset.homeScore,
      awayScore: preset.awayScore,
      statusType: preset.statusType,
      timeOrStatus: preset.timeOrStatus,
      scorersHome: preset.scorersHome,
      scorersAway: preset.scorersAway,
      xgHome: preset.xgHome,
      xgAway: preset.xgAway,
      winProbHome: pHome,
      winProbDraw: pDraw,
      winProbAway: pAway,
      isLiveFeed: true,
      events: preset.events,
      customLineup: {
        home: {
          formation: '4-3-3',
          startXI: preset.homeLineup.map((p, idx) => ({
            id: 100 + idx,
            name: p.name,
            number: p.num,
            pos: p.pos,
            isCaptain: p.isCaptain,
            isScorer: p.isScorer,
            grid: p.pos === 'GK' ? '1:1' : p.pos.includes('B') ? '2:4' : p.pos.includes('M') ? '3:3' : '4:3',
          })),
        },
        away: {
          formation: '4-2-3-1',
          startXI: preset.awayLineup.map((p, idx) => ({
            id: 200 + idx,
            name: p.name,
            number: p.num,
            pos: p.pos,
            isCaptain: p.isCaptain,
            isScorer: p.isScorer,
            grid: p.pos === 'GK' ? '1:1' : p.pos.includes('B') ? '2:4' : p.pos.includes('M') ? '3:3' : '4:3',
          })),
        },
      },
    });
    onClose();
  };

  const handleApplyCustom = () => {
    const sHome = scorersHomeStr.split(',').map((s) => s.trim()).filter(Boolean);
    const sAway = scorersAwayStr.split(',').map((s) => s.trim()).filter(Boolean);

    let pHome = 45;
    let pAway = 35;
    let pDraw = 20;
    if (homeScore > awayScore) {
      pHome = 65;
      pAway = 18;
      pDraw = 17;
    } else if (awayScore > homeScore) {
      pHome = 18;
      pAway = 65;
      pDraw = 17;
    }

    onApplyMatch({
      id: `custom-match-${Date.now()}`,
      league: competition.trim() || 'Custom Football Intelligence Match',
      venue: venue.trim() || 'Custom Stadium',
      homeTeam: homeTeam.trim() || 'Home Team',
      homeShort: homeCode.trim().toUpperCase() || 'HOM',
      homeColor: '#AA151B',
      awayTeam: awayTeam.trim() || 'Away Team',
      awayShort: awayCode.trim().toUpperCase() || 'AWA',
      awayColor: '#034694',
      homeScore,
      awayScore,
      statusType,
      timeOrStatus: minuteOrStatus.trim() || "75'",
      scorersHome: sHome.length > 0 ? sHome : ['–'],
      scorersAway: sAway.length > 0 ? sAway : ['–'],
      xgHome,
      xgAway,
      winProbHome: pHome,
      winProbDraw: pDraw,
      winProbAway: pAway,
      isLiveFeed: true,
      events: [
        ...sHome.map((sc, i) => ({ minute: 20 + i * 25, team: homeTeam, player: sc, type: 'Goal', detail: 'Open Play Goal' })),
        ...sAway.map((sc, i) => ({ minute: 35 + i * 25, team: awayTeam, player: sc, type: 'Goal', detail: 'Fast Break Counter' })),
      ],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A] bg-[#16161A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#CEFF00]/10 border border-[#CEFF00]/30 text-[#CEFF00]">
              <Trophy size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white font-mono flex items-center gap-2">
                <span>Input Match Baru / Laga Spanyol &amp; Internasional</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#CEFF00] text-black font-black uppercase">
                  LIVE HUB
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Pilih laga Spanyol autentik atau input pertandingan sepak bola kustom ke Scoreboard &amp; Live In-Play Ticker.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#27272A] px-5 pt-3 gap-2 bg-[#141418]">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'border-[#CEFF00] text-[#CEFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame size={15} />
            <span>Preset Laga Spanyol &amp; El Clásico</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'border-[#CEFF00] text-[#CEFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plus size={15} />
            <span>Form Input Match Kustom</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {activeTab === 'presets' ? (
            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400 font-mono">
                Pilih salah satu pertandingan Spanyol di bawah ini untuk langsung memuat skor, susunan pemain (*starting XI*), xG, dan *live event* ke Match Center:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {SPANISH_PRESET_MATCHES.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3.5 rounded-xl border border-[#27272A] bg-[#16161A] hover:border-[#CEFF00]/70 hover:bg-[#1a1a20] transition-all cursor-pointer group flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1.5 text-[#CEFF00] font-bold">
                        <Trophy size={12} />
                        <span>{preset.competition}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                        {preset.timeOrStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Home */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs font-mono text-white border border-zinc-700">
                          {preset.homeShort}
                        </div>
                        <div>
                          <span className="text-sm font-extrabold text-white group-hover:text-[#CEFF00] transition-colors">
                            {preset.homeTeam}
                          </span>
                          <span className="block text-[10px] text-zinc-400 font-mono">
                            xG {preset.xgHome}
                          </span>
                        </div>
                      </div>

                      {/* Score Box */}
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 border border-zinc-700 font-mono font-black text-base text-white tabular-nums">
                        <span>{preset.homeScore}</span>
                        <span className="text-zinc-500">—</span>
                        <span>{preset.awayScore}</span>
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-2.5 flex-row-reverse text-right">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs font-mono text-white border border-zinc-700">
                          {preset.awayShort}
                        </div>
                        <div>
                          <span className="text-sm font-extrabold text-white group-hover:text-[#CEFF00] transition-colors">
                            {preset.awayTeam}
                          </span>
                          <span className="block text-[10px] text-zinc-400 font-mono">
                            xG {preset.xgAway}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="truncate max-w-[280px]">
                        🏟️ {preset.venue}
                      </span>
                      <span className="text-[#CEFF00] font-bold group-hover:underline">
                        Pilih &amp; Terapkan Match &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Home Team */}
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#16161A] space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#CEFF00]">
                    Tim Kandang (Home)
                  </span>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Nama Tim</label>
                      <input
                        type="text"
                        value={homeTeam}
                        onChange={(e) => setHomeTeam(e.target.value)}
                        className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 block mb-1">Kode (3 Huruf)</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={homeCode}
                          onChange={(e) => setHomeCode(e.target.value.toUpperCase())}
                          className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#CEFF00] text-center font-bold"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 block mb-1">Skor Home</label>
                        <input
                          type="number"
                          min={0}
                          value={homeScore}
                          onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#CEFF00] text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Away Team */}
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#16161A] space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-sky-400">
                    Tim Tandang (Away)
                  </span>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">Nama Tim</label>
                      <input
                        type="text"
                        value={awayTeam}
                        onChange={(e) => setAwayTeam(e.target.value)}
                        className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#CEFF00]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 block mb-1">Kode (3 Huruf)</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={awayCode}
                          onChange={(e) => setAwayCode(e.target.value.toUpperCase())}
                          className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#CEFF00] text-center font-bold"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 block mb-1">Skor Away</label>
                        <input
                          type="number"
                          min={0}
                          value={awayScore}
                          onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#CEFF00] text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Competition & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                    Nama Liga / Turnamen
                  </label>
                  <input
                    type="text"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    placeholder="misal: La Liga EA Sports atau UEFA Nations League"
                    className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                    Stadion / Venue
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="misal: Santiago Bernabéu atau Camp Nou"
                    className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00]"
                  />
                </div>
              </div>

              {/* Status & Minute */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                    Status Pertandingan
                  </label>
                  <select
                    value={statusType}
                    onChange={(e) => setStatusType(e.target.value as any)}
                    className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00]"
                  >
                    <option value="LIVE">LIVE (Sedang Berlangsung)</option>
                    <option value="FINISHED">FINISHED (Penuh Waktu)</option>
                    <option value="UPCOMING">UPCOMING (Mendatang)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                    Menit / Keterangan Waktu
                  </label>
                  <input
                    type="text"
                    value={minuteOrStatus}
                    onChange={(e) => setMinuteOrStatus(e.target.value)}
                    placeholder="misal: 68' atau FT"
                    className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00]"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                      xG Home
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={xgHome}
                      onChange={(e) => setXgHome(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-2 py-2 outline-none focus:border-[#CEFF00] text-center"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                      xG Away
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={xgAway}
                      onChange={(e) => setXgAway(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-2 py-2 outline-none focus:border-[#CEFF00] text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Scorers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                    Pencetak Gol Home (Pisahkan Koma)
                  </label>
                  <input
                    type="text"
                    value={scorersHomeStr}
                    onChange={(e) => setScorersHomeStr(e.target.value)}
                    placeholder="misal: Lamine Yamal 21', Dani Olmo 25'"
                    className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1 uppercase font-bold">
                    Pencetak Gol Away (Pisahkan Koma)
                  </label>
                  <input
                    type="text"
                    value={scorersAwayStr}
                    onChange={(e) => setScorersAwayStr(e.target.value)}
                    placeholder="misal: Florian Wirtz 89'"
                    className="w-full bg-[#18181C] border border-[#27272A] text-white text-xs font-mono rounded-xl px-3 py-2 outline-none focus:border-[#CEFF00]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#27272A] bg-[#16161A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Batal
          </button>

          {activeTab === 'custom' && (
            <button
              type="button"
              onClick={handleApplyCustom}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CEFF00] hover:bg-[#b8e600] text-black text-xs font-mono font-black shadow-xs shadow-[#CEFF00]/20 transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Simpan &amp; Tampilkan di Match Center</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
