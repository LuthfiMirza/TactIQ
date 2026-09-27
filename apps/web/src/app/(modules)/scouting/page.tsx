'use client';

import React, { useState, useMemo } from 'react';
import { RadarChart } from '@/components/radar-chart';
import { ClubCrest, LeagueLogo } from '@/components/ui/club-crest';
import { PlayerComparisonModal } from '@/components/scouting/player-comparison-modal';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import type { PlayerDTO } from '@tactiq/shared-types';
import {
  SlidersHorizontal,
  Download,
  Check,
  ChevronDown,
  ArrowRight,
  ArrowLeftRight,
  X,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoutingRecommendation {
  player: PlayerDTO;
  matchPercentage: number;
  highlightMetrics: { label: string; value: string }[];
  per90: { sca: number; penaltyBoxPasses: number; highTurnoverRegains: number; pressPassPct: number };
  tacticalRole: string;
}

// ─── Benchmark Dataset ───────────────────────────────────────────────────────

type BenchmarkPlayer = PlayerDTO & {
  estValueFormatted: string;
  rating: number;
  goals: number; assists: number; started: number; matches: number; minutes: number;
  position2: string;
  strengths: string[]; weaknesses: string[];
  per90: { sca: number; penaltyBoxPasses: number; highTurnoverRegains: number; pressPassPct: number };
};

const toBenchmarkPlayer = (player: PlayerDTO, rec?: ScoutingRecommendation): BenchmarkPlayer => {
  return {
    ...player,
    estValueFormatted: `€${((player.marketValue || 0) / 1e6).toFixed(0)}M`,
    rating: 8.6,
    goals: player.position === 'FWD' ? 15 : player.position === 'MID' ? 7 : player.position === 'DEF' ? 2 : 0,
    assists: player.position === 'MID' ? 10 : 3,
    started: 24,
    matches: 27,
    minutes: 2250,
    position2: player.position,
    strengths: rec?.highlightMetrics?.map(m => m.label) || ['Tactical IQ', 'Consistency', 'Press Resistance'],
    weaknesses: ['Aerial duels', 'Defensive recovery'],
    per90: rec?.per90 || { sca: 4.8, penaltyBoxPasses: 2.1, highTurnoverRegains: 1.6, pressPassPct: 84.0 },
  };
};

const BENCHMARK_PLAYERS_BY_CLUSTER: Record<'GK' | 'DF' | 'MF' | 'FW', BenchmarkPlayer[]> = {
  MF: [
    {
      id: 'player-odegaard', teamId: 'team-ars',
      name: 'Martin Ødegaard', position: 'MID', position2: 'AM / CM',
      nationality: 'NOR', age: 25, marketValue: 110000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/184029.png',
      team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 76, shooting: 82, passing: 93, dribbling: 90, defending: 68, physical: 69, vision: 95 },
      estValueFormatted: '€110M',
      rating: 8.4, goals: 11, assists: 14, started: 28, matches: 30, minutes: 2520,
      strengths: ['Line-breaking passes', 'Vision & Creativity', 'High pressing'],
      weaknesses: ['Aerial duels', 'Physical strength'],
      per90: { sca: 5.82, penaltyBoxPasses: 2.91, highTurnoverRegains: 1.42, pressPassPct: 84.6 },
    },
    {
      id: 'player-kdb', teamId: 'team-mci',
      name: 'Kevin De Bruyne', position: 'MID', position2: 'AM / CM',
      nationality: 'BEL', age: 33, marketValue: 50000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/61366.png',
      team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 74, shooting: 88, passing: 95, dribbling: 87, defending: 65, physical: 78, vision: 97 },
      estValueFormatted: '€50M',
      rating: 8.9, goals: 8, assists: 19, started: 24, matches: 27, minutes: 2160,
      strengths: ['Long-range passing', 'Shooting accuracy', 'Game reading'],
      weaknesses: ['Injury recovery', 'Defensive recovery'],
      per90: { sca: 6.42, penaltyBoxPasses: 3.45, highTurnoverRegains: 1.25, pressPassPct: 82.1 },
    },
    {
      id: 'player-bellingham', teamId: 'team-rma',
      name: 'Jude Bellingham', position: 'MID', position2: 'AM / CM',
      nationality: 'ENG', age: 21, marketValue: 180000000,
      photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/jude-bellingham/assets/BELLINGHAM_CARITA_1500X2000.png',
      team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 82, shooting: 87, passing: 89, dribbling: 90, defending: 80, physical: 85, vision: 91 },
      estValueFormatted: '€180M',
      rating: 9.1, goals: 21, assists: 9, started: 30, matches: 32, minutes: 2740,
      strengths: ['Box-to-box runs', 'High pressing', 'Goal scoring'],
      weaknesses: ['Tactical discipline', 'Foul frequency'],
      per90: { sca: 5.12, penaltyBoxPasses: 2.35, highTurnoverRegains: 2.10, pressPassPct: 86.8 },
    },
  ],
  FW: [
    {
      id: 'player-haaland', teamId: 'team-mci',
      name: 'Erling Haaland', position: 'FWD', position2: 'ST / CF',
      nationality: 'NOR', age: 24, marketValue: 180000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/223094.png',
      team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 89, shooting: 93, passing: 70, dribbling: 81, defending: 45, physical: 88, vision: 76 },
      estValueFormatted: '€180M',
      rating: 9.2, goals: 27, assists: 5, started: 28, matches: 31, minutes: 2650,
      strengths: ['Box Finishing', 'Aerial Power', 'Off-ball Runs'],
      weaknesses: ['Link-up build up', 'Defensive work'],
      per90: { sca: 3.40, penaltyBoxPasses: 1.65, highTurnoverRegains: 0.95, pressPassPct: 76.5 },
    },
    {
      id: 'player-saka', teamId: 'team-ars',
      name: 'Bukayo Saka', position: 'FWD', position2: 'RW / RM',
      nationality: 'ENG', age: 23, marketValue: 140000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/223340.png',
      team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 86, shooting: 84, passing: 83, dribbling: 89, defending: 65, physical: 78, vision: 87 },
      estValueFormatted: '€140M',
      rating: 8.8, goals: 16, assists: 12, started: 27, matches: 29, minutes: 2410,
      strengths: ['1v1 Take-ons', 'Box Touches', 'xG + xA'],
      weaknesses: ['Right-foot consistency'],
      per90: { sca: 5.60, penaltyBoxPasses: 3.10, highTurnoverRegains: 1.80, pressPassPct: 83.4 },
    },
    {
      id: 'player-mbappe', teamId: 'team-rma',
      name: 'Kylian Mbappé', position: 'FWD', position2: 'LW / CF',
      nationality: 'FRA', age: 25, marketValue: 180000000,
      photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/mbappe/assets/MBAPPE_CARITA_1500X2000.png',
      team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 97, shooting: 90, passing: 82, dribbling: 92, defending: 36, physical: 78, vision: 83 },
      estValueFormatted: '€180M',
      rating: 9.1, goals: 25, assists: 8, started: 28, matches: 30, minutes: 2550,
      strengths: ['Sprint Speed', 'Transition Threat', 'Box Touches'],
      weaknesses: ['Defensive tracking', 'Aerial duels'],
      per90: { sca: 5.30, penaltyBoxPasses: 2.70, highTurnoverRegains: 1.40, pressPassPct: 84.1 },
    },
    {
      id: 'player-palmer', teamId: 'team-che',
      name: 'Cole Palmer', position: 'FWD', position2: 'AM / RW',
      nationality: 'ENG', age: 22, marketValue: 110000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/244851.png',
      team: { id: 'team-che', name: 'Chelsea', code: 'CHE', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 80, shooting: 86, passing: 88, dribbling: 87, defending: 55, physical: 72, vision: 92 },
      estValueFormatted: '€110M',
      rating: 8.9, goals: 22, assists: 11, started: 27, matches: 29, minutes: 2420,
      strengths: ['Key Passes', 'Finishing', 'Penalty Conversion'],
      weaknesses: ['Physical strength', 'Aerial recovery'],
      per90: { sca: 5.92, penaltyBoxPasses: 2.85, highTurnoverRegains: 1.35, pressPassPct: 82.0 },
    },
  ],
  DF: [
    {
      id: 'player-saliba', teamId: 'team-ars',
      name: 'William Saliba', position: 'DEF', position2: 'CB',
      nationality: 'FRA', age: 23, marketValue: 80000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/462424.png',
      team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 83, shooting: 40, passing: 82, dribbling: 76, defending: 89, physical: 84, vision: 78 },
      estValueFormatted: '€80M',
      rating: 8.6, goals: 2, assists: 1, started: 32, matches: 32, minutes: 2880,
      strengths: ['Defensive Duels', 'Pass Accuracy', 'Recovery Pace'],
      weaknesses: ['Attacking set pieces'],
      per90: { sca: 1.45, penaltyBoxPasses: 0.65, highTurnoverRegains: 2.80, pressPassPct: 91.2 },
    },
    {
      id: 'player-vvd', teamId: 'team-liv',
      name: 'Virgil van Dijk', position: 'DEF', position2: 'CB',
      nationality: 'NED', age: 33, marketValue: 35000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/97032.png',
      team: { id: 'team-liv', name: 'Liverpool', code: 'LIV', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 78, shooting: 60, passing: 84, dribbling: 72, defending: 91, physical: 89, vision: 80 },
      estValueFormatted: '€35M',
      rating: 8.9, goals: 4, assists: 2, started: 30, matches: 31, minutes: 2750,
      strengths: ['Aerial Duels', 'Long Ball Accuracy', 'Leadership'],
      weaknesses: ['Recovery sprint vs pure pace'],
      per90: { sca: 1.80, penaltyBoxPasses: 0.85, highTurnoverRegains: 2.50, pressPassPct: 89.8 },
    },
    {
      id: 'player-gvardiol', teamId: 'team-mci',
      name: 'Joško Gvardiol', position: 'DEF', position2: 'LB / CB',
      nationality: 'CRO', age: 22, marketValue: 75000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/477424.png',
      team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 82, shooting: 68, passing: 84, dribbling: 82, defending: 85, physical: 84, vision: 81 },
      estValueFormatted: '€75M',
      rating: 8.6, goals: 5, assists: 3, started: 28, matches: 30, minutes: 2490,
      strengths: ['Prog. Carries', 'Ground Duels', 'Line Breaking'],
      weaknesses: ['Over-committing on overlaps'],
      per90: { sca: 2.20, penaltyBoxPasses: 1.20, highTurnoverRegains: 2.45, pressPassPct: 89.5 },
    },
    {
      id: 'player-rudiger', teamId: 'team-rma',
      name: 'Antonio Rüdiger', position: 'DEF', position2: 'CB',
      nationality: 'GER', age: 31, marketValue: 25000000,
      photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/antonio-rudiger/assets/RUDIGER_CARITA_1500X2000.png',
      team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 84, shooting: 54, passing: 78, dribbling: 71, defending: 87, physical: 88, vision: 74 },
      estValueFormatted: '€25M',
      rating: 8.5, goals: 3, assists: 1, started: 29, matches: 31, minutes: 2680,
      strengths: ['Aerial Duels', 'Sprint Speed', 'Aggressive Interceptions'],
      weaknesses: ['Foul concession'],
      per90: { sca: 1.30, penaltyBoxPasses: 0.40, highTurnoverRegains: 2.70, pressPassPct: 86.0 },
    },
  ],
  GK: [
    {
      id: 'player-raya', teamId: 'team-ars',
      name: 'David Raya', position: 'GK', position2: 'GK',
      nationality: 'ESP', age: 29, marketValue: 45000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/154561.png',
      team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 60, shooting: 25, passing: 86, dribbling: 65, defending: 82, physical: 78, vision: 88 },
      estValueFormatted: '€45M',
      rating: 8.5, goals: 0, assists: 0, started: 32, matches: 32, minutes: 2880,
      strengths: ['Box Claims', 'Long Pass Dist', 'PSxG +/-'],
      weaknesses: ['Near-post power shots'],
      per90: { sca: 0.65, penaltyBoxPasses: 0.20, highTurnoverRegains: 0.90, pressPassPct: 85.0 },
    },
    {
      id: 'player-alisson', teamId: 'team-liv',
      name: 'Alisson Becker', position: 'GK', position2: 'GK',
      nationality: 'BRA', age: 31, marketValue: 30000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/116535.png',
      team: { id: 'team-liv', name: 'Liverpool', code: 'LIV', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 62, shooting: 22, passing: 86, dribbling: 66, defending: 89, physical: 82, vision: 87 },
      estValueFormatted: '€30M',
      rating: 8.8, goals: 0, assists: 0, started: 28, matches: 28, minutes: 2520,
      strengths: ['1v1 Saves', 'Reflex Stops', 'Distribution'],
      weaknesses: ['Hamstring strain susceptibility'],
      per90: { sca: 0.58, penaltyBoxPasses: 0.18, highTurnoverRegains: 0.88, pressPassPct: 86.5 },
    },
    {
      id: 'player-courtois', teamId: 'team-rma',
      name: 'Thibaut Courtois', position: 'GK', position2: 'GK',
      nationality: 'BEL', age: 32, marketValue: 28000000,
      photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/thibaut-courtois/assets/COURTOIS_CARITA_1500X2000.png',
      team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 56, shooting: 20, passing: 78, dribbling: 58, defending: 90, physical: 85, vision: 81 },
      estValueFormatted: '€28M',
      rating: 8.7, goals: 0, assists: 0, started: 22, matches: 22, minutes: 1980,
      strengths: ['Reach & Wingspan', 'Close-Range Reflexes', 'Aerial Control'],
      weaknesses: ['Sweeping out of box'],
      per90: { sca: 0.40, penaltyBoxPasses: 0.12, highTurnoverRegains: 0.75, pressPassPct: 84.0 },
    },
    {
      id: 'player-ederson', teamId: 'team-mci',
      name: 'Ederson', position: 'GK', position2: 'GK',
      nationality: 'BRA', age: 31, marketValue: 35000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/121160.png',
      team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 64, shooting: 30, passing: 93, dribbling: 72, defending: 84, physical: 80, vision: 93 },
      estValueFormatted: '€35M',
      rating: 8.6, goals: 0, assists: 1, started: 30, matches: 30, minutes: 2700,
      strengths: ['Pass Range', 'Press Resistance', 'Sweeping Outside Box'],
      weaknesses: ['Long shot conversion against'],
      per90: { sca: 0.72, penaltyBoxPasses: 0.35, highTurnoverRegains: 1.05, pressPassPct: 91.0 },
    },
  ],
};

