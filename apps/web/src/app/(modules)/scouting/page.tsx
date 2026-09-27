'use client';

import React, { useState, useMemo } from 'react';
import { RadarChart } from '@/components/radar-chart';
import { ClubCrest, LeagueLogo } from '@/components/ui/club-crest';
import { PlayerComparisonModal } from '@/components/scouting/player-comparison-modal';
import type { PlayerDTO } from '@tactiq/shared-types';
import {
  SlidersHorizontal,
  Download,
  Check,
  ChevronDown,
  ArrowRight,
  ArrowLeftRight,
  X,
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

const BENCHMARK_PLAYERS: (PlayerDTO & {
  estValueFormatted: string;
  rating: number;
  goals: number; assists: number; started: number; matches: number; minutes: number;
  position2: string;
  strengths: string[]; weaknesses: string[];
  per90: { sca: number; penaltyBoxPasses: number; highTurnoverRegains: number; pressPassPct: number };
})[] = [
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
    photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/jude-bellingham/assets/BELLINGHAM_POSE_1500X2000.png',
    team: { id: 'team-rma', name: 'Real Madrid', code: 'RMA', logoUrl: '', league: 'La Liga' },
    attributes: { pace: 82, shooting: 87, passing: 89, dribbling: 90, defending: 80, physical: 85, vision: 91 },
    estValueFormatted: '€180M',
    rating: 9.1, goals: 21, assists: 9, started: 30, matches: 32, minutes: 2740,
    strengths: ['Box-to-box runs', 'High pressing', 'Goal scoring'],
    weaknesses: ['Tactical discipline', 'Foul frequency'],
    per90: { sca: 5.12, penaltyBoxPasses: 2.35, highTurnoverRegains: 2.10, pressPassPct: 86.8 },
  },
];

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
      id: 'rec-busio', teamId: 'team-ven',
      name: 'Gianluca Busio', position: 'MID',
      nationality: 'USA', age: 22, marketValue: 18000000,
      photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Gianluca_Busio.jpg/500px-Gianluca_Busio.jpg',
      team: { id: 'team-ven', name: 'Venezia', code: 'VEN', logoUrl: '', league: 'Serie A' },
      attributes: { pace: 74, shooting: 72, passing: 88, dribbling: 84, defending: 72, physical: 75, vision: 86 },
    },
    matchPercentage: 91.8,
    highlightMetrics: [{ label: 'Press Resist', value: '92%' }, { label: 'Prog. Passes', value: '89%' }, { label: 'Ball Retention', value: '87%' }],
    per90: { sca: 4.88, penaltyBoxPasses: 2.12, highTurnoverRegains: 1.92, pressPassPct: 87.2 },
    tacticalRole: 'Midfield Connector',
  },
  {
    player: {
      id: 'rec-guler', teamId: 'team-rma',
      name: 'Arda Güler', position: 'MID',
      nationality: 'TUR', age: 19, marketValue: 45000000,
      photoUrl: 'https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/arda-guler/assets/ARDA_POSE_1500X2000.png',
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
      id: 'rec-zakharyan', teamId: 'team-rso',
      name: 'Arsen Zakharyan', position: 'MID',
      nationality: 'RUS', age: 21, marketValue: 15000000,
      photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Arsen_Zakharyan_2021_v_Zenit.jpg/500px-Arsen_Zakharyan_2021_v_Zenit.jpg',
      team: { id: 'team-rso', name: 'Real Sociedad', code: 'RSO', logoUrl: '', league: 'La Liga' },
      attributes: { pace: 77, shooting: 76, passing: 85, dribbling: 83, defending: 66, physical: 70, vision: 85 },
    },
    matchPercentage: 87.1,
    highlightMetrics: [{ label: 'Chance Creation', value: '89%' }, { label: 'Prog. Passes', value: '86%' }, { label: 'Tackles p90', value: '74%' }],
    per90: { sca: 4.41, penaltyBoxPasses: 1.95, highTurnoverRegains: 1.62, pressPassPct: 80.4 },
    tacticalRole: 'Wide Playmaker',
  },
  {
    player: {
      id: 'rec-oriley', teamId: 'team-bha',
      name: "Matt O'Riley", position: 'MID',
      nationality: 'DEN', age: 23, marketValue: 30000000,
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/2023.07.19_Yokohama_F._Marinos_-_Celtic_Glasgow_%286-4%29_-_53062949186_%28Matt_Oriley%29.jpg',
      team: { id: 'team-bha', name: 'Brighton', code: 'BHA', logoUrl: '', league: 'Premier League' },
      attributes: { pace: 72, shooting: 80, passing: 86, dribbling: 81, defending: 68, physical: 79, vision: 85 },
    },
    matchPercentage: 85.6,
    highlightMetrics: [{ label: 'Box Threat', value: '89%' }, { label: 'xA Potential', value: '84%' }, { label: 'Prog. Carries', value: '81%' }],
    per90: { sca: 4.65, penaltyBoxPasses: 2.22, highTurnoverRegains: 1.55, pressPassPct: 82.5 },
    tacticalRole: 'Box-to-Box Midfielder',
  },
];

