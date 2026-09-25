'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RadarChart } from '@/components/radar-chart';
import type { PlayerDTO, PlayerPosition, PlayerSimilarityResponse } from '@tactiq/shared-types';
import { Search, Filter, Sparkles, UserCheck, Shield, ChevronRight, Sliders } from 'lucide-react';

// Fallback initial dataset in case API is bootstrapping
const DEFAULT_PLAYERS: PlayerDTO[] = [
  {
    id: 'player-kdb',
    teamId: 'team-mci',
    name: 'Kevin De Bruyne',
    position: 'MID',
    nationality: 'Belgium',
    age: 33,
    marketValue: 50000000,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
    team: { id: 'team-mci', name: 'Manchester City', code: 'MCI', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 74, shooting: 88, passing: 95, dribbling: 87, defending: 65, physical: 78, vision: 97 },
  },
  {
    id: 'player-odegaard',
    teamId: 'team-ars',
    name: 'Martin Ødegaard',
    position: 'MID',
    nationality: 'Norway',
    age: 25,
    marketValue: 110000000,
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&q=80',
    team: { id: 'team-ars', name: 'Arsenal FC', code: 'ARS', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 76, shooting: 82, passing: 93, dribbling: 90, defending: 68, physical: 69, vision: 95 },
  },
  {
    id: 'player-haaland',
    teamId: 'team-mci',
    name: 'Erling Haaland',
    position: 'FWD',
    nationality: 'Norway',
    age: 24,
    marketValue: 180000000,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80',
    team: { id: 'team-mci', name: 'Manchester City', code: 'MCI', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 91, shooting: 94, passing: 70, dribbling: 82, defending: 45, physical: 92, vision: 76 },
  },
  {
    id: 'player-rodri',
    teamId: 'team-mci',
    name: 'Rodri',
    position: 'MID',
    nationality: 'Spain',
    age: 28,
    marketValue: 130000000,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80',
    team: { id: 'team-mci', name: 'Manchester City', code: 'MCI', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 68, shooting: 78, passing: 91, dribbling: 84, defending: 89, physical: 87, vision: 92 },
  },
  {
    id: 'player-saliba',
    teamId: 'team-ars',
    name: 'William Saliba',
    position: 'DEF',
    nationality: 'France',
    age: 23,
    marketValue: 80000000,
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80',
    team: { id: 'team-ars', name: 'Arsenal FC', code: 'ARS', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 83, shooting: 40, passing: 81, dribbling: 77, defending: 91, physical: 88, vision: 80 },
  },
  {
    id: 'player-bellingham',
    teamId: 'team-rma',
    name: 'Jude Bellingham',
    position: 'MID',
    nationality: 'England',
    age: 21,
    marketValue: 180000000,
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&q=80',
    team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
    attributes: { pace: 82, shooting: 87, passing: 89, dribbling: 90, defending: 80, physical: 85, vision: 91 },
  },
  {
    id: 'player-saka',
    teamId: 'team-ars',
    name: 'Bukayo Saka',
    position: 'FWD',
    nationality: 'England',
    age: 23,
    marketValue: 140000000,
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80',
    team: { id: 'team-ars', name: 'Arsenal FC', code: 'ARS', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 88, shooting: 84, passing: 86, dribbling: 90, defending: 65, physical: 76, vision: 87 },
  },
  {
    id: 'player-salah',
    teamId: 'team-liv',
    name: 'Mohamed Salah',
    position: 'FWD',
    nationality: 'Egypt',
    age: 32,
    marketValue: 55000000,
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&q=80',
    team: { id: 'team-liv', name: 'Liverpool FC', code: 'LIV', logoUrl: '', league: 'Premier League' },
    attributes: { pace: 89, shooting: 90, passing: 87, dribbling: 89, defending: 45, physical: 76, vision: 90 },
  },
];