const BENCHMARK_PLAYERS = BENCHMARK_PLAYERS_BY_CLUSTER.MF;

const INITIAL_RECOMMENDATIONS: ScoutingRecommendation[] = [
  {
    player: {
      id: 'rec-szoboszlai', teamId: 'team-liv',
      name: 'Dominik Szoboszlai', position: 'MID',
      nationality: 'HUN', age: 23, marketValue: 75000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/424876.png',
      team: { id: 'team-liv', name: 'Liverpool', code: 'LIV', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 82, shooting: 85, passing: 89, dribbling: 86, defending: 64, physical: 79, vision: 90 },
    },
    matchPercentage: 94.2,
    highlightMetrics: [{ label: 'Half-Space Control', value: '98%' }, { label: 'Key Passes', value: '95%' }, { label: 'Press Regains', value: '91%' }],
    per90: { sca: 5.44, penaltyBoxPasses: 2.68, highTurnoverRegains: 1.75, pressPassPct: 81.9 },
    tacticalRole: 'Advanced Playmaker',
  },
  {
    player: {
      id: 'rec-rice', teamId: 'team-ars',
      name: 'Declan Rice', position: 'MID',
      nationality: 'ENG', age: 25, marketValue: 120000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/204480.png',
      team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 78, shooting: 75, passing: 87, dribbling: 82, defending: 88, physical: 86, vision: 85 },
    },
    matchPercentage: 92.6,
    highlightMetrics: [{ label: 'Press Resist', value: '94%' }, { label: 'Ball Regains', value: '96%' }, { label: 'Box Entries', value: '88%' }],
    per90: { sca: 4.88, penaltyBoxPasses: 2.12, highTurnoverRegains: 2.45, pressPassPct: 91.2 },
    tacticalRole: 'Box-to-Box Engine',
  },
  {
    player: {
      id: 'rec-guler', teamId: 'team-rma',
      name: 'Arda Güler', position: 'MID',
      nationality: 'TUR', age: 19, marketValue: 45000000,
      photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/arda-guler/assets/GULER_CARITA_1500X2000.png',
      team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 78, shooting: 81, passing: 88, dribbling: 89, defending: 52, physical: 62, vision: 91 },
    },
    matchPercentage: 89.4,
    highlightMetrics: [{ label: 'Shot Creation', value: '94%' }, { label: 'Box Entries', value: '90%' }, { label: 'Final Third xA', value: '91%' }],
    per90: { sca: 5.62, penaltyBoxPasses: 2.75, highTurnoverRegains: 0.98, pressPassPct: 83.1 },
    tacticalRole: 'Inverted Playmaker',
  },
  {
    player: {
      id: 'rec-camavinga', teamId: 'team-rma',
      name: 'Eduardo Camavinga', position: 'MID',
      nationality: 'FRA', age: 21, marketValue: 100000000,
      photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/eduardo-camavinga/assets/CAMAVINGA_CARITA_1500X2000.png',
      team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 82, shooting: 74, passing: 86, dribbling: 87, defending: 84, physical: 83, vision: 87 },
    },
    matchPercentage: 88.5,
    highlightMetrics: [{ label: 'Tackle %', value: '92%' }, { label: 'Prog. Carries', value: '89%' }, { label: 'Duels Won', value: '90%' }],
    per90: { sca: 4.41, penaltyBoxPasses: 1.95, highTurnoverRegains: 2.30, pressPassPct: 89.4 },
    tacticalRole: 'Dynamic Ball Winner',
  },
  {
    player: {
      id: 'rec-foden', teamId: 'team-mci',
      name: 'Phil Foden', position: 'MID',
      nationality: 'ENG', age: 24, marketValue: 150000000,
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/209244.png',
      team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 86, shooting: 86, passing: 89, dribbling: 92, defending: 58, physical: 68, vision: 92 },
    },
    matchPercentage: 87.2,
    highlightMetrics: [{ label: 'Box Threat', value: '96%' }, { label: 'xA Potential', value: '92%' }, { label: 'Half-Space Runs', value: '95%' }],
    per90: { sca: 5.80, penaltyBoxPasses: 3.10, highTurnoverRegains: 1.30, pressPassPct: 84.8 },
    tacticalRole: 'Roaming Playmaker',
  },
];