const CLUSTER_RECOMMENDATIONS: Record<'GK' | 'DF' | 'MF' | 'FW', ScoutingRecommendation[]> = {
  MF: INITIAL_RECOMMENDATIONS,
  FW: [
    {
      player: {
        id: 'rec-saka', teamId: 'team-ars',
        name: 'Bukayo Saka', position: 'FWD',
        nationality: 'ENG', age: 22, marketValue: 140000000,
        photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Bukayo_Saka_England_v_Ghana_23_June_2026-057_%28cropped%29.jpg/500px-Bukayo_Saka_England_v_Ghana_23_June_2026-057_%28cropped%29.jpg',
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
        nationality: 'ENG', age: 22, marketValue: 90000000,
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Cole_Palmer_2025_FIFA_Club_World_Cup_Final.jpg',
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
        id: 'rec-yamal', teamId: 'team-bar',
        name: 'Lamine Yamal', position: 'FWD',
        nationality: 'ESP', age: 17, marketValue: 150000000,
        photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/Lamine_Yamal_France_v_Spain_7.24.26-142.jpg/500px-Lamine_Yamal_France_v_Spain_7.24.26-142.jpg',
        team: { id: 'team-bar', name: 'Barcelona', code: 'BAR', logoUrl: '', league: 'La Liga' },
        attributes: { pace: 88, shooting: 80, passing: 87, dribbling: 92, defending: 48, physical: 64, vision: 91 },
      },
      matchPercentage: 89.8,
      highlightMetrics: [{ label: 'Dribble Success', value: '98%' }, { label: 'Cross Accuracy', value: '93%' }, { label: 'SCA p90', value: '92%' }],
      per90: { sca: 6.10, penaltyBoxPasses: 3.25, highTurnoverRegains: 1.15, pressPassPct: 81.5 },
      tacticalRole: 'Creative Winger',
    },
    {
      player: {
        id: 'rec-olise', teamId: 'team-bay',
        name: 'Michael Olise', position: 'FWD',
        nationality: 'FRA', age: 22, marketValue: 65000000,
        photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Michael_Olise_France_v_Senegal_16_June_2026-307_%28cropped%29.jpg/500px-Michael_Olise_France_v_Senegal_16_June_2026-307_%28cropped%29.jpg',
        team: { id: 'team-bay', name: 'Bayern München', code: 'BAY', logoUrl: '', league: 'Bundesliga' },
        attributes: { pace: 84, shooting: 82, passing: 86, dribbling: 88, defending: 58, physical: 73, vision: 89 },
      },
      matchPercentage: 88.0,
      highlightMetrics: [{ label: 'Dead-ball Threat', value: '95%' }, { label: 'Progressive Carries', value: '89%' }, { label: 'Chances Created', value: '88%' }],
      per90: { sca: 5.30, penaltyBoxPasses: 2.70, highTurnoverRegains: 1.40, pressPassPct: 84.1 },
      tacticalRole: 'Wide Playmaker',
    },
    {
      player: {
        id: 'rec-williams', teamId: 'team-ath',
        name: 'Nico Williams', position: 'FWD',
        nationality: 'ESP', age: 22, marketValue: 70000000,
        photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Nico_Williams_Argentina_v_Spain_19_July_2026-196_%28cropped%29.jpg/500px-Nico_Williams_Argentina_v_Spain_19_July_2026-196_%28cropped%29.jpg',
        team: { id: 'team-ath', name: 'Athletic Club', code: 'ATH', logoUrl: '', league: 'La Liga' },
        attributes: { pace: 93, shooting: 79, passing: 81, dribbling: 89, defending: 45, physical: 74, vision: 82 },
      },
      matchPercentage: 86.4,
      highlightMetrics: [{ label: 'Sprint Speed', value: '99%' }, { label: 'Carry Into Box', value: '91%' }, { label: 'Transition Threat', value: '90%' }],
      per90: { sca: 4.90, penaltyBoxPasses: 2.45, highTurnoverRegains: 1.20, pressPassPct: 78.6 },
      tacticalRole: 'Direct Winger',
    },
  ],
  DF: [
    {
      player: {
        id: 'rec-saliba', teamId: 'team-ars',
        name: 'William Saliba', position: 'DEF',
        nationality: 'FRA', age: 23, marketValue: 80000000,
        photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/William_Saliba_France_v_Paraguay_4_July_2026-183.jpg/500px-William_Saliba_France_v_Paraguay_4_July_2026-183.jpg',
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
        id: 'rec-bastoni', teamId: 'team-int',
        name: 'Alessandro Bastoni', position: 'DEF',
        nationality: 'ITA', age: 25, marketValue: 70000000,
        photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Norway_Italy_-_June_2025_A_36_%28cropped%29.jpg/500px-Norway_Italy_-_June_2025_A_36_%28cropped%29.jpg',
        team: { id: 'team-int', name: 'Inter Milan', code: 'INT', logoUrl: '', league: 'Serie A' },
        attributes: { pace: 78, shooting: 45, passing: 86, dribbling: 79, defending: 87, physical: 82, vision: 84 },
      },
      matchPercentage: 92.4,
      highlightMetrics: [{ label: 'Prog. Passes', value: '96%' }, { label: 'Wide Overlaps', value: '91%' }, { label: 'Aerial Duels', value: '88%' }],
      per90: { sca: 2.10, penaltyBoxPasses: 1.15, highTurnoverRegains: 2.30, pressPassPct: 89.4 },
      tacticalRole: 'Wide Centre-Back',
    },
    {
      player: {
        id: 'rec-lukeba', teamId: 'team-rbl',
        name: 'Castello Lukeba', position: 'DEF',
        nationality: 'FRA', age: 21, marketValue: 40000000,
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80',
        team: { id: 'team-rbl', name: 'RB Leipzig', code: 'RBL', logoUrl: '', league: 'Bundesliga' },
        attributes: { pace: 80, shooting: 38, passing: 79, dribbling: 74, defending: 84, physical: 81, vision: 75 },
      },
      matchPercentage: 89.0,
      highlightMetrics: [{ label: 'Tackles Won', value: '91%' }, { label: 'Interceptions', value: '89%' }, { label: 'Line Breaking', value: '85%' }],
      per90: { sca: 1.20, penaltyBoxPasses: 0.50, highTurnoverRegains: 2.45, pressPassPct: 88.0 },
      tacticalRole: 'Covering Defender',
    },
    {
      player: {
        id: 'rec-hincapie', teamId: 'team-b04',
        name: 'Piero Hincapié', position: 'DEF',
        nationality: 'ECU', age: 22, marketValue: 40000000,
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80',
        team: { id: 'team-b04', name: 'Bayer Leverkusen', code: 'B04', logoUrl: '', league: 'Bundesliga' },
        attributes: { pace: 82, shooting: 42, passing: 78, dribbling: 75, defending: 83, physical: 83, vision: 76 },
      },
      matchPercentage: 87.5,
      highlightMetrics: [{ label: 'Aggressive Press', value: '92%' }, { label: 'Ground Duels', value: '87%' }, { label: 'Flexibility', value: '90%' }],
      per90: { sca: 1.35, penaltyBoxPasses: 0.70, highTurnoverRegains: 2.60, pressPassPct: 86.5 },
      tacticalRole: 'Hybrid LCB/LB',
    },
    {
      player: {
        id: 'rec-scalvini', teamId: 'team-ata',
        name: 'Giorgio Scalvini', position: 'DEF',
        nationality: 'ITA', age: 20, marketValue: 45000000,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
        team: { id: 'team-ata', name: 'Atalanta', code: 'ATA', logoUrl: '', league: 'Serie A' },
        attributes: { pace: 74, shooting: 52, passing: 77, dribbling: 72, defending: 85, physical: 82, vision: 79 },
      },
      matchPercentage: 86.0,
      highlightMetrics: [{ label: 'Aerial Dominance', value: '93%' }, { label: 'Anticipation', value: '89%' }, { label: 'Midfield Step-ins', value: '88%' }],
      per90: { sca: 1.60, penaltyBoxPasses: 0.80, highTurnoverRegains: 2.70, pressPassPct: 85.8 },
      tacticalRole: 'Stopper / Libero',
    },
  ],
  GK: [
    {
      player: {
        id: 'rec-raya', teamId: 'team-ars',
        name: 'David Raya', position: 'GK',
        nationality: 'ESP', age: 28, marketValue: 40000000,
        photoUrl: 'https://resources.premierleague.com/premierleague/photos/players/250x250/p154561.png',
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
        id: 'rec-costa', teamId: 'team-por',
        name: 'Diogo Costa', position: 'GK',
        nationality: 'POR', age: 24, marketValue: 45000000,
        photoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Diogo_Costa_Croatia_v_Portugal_2_July_2026-188_%28cropped%29.jpg/500px-Diogo_Costa_Croatia_v_Portugal_2_July_2026-188_%28cropped%29.jpg',
        team: { id: 'team-por', name: 'FC Porto', code: 'POR', logoUrl: '', league: 'Liga Portugal' },
        attributes: { pace: 62, shooting: 22, passing: 84, dribbling: 64, defending: 85, physical: 80, vision: 85 },
      },
      matchPercentage: 92.1,
      highlightMetrics: [{ label: 'Penalty Stops', value: '99%' }, { label: 'Reflex Saves', value: '93%' }, { label: 'Short Buildup', value: '91%' }],
      per90: { sca: 0.55, penaltyBoxPasses: 0.15, highTurnoverRegains: 0.85, pressPassPct: 86.2 },
      tacticalRole: 'Modern Shot-Stopper',
    },
    {
      player: {
        id: 'rec-verbruggen', teamId: 'team-bha',
        name: 'Bart Verbruggen', position: 'GK',
        nationality: 'NED', age: 22, marketValue: 22000000,
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80',
        team: { id: 'team-bha', name: 'Brighton', code: 'BHA', logoUrl: '', league: 'Premier League' },
        attributes: { pace: 61, shooting: 20, passing: 85, dribbling: 67, defending: 81, physical: 77, vision: 86 },
      },
      matchPercentage: 89.7,
      highlightMetrics: [{ label: 'Press Composure', value: '96%' }, { label: 'Midfield Launches', value: '90%' }, { label: 'High Claims', value: '88%' }],
      per90: { sca: 0.60, penaltyBoxPasses: 0.22, highTurnoverRegains: 0.80, pressPassPct: 87.5 },
      tacticalRole: 'Press-Baiting Sweeper',
    },
    {
      player: {
        id: 'rec-digregorio', teamId: 'team-juv',
        name: 'Michele Di Gregorio', position: 'GK',
        nationality: 'ITA', age: 27, marketValue: 20000000,
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80',
        team: { id: 'team-juv', name: 'Juventus', code: 'JUV', logoUrl: '', league: 'Serie A' },
        attributes: { pace: 58, shooting: 20, passing: 81, dribbling: 60, defending: 86, physical: 81, vision: 80 },
      },
      matchPercentage: 88.2,
      highlightMetrics: [{ label: 'Save Ratio', value: '94%' }, { label: 'Close-Range Reflexes', value: '92%' }, { label: 'Consistency', value: '90%' }],
      per90: { sca: 0.40, penaltyBoxPasses: 0.10, highTurnoverRegains: 0.70, pressPassPct: 83.0 },
      tacticalRole: 'Traditional Reflex Keeper',
    },
    {
      player: {
        id: 'rec-chevalier', teamId: 'team-lil',
        name: 'Lucas Chevalier', position: 'GK',
        nationality: 'FRA', age: 22, marketValue: 25000000,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
        team: { id: 'team-lil', name: 'Lille OSC', code: 'LIL', logoUrl: '', league: 'Ligue 1' },
        attributes: { pace: 63, shooting: 20, physical: 79, vision: 82, defending: 83, passing: 80, dribbling: 62 },
      },
      matchPercentage: 86.8,
      highlightMetrics: [{ label: '1v1 Suppression', value: '93%' }, { label: 'Cross Claiming', value: '89%' }, { label: 'Agility', value: '91%' }],
      per90: { sca: 0.45, penaltyBoxPasses: 0.12, highTurnoverRegains: 0.75, pressPassPct: 82.5 },
      tacticalRole: 'Athletic Shot-Stopper',
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getFlag = (nat?: string) => {
  if (!nat) return null;
  return (
    <span className="inline-flex items-center justify-center px-1 py-0.5 rounded bg-slate-900/90 dark:bg-zinc-800 text-white dark:text-zinc-200 font-mono text-[8px] font-extrabold border border-slate-700/60 dark:border-zinc-700 leading-none shadow-2xs">
      {nat}
    </span>
  );
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

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

  const allScoutingPlayers = useMemo(() => {
    const list: PlayerDTO[] = [...BENCHMARK_PLAYERS];
    Object.values(CLUSTER_RECOMMENDATIONS).forEach((recs) => {
      recs.forEach((r) => list.push(r.player));
    });
    return list;
  }, []);

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
      showToast(`Showing ${cluster} shortlist`);
    }
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
              <div className="absolute top-full left-0 mt-1 z-30 w-72 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-[#27272A]">
                {BENCHMARK_PLAYERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setAnchorPlayer(p); setIsAnchorSelectorOpen(false); showToast(`Benchmark: ${p.name}`); }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] transition-colors text-left gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ClubCrest code={p.team?.code || ''} size={20} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">{p.team?.name} · {p.position2}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-zinc-200 shrink-0">{p.estValueFormatted}</span>
                  </button>
                ))}
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
            className="h-9 flex items-center gap-1.5 px-3 border border-[#CEFF00]/40 bg-[#CEFF00]/10 hover:bg-[#CEFF00]/20 text-[#CEFF00] rounded-lg text-xs font-bold transition-all shadow-xs"
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
            className="h-9 flex items-center gap-1.5 px-3.5 bg-[#CEFF00] hover:bg-[#b8e600] text-black text-xs font-black rounded-lg shadow-xs shadow-[#CEFF00]/20 transition-all"
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
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-[#CEFF00] text-black shadow-xs'
                              : 'bg-[#1E1E24] text-zinc-300'
                          }`}>
                            {getInitials(rec.player.name)}
                          </div>
                          <span className="absolute -bottom-1 -right-1 text-[10px] leading-none">
                            {getFlag(rec.player.nationality)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {rec.player.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono flex items-center gap-1.5">
                            <ClubCrest code={rec.player.team?.code || rec.player.team?.name || ''} size={13} />
                            <span>{rec.player.team?.name} · {rec.player.age}y · <strong>{valueFormatted}</strong></span>
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
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-xs transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 sm:gap-6">
              
              {/* Anchor Profile (Left, 5 cols) */}
              <div className="md:col-span-5 flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-extrabold text-base sm:text-lg text-white shadow-xs">
                    {getInitials(anchorPlayer.name)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs">
                    {getFlag(anchorPlayer.nationality)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold block">
                    Anchor Player
                  </span>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {anchorPlayer.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                    <ClubCrest code={anchorPlayer.team?.code || ''} size={16} />
                    <span>{anchorPlayer.team?.name} · {anchorPlayer.age}y · <span className="font-bold text-slate-900 dark:text-zinc-200">{anchorPlayer.estValueFormatted}</span></span>
                  </div>
                </div>
              </div>

              {/* Match % (Center, 1 col) */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0 border-y md:border-y-0 md:border-x border-slate-100 dark:border-[#27272A]">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#18181C] flex items-center justify-center text-slate-500 dark:text-zinc-400 font-mono font-bold text-[11px]">
                  VS
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white mt-1 whitespace-nowrap">
                  {comparisonTarget.matchPercentage.toFixed(1)}%
                </span>
              </div>

              {/* Target Profile (Right, 5 cols) */}
              <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-3.5 text-left md:text-right">
                <div className="min-w-0 order-2 md:order-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold block">
                    Comparison
                  </span>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {comparisonTarget.player.name}
                  </h2>
                  <div className="flex items-center justify-start md:justify-end gap-1.5 text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                    <ClubCrest code={comparisonTarget.player.team?.code || ''} size={16} />
                    <span>{comparisonTarget.player.team?.name} · {comparisonTarget.player.age}y · <span className="font-bold text-sky-600 dark:text-sky-400">€{(comparisonTarget.player.marketValue ? comparisonTarget.player.marketValue / 1e6 : 0).toFixed(0)}M</span></span>
                  </div>
                </div>

                <div className="relative shrink-0 order-1 md:order-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center font-extrabold text-base sm:text-lg text-white shadow-xs">
                    {getInitials(comparisonTarget.player.name)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs">
                    {getFlag(comparisonTarget.player.nationality)}
                  </span>
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
                        <span className={`font-bold ${anchorWins ? 'text-[#CEFF00]' : 'text-zinc-400'}`}>
                          {m.anchorVal.toFixed(m.unit === '%' ? 1 : 2)}{m.unit}
                        </span>
                        <span className="text-[11px] text-zinc-300 font-medium text-center truncate px-2 font-sans">
                          {m.label}
                        </span>
                        <span className={`font-bold ${!anchorWins ? 'text-[#00D2FF]' : 'text-zinc-400'}`}>
                          {m.targetVal.toFixed(m.unit === '%' ? 1 : 2)}{m.unit}
                        </span>
                      </div>

                      {/* Side-by-Side Duel Bar */}
                      <div className="grid grid-cols-2 gap-1.5 h-1.5 bg-[#18181C] rounded-full overflow-hidden">
                        <div className="flex justify-end">
                          <div
                            className="h-full bg-[#CEFF00] rounded-full transition-all duration-300"
                            style={{ width: `${anchorPct}%` }}
                          />
                        </div>
                        <div className="flex justify-start">
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