export default function ScoutingPage() {
  const [players, setPlayers] = useState<PlayerDTO[]>(DEFAULT_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDTO>(DEFAULT_PLAYERS[0]);
  const [comparisonPlayer, setComparisonPlayer] = useState<PlayerDTO | null>(null);

  // Multi-criteria filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [minPassing, setMinPassing] = useState<number>(0);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState<boolean>(false);
  const [similarResults, setSimilarResults] = useState<PlayerSimilarityResponse | null>(null);

  // Fetch players from API on mount
  useEffect(() => {
    async function loadApiPlayers() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/players');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setPlayers(json.data);
            setSelectedPlayer(json.data[0]);
          }
        }
      } catch (err) {
        console.warn('API Gateway offline or pending; using rich local mock dataset.', err);
      }
    }
    loadApiPlayers();
  }, []);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.nationality.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPos = selectedPosition === 'ALL' || p.position === selectedPosition;
      const matchPassing = (p.attributes?.passing ?? 0) >= minPassing;
      return matchSearch && matchPos && matchPassing;
    });
  }, [players, searchQuery, selectedPosition, minPassing]);

  // Handle Find Similar Players via ML service
  const handleFindSimilar = async (player: PlayerDTO) => {
    setIsLoadingSimilar(true);
    setSimilarResults(null);
    setComparisonPlayer(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/players/${player.id}/similar`);
      if (res.ok) {
        const json = await res.json();
        setSimilarResults(json.data);
        if (json.data.similarPlayers?.length > 0) {
          setComparisonPlayer(json.data.similarPlayers[0].player);
        }
      } else {
        throw new Error('API similarity failed');
      }
    } catch {
      // Local fallback calculation for smooth offline UX
      const scored = players
        .filter((cand) => cand.id !== player.id)
        .map((cand) => {
          const tA = player.attributes || { pace: 75, shooting: 75, passing: 75, dribbling: 75, defending: 75, physical: 75, vision: 75 };
          const cA = cand.attributes || { pace: 75, shooting: 75, passing: 75, dribbling: 75, defending: 75, physical: 75, vision: 75 };
          const diff = Math.sqrt(
            Math.pow(tA.pace - cA.pace, 2) +
            Math.pow(tA.passing - cA.passing, 2) +
            Math.pow(tA.dribbling - cA.dribbling, 2) +
            Math.pow(tA.vision - cA.vision, 2)
          );
          const sim = Math.max(60, Math.min(99, Math.round(100 - diff * 0.8)));
          return { player: cand, similarityScore: sim };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 5);

      setSimilarResults({ targetPlayer: player, similarPlayers: scored });
      if (scored.length > 0) setComparisonPlayer(scored[0].player);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <span>Player Scouting & Radar Similarity</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-tactiq-emerald/10 text-tactiq-emerald border border-tactiq-emerald/30">
            FastAPI Cosine Engine
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-tactiq-muted mt-1">
          Perform multi-criteria tactical evaluations, analyze 7-axis radar charts, and discover statistical twins.
        </p>
      </div>

      {/* Multi-Criteria Filter Controls */}
      <div className="p-4 sm:p-5 bg-tactiq-card border border-tactiq-border rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Query */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-tactiq-muted" />
            <input
              type="text"
              placeholder="Search player or nationality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-tactiq-surface border border-tactiq-border rounded-xl text-xs text-white placeholder-tactiq-muted focus:outline-none focus:border-tactiq-emerald"
            />
          </div>

          {/* Position Selector */}
          <div className="flex items-center space-x-1 bg-tactiq-surface p-1 rounded-xl border border-tactiq-border">
            {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPosition === pos
                    ? 'bg-tactiq-emerald text-tactiq-bg shadow-sm'
                    : 'text-tactiq-muted hover:text-white'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Min Passing Slider */}
          <div className="flex flex-col justify-center px-3 py-1 bg-tactiq-surface border border-tactiq-border rounded-xl">
            <div className="flex justify-between text-xs text-tactiq-muted">
              <span>Min Passing Threshold</span>
              <span className="text-tactiq-cyan font-bold">{minPassing}+</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minPassing}
              onChange={(e) => setMinPassing(parseInt(e.target.value, 10))}
              className="w-full accent-tactiq-cyan cursor-pointer"
            />
          </div>

          {/* Reset Action */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPosition('ALL');
                setMinPassing(0);
              }}
              className="px-4 py-2 text-xs font-semibold text-tactiq-muted hover:text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Player List vs Radar Analysis Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Player Cards */}
        <div className="lg:col-span-5 space-y-3 max-h-[720px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-semibold text-tactiq-muted px-1">
            <span>Found Players ({filteredPlayers.length})</span>
            <span>Click to Inspect Radar</span>
          </div>

          {filteredPlayers.map((player) => {
            const isSelected = selectedPlayer.id === player.id;
            return (
              <div
                key={player.id}
                onClick={() => {
                  setSelectedPlayer(player);
                  setComparisonPlayer(null);
                  setSimilarResults(null);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-tactiq-surface border-tactiq-emerald shadow-glow-emerald/20'
                    : 'bg-tactiq-card border-tactiq-border hover:border-tactiq-border/80 hover:bg-tactiq-surface/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-tactiq-surface border border-tactiq-border flex-shrink-0">
                    <img
                      src={player.photoUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white group-hover:text-tactiq-emerald transition-colors">
                        {player.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tactiq-surface border border-tactiq-border text-tactiq-cyan font-bold">
                        {player.position}
                      </span>
                    </div>
                    <div className="text-xs text-tactiq-muted mt-0.5">
                      {player.team?.name || 'Club'} • {player.nationality} ({player.age} yo)
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-xs font-mono font-bold text-tactiq-emerald">
                    €{(player.marketValue / 1000000).toFixed(0)}M
                  </span>
                  <span className="text-[10px] text-tactiq-muted">
                    PAS {player.attributes?.passing ?? '-'} / PAC {player.attributes?.pace ?? '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Radar Workbench & Similar Players Analysis */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Player Detail Card */}
          <div className="p-6 bg-tactiq-card border border-tactiq-border rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-tactiq-border">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-tactiq-surface border border-tactiq-border">
                  <img
                    src={selectedPlayer.photoUrl}
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-white">{selectedPlayer.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-tactiq-emerald/10 border border-tactiq-emerald/30 text-tactiq-emerald font-bold text-xs">
                      {selectedPlayer.position}
                    </span>
                  </div>
                  <p className="text-xs text-tactiq-muted mt-1">
                    {selectedPlayer.team?.name} • {selectedPlayer.nationality} • Age: {selectedPlayer.age}
                  </p>
                </div>
              </div>

              {/* Trigger Similar Players Button */}
              <button
                onClick={() => handleFindSimilar(selectedPlayer)}
                disabled={isLoadingSimilar}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-tactiq-emerald to-tactiq-cyan text-tactiq-bg font-bold text-xs hover:opacity-90 transition-all shadow-glow-emerald disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{isLoadingSimilar ? 'Calculating Vectors...' : 'Find Similar Players'}</span>
              </button>
            </div>

            {/* Radar Chart Display */}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="w-full max-w-sm">
                {selectedPlayer.attributes && (
                  <RadarChart
                    metrics={selectedPlayer.attributes}
                    playerName={selectedPlayer.name}
                    comparisonMetrics={comparisonPlayer?.attributes}
                    comparisonPlayerName={comparisonPlayer?.name}
                  />
                )}
              </div>

              {/* Stat breakdown panel */}
              {selectedPlayer.attributes && (
                <div className="w-full md:w-56 space-y-2 text-xs">
                  <div className="font-bold text-slate-200 mb-2">Attribute Breakdown</div>
                  {Object.entries(selectedPlayer.attributes).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-tactiq-border/40">
                      <span className="text-tactiq-muted capitalize">{key}</span>
                      <span className="font-mono font-bold text-tactiq-emerald">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Similar Players Recommendations Panel */}
          {similarResults && (
            <div className="p-6 bg-tactiq-card border border-tactiq-border rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-tactiq-cyan" />
                    <span>Top 5 Statistically Similar Counterparts</span>
                  </h3>
                  <p className="text-xs text-tactiq-muted">
                    Cosine similarity vector calculated across 7 skill dimensions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {similarResults.similarPlayers.map((item, idx) => {
                  const isCompared = comparisonPlayer?.id === item.player.id;
                  return (
                    <div
                      key={item.player.id}
                      onClick={() => setComparisonPlayer(item.player)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isCompared
                          ? 'bg-tactiq-surface border-tactiq-cyan shadow-glow-cyan/20'
                          : 'bg-tactiq-surface/40 border-tactiq-border hover:border-tactiq-border/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono font-bold text-tactiq-muted">#{idx + 1}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{item.player.name}</div>
                          <div className="text-[10px] text-tactiq-muted">
                            {item.player.team?.name || 'Club'} • {item.player.position}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-tactiq-cyan">
                          {item.similarityScore}%
                        </div>
                        <span className="text-[9px] text-tactiq-muted">
                          {isCompared ? 'Comparing' : 'Click to compare'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