const CLUSTER_RECOMMENDATIONS: Record<'GK' | 'DF' | 'MF' | 'FW', ScoutingRecommendation[]> = {
  MF: INITIAL_RECOMMENDATIONS,
  FW: [
    {
      player: {
        id: 'rec-saka', teamId: 'team-ars',
        name: 'Bukayo Saka', position: 'FWD',
        nationality: 'ENG', age: 23, marketValue: 140000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/223340.png',
        team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 86, shooting: 84, passing: 83, dribbling: 89, defending: 65, physical: 78, vision: 87 },
      },
      matchPercentage: 93.5,
      highlightMetrics: [{ label: '1v1 Take-ons', value: '96%' }, { label: 'Box Touches', value: '94%' }, { label: 'xG + xA', value: '91%' }],
      per90: { sca: 5.60, penaltyBoxPasses: 3.10, highTurnoverRegains: 1.80, pressPassPct: 83.4 },
      tacticalRole: 'Inverted Winger',
    },
    {
      player: {
        id: 'rec-palmer', teamId: 'team-che',
        name: 'Cole Palmer', position: 'FWD',
        nationality: 'ENG', age: 22, marketValue: 110000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/244851.png',
        team: { id: 'team-che', name: 'Chelsea', code: 'CHE', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 80, shooting: 86, passing: 88, dribbling: 87, defending: 55, physical: 72, vision: 92 },
      },
      matchPercentage: 91.2,
      highlightMetrics: [{ label: 'Key Passes', value: '97%' }, { label: 'Finishing', value: '92%' }, { label: 'Penalty Conversion', value: '99%' }],
      per90: { sca: 5.92, penaltyBoxPasses: 2.85, highTurnoverRegains: 1.35, pressPassPct: 82.0 },
      tacticalRole: 'Inside Forward / AM',
    },
    {
      player: {
        id: 'rec-haaland', teamId: 'team-mci',
        name: 'Erling Haaland', position: 'FWD',
        nationality: 'NOR', age: 24, marketValue: 180000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/223094.png',
        team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 89, shooting: 93, passing: 70, dribbling: 81, defending: 45, physical: 88, vision: 76 },
      },
      matchPercentage: 89.8,
      highlightMetrics: [{ label: 'Box Finishing', value: '99%' }, { label: 'Aerial Power', value: '92%' }, { label: 'Off-ball Runs', value: '96%' }],
      per90: { sca: 3.40, penaltyBoxPasses: 1.65, highTurnoverRegains: 0.95, pressPassPct: 76.5 },
      tacticalRole: 'Target Forward',
    },
    {
      player: {
        id: 'rec-mbappe', teamId: 'team-rma',
        name: 'Kylian Mbappé', position: 'FWD',
        nationality: 'FRA', age: 25, marketValue: 180000000,
        photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/mbappe/assets/MBAPPE_CARITA_1500X2000.png',
        team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
        attributes: { pace: 97, shooting: 90, passing: 82, dribbling: 92, defending: 36, physical: 78, vision: 83 },
      },
      matchPercentage: 88.0,
      highlightMetrics: [{ label: 'Sprint Speed', value: '99%' }, { label: 'Transition Threat', value: '97%' }, { label: 'Box Touches', value: '94%' }],
      per90: { sca: 5.30, penaltyBoxPasses: 2.70, highTurnoverRegains: 1.40, pressPassPct: 84.1 },
      tacticalRole: 'Inside Forward',
    },
    {
      player: {
        id: 'rec-vinicius', teamId: 'team-rma',
        name: 'Vinícius Júnior', position: 'FWD',
        nationality: 'BRA', age: 24, marketValue: 180000000,
        photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/vinicius-paixao-de-oliveira-junior-/assets/VINI_CARITA_1500X2000.png',
        team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
        attributes: { pace: 95, shooting: 84, passing: 81, dribbling: 94, defending: 34, physical: 69, vision: 84 },
      },
      matchPercentage: 86.4,
      highlightMetrics: [{ label: '1v1 Dribble', value: '99%' }, { label: 'Carry Into Box', value: '96%' }, { label: 'Direct Threat', value: '93%' }],
      per90: { sca: 5.20, penaltyBoxPasses: 3.10, highTurnoverRegains: 1.25, pressPassPct: 80.2 },
      tacticalRole: 'Direct Winger',
    },
  ],
  DF: [
    {
      player: {
        id: 'rec-saliba', teamId: 'team-ars',
        name: 'William Saliba', position: 'DEF',
        nationality: 'FRA', age: 23, marketValue: 80000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/462424.png',
        team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 83, shooting: 40, passing: 82, dribbling: 76, defending: 89, physical: 84, vision: 78 },
      },
      matchPercentage: 95.1,
      highlightMetrics: [{ label: 'Defensive Duels', value: '97%' }, { label: 'Pass Accuracy', value: '94%' }, { label: 'Recovery Pace', value: '92%' }],
      per90: { sca: 1.45, penaltyBoxPasses: 0.65, highTurnoverRegains: 2.80, pressPassPct: 91.2 },
      tacticalRole: 'Ball-Playing Defender',
    },
    {
      player: {
        id: 'rec-vvd', teamId: 'team-liv',
        name: 'Virgil van Dijk', position: 'DEF',
        nationality: 'NED', age: 33, marketValue: 35000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/97032.png',
        team: { id: 'team-liv', name: 'Liverpool', code: 'LIV', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 78, shooting: 60, passing: 84, dribbling: 72, defending: 91, physical: 89, vision: 80 },
      },
      matchPercentage: 92.4,
      highlightMetrics: [{ label: 'Aerial Duels', value: '98%' }, { label: 'Long Ball Accuracy', value: '94%' }, { label: 'Leadership', value: '99%' }],
      per90: { sca: 1.80, penaltyBoxPasses: 0.85, highTurnoverRegains: 2.50, pressPassPct: 89.8 },
      tacticalRole: 'Covering Defender',
    },
    {
      player: {
        id: 'rec-gvardiol', teamId: 'team-mci',
        name: 'Joško Gvardiol', position: 'DEF',
        nationality: 'CRO', age: 22, marketValue: 75000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/477424.png',
        team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 82, shooting: 68, passing: 84, dribbling: 82, defending: 85, physical: 84, vision: 81 },
      },
      matchPercentage: 89.0,
      highlightMetrics: [{ label: 'Prog. Carries', value: '95%' }, { label: 'Ground Duels', value: '90%' }, { label: 'Line Breaking', value: '88%' }],
      per90: { sca: 2.20, penaltyBoxPasses: 1.20, highTurnoverRegains: 2.45, pressPassPct: 89.5 },
      tacticalRole: 'Inverted Left-Back / LCB',
    },
    {
      player: {
        id: 'rec-taa', teamId: 'team-liv',
        name: 'Trent Alexander-Arnold', position: 'DEF',
        nationality: 'ENG', age: 25, marketValue: 70000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/169187.png',
        team: { id: 'team-liv', name: 'Liverpool', code: 'LIV', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 76, shooting: 75, passing: 92, dribbling: 80, defending: 74, physical: 72, vision: 94 },
      },
      matchPercentage: 87.5,
      highlightMetrics: [{ label: 'Cross Completion', value: '97%' }, { label: 'Chances Created', value: '95%' }, { label: 'Long Passing', value: '96%' }],
      per90: { sca: 4.10, penaltyBoxPasses: 2.60, highTurnoverRegains: 1.80, pressPassPct: 84.5 },
      tacticalRole: 'Inverted Wing-Back',
    },
    {
      player: {
        id: 'rec-rudiger', teamId: 'team-rma',
        name: 'Antonio Rüdiger', position: 'DEF',
        nationality: 'GER', age: 31, marketValue: 25000000,
        photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/antonio-rudiger/assets/RUDIGER_CARITA_1500X2000.png',
        team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
        attributes: { pace: 84, shooting: 54, passing: 78, dribbling: 71, defending: 87, physical: 88, vision: 74 },
      },
      matchPercentage: 86.0,
      highlightMetrics: [{ label: 'Aerial Duels', value: '94%' }, { label: 'Sprint Speed', value: '93%' }, { label: 'Aggressive Interceptions', value: '91%' }],
      per90: { sca: 1.30, penaltyBoxPasses: 0.40, highTurnoverRegains: 2.70, pressPassPct: 86.0 },
      tacticalRole: 'Stopper / Aggressive CB',
    },
  ],
  GK: [
    {
      player: {
        id: 'rec-raya', teamId: 'team-ars',
        name: 'David Raya', position: 'GK',
        nationality: 'ESP', age: 29, marketValue: 45000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/154561.png',
        team: { id: 'team-ars', name: 'Arsenal', code: 'ARS', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 60, shooting: 25, passing: 86, dribbling: 65, defending: 82, physical: 78, vision: 88 },
      },
      matchPercentage: 94.8,
      highlightMetrics: [{ label: 'Box Claims', value: '98%' }, { label: 'Long Pass Dist', value: '95%' }, { label: 'PSxG +/-', value: '+3.8' }],
      per90: { sca: 0.65, penaltyBoxPasses: 0.20, highTurnoverRegains: 0.90, pressPassPct: 85.0 },
      tacticalRole: 'Sweeper Keeper',
    },
    {
      player: {
        id: 'rec-alisson', teamId: 'team-liv',
        name: 'Alisson Becker', position: 'GK',
        nationality: 'BRA', age: 31, marketValue: 30000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/116535.png',
        team: { id: 'team-liv', name: 'Liverpool', code: 'LIV', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 62, shooting: 22, passing: 86, dribbling: 66, defending: 89, physical: 82, vision: 87 },
      },
      matchPercentage: 93.1,
      highlightMetrics: [{ label: '1v1 Saves', value: '99%' }, { label: 'Reflex Stops', value: '95%' }, { label: 'Distribution', value: '92%' }],
      per90: { sca: 0.58, penaltyBoxPasses: 0.18, highTurnoverRegains: 0.88, pressPassPct: 86.5 },
      tacticalRole: 'Elite Shot-Stopper',
    },
    {
      player: {
        id: 'rec-ederson', teamId: 'team-mci',
        name: 'Ederson', position: 'GK',
        nationality: 'BRA', age: 31, marketValue: 35000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/121160.png',
        team: { id: 'team-mci', name: 'Man City', code: 'MCI', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 64, shooting: 30, passing: 93, dribbling: 72, defending: 84, physical: 80, vision: 93 },
      },
      matchPercentage: 91.5,
      highlightMetrics: [{ label: 'Pass Range', value: '99%' }, { label: 'Press Resistance', value: '98%' }, { label: 'Sweeping Outside Box', value: '94%' }],
      per90: { sca: 0.72, penaltyBoxPasses: 0.35, highTurnoverRegains: 1.05, pressPassPct: 91.0 },
      tacticalRole: 'Ball-Playing Sweeper',
    },
    {
      player: {
        id: 'rec-courtois', teamId: 'team-rma',
        name: 'Thibaut Courtois', position: 'GK',
        nationality: 'BEL', age: 32, marketValue: 28000000,
        photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/thibaut-courtois/assets/COURTOIS_CARITA_1500X2000.png',
        team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
        attributes: { pace: 56, shooting: 20, passing: 78, dribbling: 58, defending: 90, physical: 85, vision: 81 },
      },
      matchPercentage: 89.2,
      highlightMetrics: [{ label: 'Reach & Wingspan', value: '99%' }, { label: 'Close-Range Reflexes', value: '96%' }, { label: 'Aerial Control', value: '95%' }],
      per90: { sca: 0.40, penaltyBoxPasses: 0.12, highTurnoverRegains: 0.75, pressPassPct: 84.0 },
      tacticalRole: 'Dominant Shot-Stopper',
    },
    {
      player: {
        id: 'rec-martinez', teamId: 'team-avl',
        name: 'Emiliano Martínez', position: 'GK',
        nationality: 'ARG', age: 32, marketValue: 28000000,
        photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/98980.png',
        team: { id: 'team-avl', name: 'Aston Villa', code: 'AVL', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 58, shooting: 22, passing: 82, dribbling: 62, defending: 88, physical: 84, vision: 83 },
      },
      matchPercentage: 87.8,
      highlightMetrics: [{ label: 'Penalty Stops', value: '99%' }, { label: 'High Claims', value: '94%' }, { label: 'Big Match Impact', value: '96%' }],
      per90: { sca: 0.50, penaltyBoxPasses: 0.15, highTurnoverRegains: 0.80, pressPassPct: 85.0 },
      tacticalRole: 'Commanding Shot-Stopper',
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────



function MiniPitch({ position }: { position: string }) {
  const isAM = position.includes('AM');
  const dotX = 52;
  const dotY = isAM ? 34 : 46;
  return (
    <svg viewBox="0 0 104 68" className="w-full h-full rounded-lg" fill="none">
      <rect x="1" y="1" width="102" height="66" rx="4" fill="#F8FAFC" className="dark:fill-[#18181C]" stroke="#CBD5E1" strokeWidth="1"/>
      <line x1="52" y1="1" x2="52" y2="67" stroke="#CBD5E1" strokeWidth="0.75"/>
      <circle cx="52" cy="34" r="10" stroke="#CBD5E1" strokeWidth="0.75"/>
      <circle cx="52" cy="34" r="1.5" fill="#94A3B8"/>
      <rect x="1" y="16" width="16" height="36" stroke="#CBD5E1" strokeWidth="0.75"/>
      <rect x="87" y="16" width="16" height="36" stroke="#CBD5E1" strokeWidth="0.75"/>
      <circle cx={dotX} cy={dotY} r="4.5" fill="#3B82F6" />
      <circle cx={dotX} cy={dotY} r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

const MATCH_STATS = [
  { date: '20.04.24', opponent: 'Barca', result: 'D', score: '2 - 2', mins: '90', goals: 1, assists: 2, rating: '8.5' },
  { date: '16.04.24', opponent: 'Chelsea', result: 'W', score: '3 - 0', mins: '90', goals: 0, assists: 2, rating: '9.0' },
  { date: '04.04.24', opponent: 'Spurs', result: 'W', score: '4 - 1', mins: '90', goals: 2, assists: 1, rating: '8.2' },
  { date: '28.03.24', opponent: 'Man City', result: 'W', score: '2 - 1', mins: '90', goals: 0, assists: 1, rating: '7.8' },
  { date: '18.03.24', opponent: 'Liverpool', result: 'D', score: '1 - 1', mins: '68', goals: 1, assists: 0, rating: '7.4' },
];

export default function ScoutingPage() {
  const [anchorPlayer, setAnchorPlayer] = useState(BENCHMARK_PLAYERS[0]);
  const [selectedCluster, setSelectedCluster] = useState<'GK' | 'DF' | 'MF' | 'FW'>('MF');
  const [recommendations, setRecommendations] = useState<ScoutingRecommendation[]>(CLUSTER_RECOMMENDATIONS.MF);
  const [comparisonTarget, setComparisonTarget] = useState<ScoutingRecommendation>(CLUSTER_RECOMMENDATIONS.MF[0]);
  const [sortBy, setSortBy] = useState<'similarity' | 'value' | 'age'>('similarity');
  const [isAnchorSelectorOpen, setIsAnchorSelectorOpen] = useState(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [modalPlayerB, setModalPlayerB] = useState<PlayerDTO | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [anchorSearchQuery, setAnchorSearchQuery] = useState('');

  const allScoutingPlayers = useMemo(() => {
    const list: PlayerDTO[] = [...BENCHMARK_PLAYERS];
    Object.values(CLUSTER_RECOMMENDATIONS).forEach((recs) => {
      recs.forEach((r) => list.push(r.player));
    });
    return list;
  }, []);

  const filteredAnchorCandidates = useMemo(() => {
    if (!anchorSearchQuery.trim()) return null;
    const q = anchorSearchQuery.toLowerCase();
    const pool = new Map<string, PlayerDTO>();
    Object.values(BENCHMARK_PLAYERS_BY_CLUSTER).forEach((list) => list.forEach((p) => pool.set(p.id, p)));
    Object.values(CLUSTER_RECOMMENDATIONS).forEach((list) => list.forEach((r) => pool.set(r.player.id, r.player)));

    return Array.from(pool.values()).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.team?.name?.toLowerCase().includes(q) ||
        p.team?.code?.toLowerCase().includes(q) ||
        p.position?.toLowerCase().includes(q) ||
        p.nationality?.toLowerCase().includes(q)
    );
  }, [anchorSearchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClusterSelect = (cluster: 'GK' | 'DF' | 'MF' | 'FW') => {
    setSelectedCluster(cluster);
    const list = CLUSTER_RECOMMENDATIONS[cluster] || [];
    setRecommendations(list);
    if (list.length > 0) {
      setComparisonTarget(list[0]);
    }
    const benchmarks = BENCHMARK_PLAYERS_BY_CLUSTER[cluster] || [];
    if (benchmarks.length > 0) {
      setAnchorPlayer(benchmarks[0]);
      showToast(`${cluster} mode: Anchor set to ${benchmarks[0].name}`);
    } else {
      showToast(`Showing ${cluster} shortlist`);
    }
  };

  const handleSetAsAnchor = (player: PlayerDTO, rec?: ScoutingRecommendation) => {
    const newAnchor = toBenchmarkPlayer(player, rec);
    setAnchorPlayer(newAnchor);
    showToast(`Anchor set to ${player.name}`);
  };

  const handleSelectCandidate = (rec: ScoutingRecommendation) => {
    setComparisonTarget(rec);
    showToast(`Comparing: ${rec.player.name}`);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const el = document.getElementById('comparison-arena');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const sortedRecommendations = useMemo(() => {
    const list = [...recommendations];
    if (sortBy === 'similarity') return list.sort((a, b) => b.matchPercentage - a.matchPercentage);
    if (sortBy === 'value') return list.sort((a, b) => (b.player.marketValue || 0) - (a.player.marketValue || 0));
    if (sortBy === 'age') return list.sort((a, b) => (a.player.age || 0) - (b.player.age || 0));
    return list;
  }, [recommendations, sortBy]);

  const duelMetrics = useMemo(() => {
    const a = anchorPlayer.per90;
    const b = comparisonTarget.per90;
    return [
      { label: 'Shot-Creating Actions', anchorVal: a.sca, targetVal: b.sca, max: 7.0, unit: '/90' },
      { label: 'Penalty Box Passes', anchorVal: a.penaltyBoxPasses, targetVal: b.penaltyBoxPasses, max: 4.0, unit: '/90' },
      { label: 'High Turnover Regains', anchorVal: a.highTurnoverRegains, targetVal: b.highTurnoverRegains, max: 2.5, unit: '/90' },
      { label: 'Pressing Pass Success', anchorVal: a.pressPassPct, targetVal: b.pressPassPct, max: 100, unit: '%' },
    ];
  }, [anchorPlayer, comparisonTarget]);

  return (
    <div className="w-full flex flex-col gap-5 pb-14">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono font-bold text-xs flex items-center gap-2 rounded-lg shadow-xl border border-slate-700/50 dark:border-zinc-300">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Filter & Navigation Toolbar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#27272A] pb-3 transition-colors">
        
        {/* Left: Position Filter Matrix & Anchor Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Anchor Selector */}
          <div className="relative">
            <button
              onClick={() => setIsAnchorSelectorOpen(!isAnchorSelectorOpen)}
              className="h-9 flex items-center gap-2 px-3 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] shadow-xs transition-colors"
            >
              <ClubCrest code={anchorPlayer.team?.code || ''} size={16} />
              <span className="text-slate-500 dark:text-zinc-400">Anchor:</span>
              <span>{anchorPlayer.name}</span>
              <ChevronDown size={13} className="text-slate-500 dark:text-zinc-400 ml-0.5" />
            </button>

            {isAnchorSelectorOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-30 w-80 max-h-96 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl shadow-2xl overflow-hidden flex flex-col divide-y divide-slate-100 dark:divide-[#27272A]">
                {/* Search Bar Header */}
                <div className="p-2.5 bg-slate-50 dark:bg-[#151518] shrink-0">
                  <div className="relative flex items-center">
                    <Search size={14} className="absolute left-2.5 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search player, club, position..."
                      value={anchorSearchQuery}
                      onChange={(e) => setAnchorSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full bg-white dark:bg-[#1C1C22] border border-slate-300 dark:border-[#2B2B32] rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-[#CEFF00] transition-colors"
                    />
                    {anchorSearchQuery && (
                      <button
                        onClick={() => setAnchorSearchQuery('')}
                        className="absolute right-2 text-zinc-400 hover:text-white p-0.5"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results List */}
                <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-[#27272A] flex-1">
                  {filteredAnchorCandidates ? (
                    filteredAnchorCandidates.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold bg-slate-50/50 dark:bg-zinc-900/50">
                          Search Results ({filteredAnchorCandidates.length})
                        </div>
                        {filteredAnchorCandidates.map((p) => (
                          <button
                            key={`search-${p.id}`}
                            onClick={() => {
                              handleSetAsAnchor(p);
                              setIsAnchorSelectorOpen(false);
                              setAnchorSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors text-left gap-3 ${
                              anchorPlayer.id === p.id ? 'bg-[#CEFF00]/10 text-[#CEFF00]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                                <PlayerAvatar src={p.photoUrl} alt={p.name} className="w-full h-full object-cover object-top" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                                <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                                  {p.team?.name} · {p.position} · {p.nationality}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-200 shrink-0">
                              €{((p.marketValue || 0) / 1e6).toFixed(0)}M
                            </span>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-8 text-center text-xs text-zinc-500 font-mono">
                        No players found for &ldquo;{anchorSearchQuery}&rdquo;
                      </div>
                    )
                  ) : (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold bg-slate-50/50 dark:bg-zinc-900/50">
                        {selectedCluster} Benchmarks
                      </div>
                      {(BENCHMARK_PLAYERS_BY_CLUSTER[selectedCluster] || []).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setAnchorPlayer(p);
                            setIsAnchorSelectorOpen(false);
                            showToast(`Anchor: ${p.name}`);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors text-left gap-3 ${
                            anchorPlayer.id === p.id ? 'bg-[#CEFF00]/10 text-[#CEFF00]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                              <PlayerAvatar src={p.photoUrl} alt={p.name} className="w-full h-full object-cover object-top" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                                {p.team?.name} · {p.position2}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-200 shrink-0">
                            {p.estValueFormatted}
                          </span>
                        </button>
                      ))}

                      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold bg-slate-50/50 dark:bg-zinc-900/50">
                        Shortlist Candidates
                      </div>
                      {recommendations.map((r) => (
                        <button
                          key={`rec-anchor-${r.player.id}`}
                          onClick={() => {
                            handleSetAsAnchor(r.player, r);
                            setIsAnchorSelectorOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors text-left gap-3 ${
                            anchorPlayer.id === r.player.id ? 'bg-[#CEFF00]/10 text-[#CEFF00]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                              <PlayerAvatar src={r.player.photoUrl} alt={r.player.name} className="w-full h-full object-cover object-top" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.player.name}</div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                                {r.player.team?.name} · {r.tacticalRole}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-200 shrink-0">
                            €{((r.player.marketValue || 0) / 1e6).toFixed(0)}M
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Position Clusters */}
          <div className="h-9 flex items-center border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] rounded-lg p-0.5 shadow-xs">
            {(['GK', 'DF', 'MF', 'FW'] as const).map((pos) => {
              const isActive = selectedCluster === pos;
              return (
                <button
                  key={pos}
                  onClick={() => handleClusterSelect(pos)}
                  className={`relative h-full px-3.5 rounded-md text-xs font-bold transition-colors flex items-center justify-center ${
                    isActive
                      ? 'text-white dark:text-zinc-900'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="scoutingClusterActive"
                      className="absolute inset-0 bg-[#CEFF00] rounded-md shadow-xs -z-0"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? 'text-black font-extrabold' : ''}`}>{pos}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalPlayerB(comparisonTarget.player);
              setIsCompareModalOpen(true);
            }}
            className="h-9 flex items-center gap-1.5 px-3.5 bg-[#CEFF00] hover:bg-[#b8e600] text-black text-xs font-black rounded-lg shadow-xs shadow-[#CEFF00]/20 transition-all active:scale-[0.98]"
          >
            <ArrowLeftRight size={13} />
            <span>Compare Matrix</span>
          </button>
          <button
            onClick={() => setIsWeightsModalOpen(true)}
            className="h-9 flex items-center gap-1.5 px-3 border border-[#27272A] bg-[#121215] hover:bg-[#1A1A1E] rounded-lg text-xs font-bold text-zinc-300 shadow-xs transition-colors"
          >
            <SlidersHorizontal size={13} />
            <span>Weights</span>
          </button>
          <button
            onClick={() => showToast('Shortlist exported to CSV')}
            className="h-9 flex items-center gap-1.5 px-3 border border-[#27272A] bg-[#121215] hover:bg-[#1A1A1E] rounded-lg text-xs font-bold text-zinc-300 shadow-xs transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>

      </div>

      {/* ── Main Side-by-Side Comparison Workspace ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT COLUMN: Candidate Shortlist (4 cols) ─────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 shadow-xs transition-colors">
            
            {/* Header with Sort Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                  Similar Profiles
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">Select player to compare</span>
              </div>

              {/* Sort Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-[#18181C] p-0.5 rounded-lg border border-slate-200/60 dark:border-[#27272A] text-[10px] font-mono">
                {(['similarity', 'value', 'age'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                      sortBy === s
                        ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {s === 'similarity' ? 'Match' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-2 mt-2.5">
              {sortedRecommendations.map((rec) => {
                const isSelected = comparisonTarget.player.id === rec.player.id;
                const valueFormatted = rec.player.marketValue ? `€${(rec.player.marketValue / 1e6).toFixed(0)}M` : '–';

                return (
                  <div
                    key={rec.player.id}
                    onClick={() => handleSelectCandidate(rec)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#CEFF00] bg-[#18181D] shadow-sm shadow-[#CEFF00]/10'
                        : 'border-[#27272A] bg-[#151518] hover:border-zinc-700 hover:bg-[#1A1A1E]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      
                      {/* Left: Player Avatar + Details */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-[#18181C] border border-[#27272A] flex items-center justify-center">
                          <PlayerAvatar
                            src={rec.player.photoUrl}
                            alt={rec.player.name}
                            className="w-full h-full object-cover object-[center_top] [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] drop-shadow-xs"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {rec.player.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono flex items-center gap-1.5">
                            <ClubCrest code={rec.player.team?.code || rec.player.team?.name || ''} size={13} />
                            <span>{rec.player.team?.name} · {rec.player.nationality} · {rec.player.age}y · <strong>{valueFormatted}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Match Percentage (Clean Editorial Style) */}
                      <div className="text-right shrink-0 px-2.5 py-1 rounded-lg bg-[#18181C] border border-[#27272A] font-mono">
                        <div className={`text-xs font-black tabular-nums leading-none ${rec.matchPercentage >= 85 ? 'text-[#CEFF00]' : 'text-zinc-100'}`}>
                          {rec.matchPercentage.toFixed(1)}%
                        </div>
                        <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block mt-0.5">
                          Match
                        </span>
                      </div>

                    </div>

                    {/* Metric Badges & Action Button */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#222227]">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {rec.highlightMetrics.slice(0, 2).map((m, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-[#1E1E24] text-zinc-400 text-[10px] font-mono truncate">
                            {m.label}: <strong className="text-zinc-200">{m.value}</strong>
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCandidate(rec);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all shrink-0 active:scale-95 ${
                          isSelected
                            ? 'bg-[#CEFF00] text-black font-black shadow-xs'
                            : 'bg-[#25252B] text-zinc-300 hover:bg-[#2F2F36]'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check size={11} className="stroke-[2.5]" />
                            <span>Comparing</span>
                          </>
                        ) : (
                          <>
                            <span>Compare</span>
                            <ArrowRight size={11} />
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* ── RIGHT COLUMN: Comparison Arena (8 cols) ───────────────────────── */}
        <div id="comparison-arena" className="lg:col-span-8 flex flex-col gap-5 scroll-mt-20">

          {/* Card 1: Player Matchup Header */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-xs transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 sm:gap-6">
              
              {/* Anchor Profile (Left, 5 cols) */}
              <div className="md:col-span-5 flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#18181C] border border-[#27272A] flex items-center justify-center shadow-xs">
                  <PlayerAvatar
                    src={anchorPlayer.photoUrl}
                    alt={anchorPlayer.name}
                    className="w-full h-full object-cover object-[center_top] [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] drop-shadow-sm"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold block mb-0.5">
                    Anchor Player
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate leading-tight">
                    {anchorPlayer.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-zinc-400 mt-1">
                    <ClubCrest code={anchorPlayer.team?.code || ''} size={15} />
                    <span className="truncate">{anchorPlayer.team?.name} · {anchorPlayer.nationality} · {anchorPlayer.age}y · <strong className="text-slate-900 dark:text-zinc-200">{anchorPlayer.estValueFormatted}</strong></span>
                  </div>
                </div>
              </div>

              {/* Match % & Swap Bridge (Center, 2 cols) */}
              <div className="md:col-span-2 flex flex-row md:flex-col items-center justify-between md:justify-center py-2 md:py-0 border-y md:border-y-0 md:border-x border-slate-100 dark:border-[#27272A] px-3 gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#18181C] border border-slate-200 dark:border-[#27272A]">
                  <span className="text-slate-500 dark:text-zinc-400 font-mono font-bold text-[10px]">
                    VS
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                    {comparisonTarget.matchPercentage.toFixed(1)}%
                  </span>
                </div>
                <button
                  onClick={() => handleSetAsAnchor(comparisonTarget.player, comparisonTarget)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold text-zinc-400 hover:text-[#CEFF00] hover:bg-[#CEFF00]/10 transition-colors border border-transparent hover:border-[#CEFF00]/30"
                  title="Promote target player to anchor"
                >
                  <ArrowLeftRight size={10} />
                  <span>Swap</span>
                </button>
              </div>

              {/* Target Profile (Right, 5 cols) */}
              <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-3.5 min-w-0 text-left md:text-right">
                <div className="min-w-0 flex-1 order-2 md:order-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold block mb-0.5">
                    Comparison Target
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate leading-tight">
                    {comparisonTarget.player.name}
                  </h2>
                  <div className="flex items-center justify-start md:justify-end gap-1.5 text-xs font-mono text-slate-500 dark:text-zinc-400 mt-1">
                    <ClubCrest code={comparisonTarget.player.team?.code || ''} size={15} />
                    <span className="truncate">{comparisonTarget.player.team?.name} · {comparisonTarget.player.nationality} · {comparisonTarget.player.age}y · <strong className="text-sky-600 dark:text-sky-400">€{((comparisonTarget.player.marketValue || 0) / 1e6).toFixed(0)}M</strong></span>
                  </div>
                </div>

                <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#18181C] border border-[#27272A] flex items-center justify-center shadow-xs order-1 md:order-2">
                  <PlayerAvatar
                    src={comparisonTarget.player.photoUrl}
                    alt={comparisonTarget.player.name}
                    className="w-full h-full object-cover object-[center_top] [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] drop-shadow-sm"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Card 2: Interactive Radar & Per 90 Comparison */}
          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs transition-colors">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Attribute Comparison</span>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CEFF00] shadow-[0_0_6px_rgba(206,255,0,0.5)]" />
                  {anchorPlayer.name.split(' ')[1] || anchorPlayer.name}
                </span>
                <span className="flex items-center gap-1.5 text-[#00D2FF] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] shadow-[0_0_6px_rgba(0,210,255,0.5)]" />
                  {comparisonTarget.player.name.split(' ')[1] || comparisonTarget.player.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Radar Chart (6 cols) */}
              <div className="md:col-span-6 flex flex-col items-center justify-center min-h-[250px]">
                {anchorPlayer.attributes && (
                  <RadarChart
                    metrics={anchorPlayer.attributes}
                    playerName={anchorPlayer.name}
                    showLegend={false}
                    {...(comparisonTarget.player.attributes
                      ? { comparisonMetrics: comparisonTarget.player.attributes, comparisonPlayerName: comparisonTarget.player.name }
                      : {})}
                  />
                )}
              </div>

              {/* Metric Duel Bars (6 cols) */}
              <div className="md:col-span-6 flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-[#27272A] pt-4 md:pt-0 md:pl-6 font-mono">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                  Per 90 Metrics
                </span>

                {duelMetrics.map((m) => {
                  const anchorPct = Math.min(100, Math.round((m.anchorVal / m.max) * 100));
                  const targetPct = Math.min(100, Math.round((m.targetVal / m.max) * 100));
                  const anchorWins = m.anchorVal >= m.targetVal;

                  return (
                    <div key={m.label} className="text-xs">
                      {/* Metric Name & Values */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-bold tabular-nums ${anchorWins ? 'text-[#CEFF00]' : 'text-zinc-400'}`}>
                          {m.anchorVal.toFixed(m.unit === '%' ? 1 : 2)}{m.unit}
                        </span>
                        <span className="text-[11px] text-zinc-300 font-medium text-center truncate px-2 font-sans">
                          {m.label}
                        </span>
                        <span className={`font-bold tabular-nums ${!anchorWins ? 'text-[#00D2FF]' : 'text-zinc-400'}`}>
                          {m.targetVal.toFixed(m.unit === '%' ? 1 : 2)}{m.unit}
                        </span>
                      </div>

                      {/* Side-by-Side Duel Bar with Solid Track */}
                      <div className="grid grid-cols-2 gap-1.5 h-2 bg-[#18181C] border border-[#27272A]/60 rounded-full p-0.5 overflow-hidden">
                        <div className="flex justify-end bg-zinc-900/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#CEFF00] rounded-full transition-all duration-300"
                            style={{ width: `${anchorPct}%` }}
                          />
                        </div>
                        <div className="flex justify-start bg-zinc-900/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00D2FF] rounded-full transition-all duration-300"
                            style={{ width: `${targetPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Card 3: Side-by-Side Tactical Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Anchor Tactical Profile */}
            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {anchorPlayer.name.split(' ')[1]} Profile
                  </span>
                  <span className="text-[10px] font-mono text-slate-700 dark:text-zinc-300 font-bold">{anchorPlayer.position2}</span>
                </div>

                <div className="h-28 rounded-lg border border-slate-200 dark:border-[#27272A] overflow-hidden mb-3.5 bg-slate-50 dark:bg-[#18181C]">
                  <MiniPitch position={anchorPlayer.position2 ?? 'AM'} />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Key Strengths</span>
                    <ul className="space-y-1 text-slate-700 dark:text-zinc-300 text-[11px]">
                      {anchorPlayer.strengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="text-slate-700 dark:text-zinc-300 font-bold">+</span>
                          <span className="truncate">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Areas for Development</span>
                    <ul className="space-y-1 text-slate-500 dark:text-zinc-400 text-[11px]">
                      {anchorPlayer.weaknesses.slice(0, 2).map((w, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span>–</span>
                          <span className="truncate">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-[#27272A] pt-3 mt-4 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex justify-between">
                <span>Role: Playmaker</span>
                <span className="text-slate-900 dark:text-white font-bold">{anchorPlayer.matches} Matches · {anchorPlayer.goals}G {anchorPlayer.assists}A</span>
              </div>
            </div>

            {/* Target Tactical Profile */}
            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {comparisonTarget.player.name.split(' ')[1] || comparisonTarget.player.name} Fit
                  </span>
                  <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                    {comparisonTarget.tacticalRole}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Compatibility High Points</span>
                    <ul className="space-y-1 text-slate-700 dark:text-zinc-300 text-[11px]">
                      {comparisonTarget.highlightMetrics.map((hm, i) => (
                        <li key={i} className="flex items-center justify-between py-0.5">
                          <span className="flex items-center gap-1.5">
                            <Check size={12} className="text-sky-600 dark:text-sky-400 stroke-[2.5] shrink-0" />
                            <span>{hm.label}</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{hm.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 dark:border-[#27272A] pt-3">
                    <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 font-bold block mb-1">Attributes Summary</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Passing</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.passing}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Dribbling</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.dribbling}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Shooting</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.shooting}</span>
                      </div>
                      <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-[#18181C]">
                        <span className="text-slate-500">Vision</span>
                        <span className="font-bold text-slate-900 dark:text-white">{comparisonTarget.player.attributes?.vision}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-[#27272A] pt-3 mt-4 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex justify-between">
                <span>Market Value:</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">€{(comparisonTarget.player.marketValue ? comparisonTarget.player.marketValue / 1e6 : 0).toFixed(0)}M</span>
              </div>
            </div>

          </div>

          {/* Card 4: Match Registry & Performance Log */}
          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Performance Log · {anchorPlayer.name}</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  Recent Match Records
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-800/60 text-[10px] font-mono text-slate-600 dark:text-zinc-300 shrink-0">
                <LeagueLogo league="Premier League" size={13} />
                <span>Premier League</span>
              </div>
            </div>

            {/* Desktop Table Header */}
            <div className="hidden sm:grid grid-cols-[75px_1fr_80px_55px_40px_40px_60px] items-center pb-2.5 px-2 border-b border-slate-100 dark:border-[#27272A] text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
              <span>Date</span>
              <span>Opponent</span>
              <span className="text-center">Score</span>
              <span className="text-center">Mins</span>
              <span className="text-center">G</span>
              <span className="text-center">A</span>
              <span className="text-right">Rating</span>
            </div>

            {/* Desktop Table Rows */}
            <div className="hidden sm:block divide-y divide-slate-100 dark:divide-[#27272A] font-mono text-xs">
              {MATCH_STATS.map((m, idx) => (
                <div key={idx} className="grid grid-cols-[75px_1fr_80px_55px_40px_40px_60px] items-center py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-lg transition-colors">
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">{m.date}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={m.result === 'W' ? 'tq-form-w' : m.result === 'D' ? 'tq-form-d' : 'tq-form-l'}>
                      {m.result}
                    </span>
                    <ClubCrest code={m.opponent} size={16} />
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{m.opponent}</span>
                  </div>
                  <div className="text-center font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
                    {m.score}
                  </div>
                  <span className="text-center text-slate-500 dark:text-zinc-400 tabular-nums">{m.mins}&apos;</span>
                  <span className={`text-center font-bold tabular-nums ${m.goals > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-600'}`}>{m.goals}</span>
                  <span className={`text-center font-bold tabular-nums ${m.assists > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-600'}`}>{m.assists}</span>
                  <div className="text-right">
                    <span className={Number(m.rating) >= 8.0 ? 'tq-rating-high' : Number(m.rating) >= 7.0 ? 'tq-rating-good' : 'tq-rating-avg'}>
                      {m.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Clean Match Feed */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-[#27272A] font-mono">
              {MATCH_STATS.map((m, idx) => {
                const contributions: string[] = [];
                if (m.goals > 0) contributions.push(`${m.goals} ${m.goals > 1 ? 'Goals' : 'Goal'}`);
                if (m.assists > 0) contributions.push(`${m.assists} ${m.assists > 1 ? 'Assists' : 'Assist'}`);

                return (
                  <div key={idx} className="py-3 px-1 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-lg transition-colors">
                    {/* Top Row: Opponent + Score + Rating */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={m.result === 'W' ? 'tq-form-w' : m.result === 'D' ? 'tq-form-d' : 'tq-form-l'}>
                          {m.result}
                        </span>
                        <ClubCrest code={m.opponent} size={18} />
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {m.opponent}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 px-2.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800/80 shrink-0 tabular-nums">
                        {m.score}
                      </div>

                      <div className="shrink-0">
                        <span className={Number(m.rating) >= 8.0 ? 'tq-rating-high' : Number(m.rating) >= 7.0 ? 'tq-rating-good' : 'tq-rating-avg'}>
                          {m.rating}
                        </span>
                      </div>
                    </div>

                    {/* Sub-row: Match details (Date, Minutes, Contribution) */}
                    <div className="flex items-center justify-between mt-2 pt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 dark:text-zinc-500">{m.date}</span>
                        <span className="text-slate-300 dark:text-zinc-600">·</span>
                        <span>{m.mins}&apos;</span>
                      </div>

                      {contributions.length > 0 ? (
                        <span className="text-sky-600 dark:text-sky-400 font-semibold text-[11px]">
                          {contributions.join(' · ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-600 text-[10px]">
                          Full Match
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ── Weights Modal ──────────────────────────────────────────────────── */}
      {isWeightsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setIsWeightsModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-2xl transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Weights Configuration</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Scouting Weights</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWeightsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white active:scale-95 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E1E24] transition-colors"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 font-mono text-xs">
              {[
                { label: 'Passing & Creation', val: 35 },
                { label: 'Pressing Intensity', val: 25 },
                { label: 'Progressive Carries', val: 20 },
                { label: 'Spatial Duels', val: 20 },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-600 dark:text-zinc-300">{label}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-[#18181C] rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 dark:bg-zinc-200" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsWeightsModalOpen(false);
                  showToast('Weights updated');
                }}
                className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs rounded-xl transition-colors shadow-xs active:scale-[0.99]"
              >
                Apply Weights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dual Player Comparison Matrix Modal (TSK-26) ────────────────────── */}
      <PlayerComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        allPlayers={allScoutingPlayers}
        initialPlayerA={anchorPlayer}
        initialPlayerB={modalPlayerB}
      />

    </div>
  );
}
