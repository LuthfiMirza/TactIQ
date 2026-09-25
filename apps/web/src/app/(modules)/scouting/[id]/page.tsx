'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RadarChart } from '@/components/radar-chart';
import type { PlayerDTO, PlayerSimilarityResponse } from '@tactiq/shared-types';
import { ArrowLeft, Sparkles, Shield, User, Globe, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';

const FALLBACK_PLAYER: PlayerDTO = {
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
};

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<PlayerDTO>(FALLBACK_PLAYER);
  const [comparisonPlayer, setComparisonPlayer] = useState<PlayerDTO | null>(null);
  const [similarityData, setSimilarityData] = useState<PlayerSimilarityResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPlayerData() {
      setIsLoading(true);
      try {
        const [playerRes, similarRes] = await Promise.all([
          fetch(`http://localhost:4000/api/v1/players/${playerId}`),
          fetch(`http://localhost:4000/api/v1/players/${playerId}/similar`),
        ]);

        if (playerRes.ok) {
          const pJson = await playerRes.json();
          setPlayer(pJson.data);
        }

        if (similarRes.ok) {
          const sJson = await similarRes.json();
          setSimilarityData(sJson.data);
          if (sJson.data.similarPlayers?.length > 0) {
            setComparisonPlayer(sJson.data.similarPlayers[0].player);
          }
        }
      } catch (err) {
        console.warn('API error in player profile page, using fallback mock data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (playerId) {
      loadPlayerData();
    }
  }, [playerId]);

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/scouting"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-tactiq-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Scouting Catalog</span>
        </Link>
      </div>

      {/* Main Dossier Header */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-br from-tactiq-card via-tactiq-card to-tactiq-surface border border-tactiq-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-tactiq-emerald/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-tactiq-surface border-2 border-tactiq-border flex-shrink-0 shadow-lg">
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{player.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-tactiq-emerald/10 border border-tactiq-emerald/30 text-tactiq-emerald font-bold text-xs">
                  {player.position}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-tactiq-muted font-medium">
                <span className="flex items-center gap-1 text-slate-300">
                  <Shield size={13} className="text-tactiq-cyan" />
                  {player.team?.name || 'Club'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe size={13} className="text-tactiq-emerald" />
                  {player.nationality}
                </span>
                <span>•</span>
                <span>Age: {player.age} yo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-tactiq-muted uppercase tracking-wider font-semibold">Estimated Market Value</div>
              <div className="text-3xl font-black font-mono text-tactiq-emerald mt-0.5">
                €{(player.marketValue / 1000000).toFixed(0)}M
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Radar Analysis vs Attribute Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-6 p-6 bg-tactiq-card border border-tactiq-border rounded-2xl flex flex-col items-center justify-center shadow-xl">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-tactiq-emerald" />
              7-Axis Skill Radar Visualization
            </span>
            {comparisonPlayer && (
              <span className="text-xs font-mono text-tactiq-cyan">
                vs {comparisonPlayer.name}
              </span>
            )}
          </div>

          {player.attributes && (
            <RadarChart
              metrics={player.attributes}
              playerName={player.name}
              comparisonMetrics={comparisonPlayer?.attributes}
              comparisonPlayerName={comparisonPlayer?.name}
              className="w-full"
            />
          )}
        </div>

        {/* Attribute Breakdown Stats */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 bg-tactiq-card border border-tactiq-border rounded-2xl shadow-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Layers size={14} className="text-tactiq-cyan" />
              Performance Metrics & Analytical Rating
            </span>

            {player.attributes && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(player.attributes).map(([key, val]) => (
                  <div key={key} className="p-3.5 rounded-xl bg-tactiq-surface/50 border border-tactiq-border">
                    <div className="text-[11px] text-tactiq-muted uppercase font-semibold tracking-wider">
                      {key}
                    </div>
                    <div className="text-2xl font-black font-mono text-white mt-1">
                      {val}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-tactiq-card mt-2 overflow-hidden">
                      <div
                        style={{ width: `${val}%` }}
                        className={`h-full ${
                          val >= 85 ? 'bg-tactiq-emerald' : val >= 75 ? 'bg-tactiq-cyan' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tactical Role Insights */}
          <div className="p-5 bg-tactiq-card border border-tactiq-border rounded-2xl space-y-2 text-xs">
            <span className="font-bold text-slate-200">AI Scout Verdict</span>
            <p className="text-slate-300 leading-relaxed">
              Profile displays elite playmaking tendencies with upper-quartile vision ({player.attributes?.vision ?? 90}) and passing precision ({player.attributes?.passing ?? 90}). Optimal position suited for Advanced Playmaker or Half-Space attacking midfielder.
            </p>
          </div>
        </div>
      </div>

      {/* Similar Players Recommendations Section */}
      {similarityData && (
        <div className="p-6 bg-tactiq-card border border-tactiq-border rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-tactiq-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-tactiq-cyan" />
                <span>Statistically Similar Counterparts (ML Cosine Model)</span>
              </h2>
              <p className="text-xs text-tactiq-muted mt-0.5">
                Recommended alternatives with comparable radar distribution and playing style
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarityData.similarPlayers.map((item, idx) => {
              const isComparing = comparisonPlayer?.id === item.player.id;
              return (
                <div
                  key={item.player.id}
                  onClick={() => setComparisonPlayer(item.player)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isComparing
                      ? 'bg-tactiq-surface border-tactiq-cyan shadow-glow-cyan/20'
                      : 'bg-tactiq-surface/30 border-tactiq-border hover:border-tactiq-border/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-tactiq-surface border border-tactiq-border flex-shrink-0">
                      <img
                        src={item.player.photoUrl}
                        alt={item.player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{item.player.name}</div>
                      <div className="text-[11px] text-tactiq-muted">
                        {item.player.team?.name || 'Club'} • {item.player.position}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-tactiq-cyan">
                      {item.similarityScore}%
                    </div>
                    <span className="text-[9px] text-tactiq-muted">
                      {isComparing ? 'Comparing' : 'Click to overlay'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
