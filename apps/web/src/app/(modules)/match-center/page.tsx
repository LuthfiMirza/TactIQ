'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  X,
  User,
  Bell,
  Share2,
  FlaskConical,
  Check,
  ArrowLeftRight,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

// ─── TYPES & DATA ────────────────────────────────────────────────────────────

type MatchStatusType = 'LIVE' | 'FINISHED' | 'UPCOMING';

interface MatchFixture {
  id: string;
  homeTeam: string;
  homeShort: string;
  homeColor: string;
  awayTeam: string;
  awayShort: string;
  awayColor: string;
  homeScore?: number;
  awayScore?: number;
  timeOrStatus: string;
  statusType: MatchStatusType;
  venue: string;
  xgHome?: number;
  xgAway?: number;
  projectedResult?: string;
  winProbHome?: number;
  matchdayNote?: string;
}

interface H2HEncounter {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  homeColor: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  competition: string;
  outcomeBadge: string;
  outcomeType: 'win-home' | 'win-away' | 'draw';
  formResult: 'W' | 'D' | 'L';
}

interface FormMatchDetail {
  result: 'W' | 'D' | 'L';
  opponent: string;
  opponentCode: string;
  score: string;
  isHome: boolean;
  points: number; // 3 = W, 1 = D, 0 = L
}

interface AbsentPlayer {
  name: string;
  reason: string;
  expectedReturn: string;
  type: 'injury' | 'suspension';
  photoUrl?: string;
}

const H2H_ENCOUNTERS: H2HEncounter[] = [
  {
    date: '25 Mei 2024', homeTeam: 'Man City', awayTeam: 'Man United',
    homeShort: 'MCI', awayShort: 'MUN', homeColor: '#6CABDD', awayColor: '#DA291C',
    homeScore: 1, awayScore: 2, venue: 'Wembley Stadium',
    competition: 'FA Cup Final', outcomeBadge: 'United Win', outcomeType: 'win-away',
    formResult: 'W',
  },
  {
    date: '03 Mar 2024', homeTeam: 'Man City', awayTeam: 'Man United',
    homeShort: 'MCI', awayShort: 'MUN', homeColor: '#6CABDD', awayColor: '#DA291C',
    homeScore: 3, awayScore: 1, venue: 'Etihad Stadium',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-home',
    formResult: 'L',
  },
  {
    date: '29 Okt 2023', homeTeam: 'Man United', awayTeam: 'Man City',
    homeShort: 'MUN', awayShort: 'MCI', homeColor: '#DA291C', awayColor: '#6CABDD',
    homeScore: 0, awayScore: 3, venue: 'Old Trafford',
    competition: 'Premier League', outcomeBadge: 'City Win', outcomeType: 'win-away',
    formResult: 'L',
  },
  {
    date: '03 Jun 2023', homeTeam: 'Man City', awayTeam: 'Man United',
    homeShort: 'MCI', awayShort: 'MUN', homeColor: '#6CABDD', awayColor: '#DA291C',
    homeScore: 2, awayScore: 1, venue: 'Wembley Stadium',
    competition: 'FA Cup Final', outcomeBadge: 'City Win', outcomeType: 'win-home',
    formResult: 'L',
  },
  {
    date: '14 Jan 2023', homeTeam: 'Man United', awayTeam: 'Man City',
    homeShort: 'MUN', awayShort: 'MCI', homeColor: '#DA291C', awayColor: '#6CABDD',
    homeScore: 2, awayScore: 1, venue: 'Old Trafford',
    competition: 'Premier League', outcomeBadge: 'United Win', outcomeType: 'win-home',
    formResult: 'W',
  },
];

const MATCHDAY_FIXTURES: MatchFixture[] = [
  {
    id: 'fix-1', homeTeam: 'Liverpool', homeShort: 'LIV', homeColor: '#C8102E',
    awayTeam: 'Chelsea', awayShort: 'CHE', awayColor: '#034694',
    homeScore: 3, awayScore: 1, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: 'Anfield', xgHome: 2.88, xgAway: 0.94, matchdayNote: 'High Conversion',
  },
  {
    id: 'fix-2', homeTeam: 'Aston Villa', homeShort: 'AVL', homeColor: '#95BFE5',
    awayTeam: 'Spurs', awayShort: 'TOT', awayColor: '#132257',
    timeOrStatus: '20:00 Today', statusType: 'UPCOMING',
    venue: 'Villa Park', projectedResult: 'Villa 2 — 1 Spurs', winProbHome: 48,
  },
  {
    id: 'fix-3', homeTeam: 'Newcastle', homeShort: 'NEW', homeColor: '#241F20',
    awayTeam: 'Brighton', awayShort: 'BHA', awayColor: '#0057B8',
    homeScore: 0, awayScore: 0, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: "St. James' Park", xgHome: 0.88, xgAway: 0.74, matchdayNote: 'Low Block Draw',
  },
  {
    id: 'fix-4', homeTeam: 'Bournemouth', homeShort: 'BOU', homeColor: '#DA291C',
    awayTeam: 'Arsenal', awayShort: 'ARS', awayColor: '#EF0107',
    timeOrStatus: '16:30 Tomorrow', statusType: 'UPCOMING',
    venue: 'Vitality Stadium', projectedResult: 'Sim Readiness: 94%', matchdayNote: 'Preview Active',
  },
];

const LEAGUE_STANDINGS = [
  { rank: 1, club: 'Arsenal', played: 8, gd: '+32', pts: 58, form: ['W', 'W', 'W'], isLeader: true },
  { rank: 2, club: 'Man City', played: 8, gd: '+29', pts: 56, form: ['W', 'D', 'L'], isLeader: false },
  { rank: 3, club: 'Liverpool', played: 8, gd: '+24', pts: 54, form: ['W', 'W', 'D'], isLeader: false },
  { rank: 4, club: 'Aston Villa', played: 7, gd: '+12', pts: 49, form: ['W', 'W', 'L'], isLeader: false },
];

const RECENT_FORM_DATA: { home: FormMatchDetail[]; away: FormMatchDetail[] } = {
  home: [
    { result: 'W', opponent: 'Brentford', opponentCode: 'BRE', score: '2-1', isHome: true, points: 3 },
    { result: 'W', opponent: 'Southampton', opponentCode: 'SOU', score: '3-0', isHome: false, points: 3 },
    { result: 'L', opponent: 'Liverpool', opponentCode: 'LIV', score: '0-3', isHome: true, points: 0 },
    { result: 'W', opponent: 'Fulham', opponentCode: 'FUL', score: '1-0', isHome: true, points: 3 },
    { result: 'D', opponent: 'Crystal Palace', opponentCode: 'CRY', score: '0-0', isHome: false, points: 1 },
  ],
  away: [
    { result: 'W', opponent: 'Fulham', opponentCode: 'FUL', score: '3-2', isHome: true, points: 3 },
    { result: 'D', opponent: 'Newcastle', opponentCode: 'NEW', score: '1-1', isHome: false, points: 1 },
    { result: 'W', opponent: 'Arsenal', opponentCode: 'ARS', score: '2-1', isHome: true, points: 3 },
    { result: 'W', opponent: 'Brentford', opponentCode: 'BRE', score: '2-1', isHome: true, points: 3 },
    { result: 'L', opponent: 'Tottenham', opponentCode: 'TOT', score: '1-2', isHome: false, points: 0 },
  ],
};

const PREVIEW_ABSENTEES: { home: AbsentPlayer[]; away: AbsentPlayer[] } = {
  home: [
    {
      name: 'Mason Mount',
      reason: 'Hamstring issue',
      expectedReturn: 'Mid October 2026',
      type: 'injury',
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/184341.png',
    },
    {
      name: 'Leny Yoro',
      reason: 'Foot fracture',
      expectedReturn: 'Late October 2026',
      type: 'injury',
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/513470.png',
    },
    {
      name: 'Harry Maguire',
      reason: 'Red card suspension',
      expectedReturn: '1 match ban',
      type: 'suspension',
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/95658.png',
    },
  ],
  away: [
    {
      name: 'Nathan Aké',
      reason: 'Muscle injury',
      expectedReturn: 'Late October 2026',
      type: 'injury',
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/126187.png',
    },
    {
      name: 'Oscar Bobb',
      reason: 'Leg fracture',
      expectedReturn: 'December 2026',
      type: 'injury',
      photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/503460.png',
    },
  ],
};

const STATS_DATA = {
  ALL: {
    top: [
      { label: 'Ball possession', homeVal: '54%', awayVal: '46%', homeNum: 54, awayNum: 46 },
      { label: 'Expected goals (xG)', homeVal: '4.62', awayVal: '0.38', homeNum: 4.62, awayNum: 0.38 },
      { label: 'Total shots', homeVal: 22, awayVal: 5, homeNum: 22, awayNum: 5 },
      { label: 'Shots on target', homeVal: 13, awayVal: 1, homeNum: 13, awayNum: 1 },
      { label: 'Big chances', homeVal: 8, awayVal: 0, homeNum: 8, awayNum: 0 },
      { label: 'Touches in opp. box', homeVal: 42, awayVal: 11, homeNum: 42, awayNum: 11 },
      { label: 'Accurate passes', homeVal: '512 (89%)', awayVal: '420 (83%)', homeNum: 512, awayNum: 420 },
      { label: 'Corners', homeVal: 8, awayVal: 2, homeNum: 8, awayNum: 2 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 6, awayVal: 3, homeNum: 6, awayNum: 3 },
      { label: 'Blocked shots', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
      { label: 'Shots inside box', homeVal: 17, awayVal: 2, homeNum: 17, awayNum: 2 },
      { label: 'Shots outside box', homeVal: 5, awayVal: 3, homeNum: 5, awayNum: 3 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 218, awayVal: 235, homeNum: 218, awayNum: 235 },
      { label: 'Opposition half', homeVal: 294, awayVal: 185, homeNum: 294, awayNum: 185 },
      { label: 'Accurate long balls', homeVal: '28 (72%)', awayVal: '18 (52%)', homeNum: 28, awayNum: 18 },
      { label: 'Accurate crosses', homeVal: '9 (45%)', awayVal: '2 (18%)', homeNum: 9, awayNum: 2 },
      { label: 'Offsides', homeVal: 2, awayVal: 1, homeNum: 2, awayNum: 1 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '19 (79%)', awayVal: '11 (55%)', homeNum: 19, awayNum: 11 },
      { label: 'Interceptions', homeVal: 12, awayVal: 5, homeNum: 12, awayNum: 5 },
      { label: 'Clearances', homeVal: 16, awayVal: 26, homeNum: 16, awayNum: 26 },
      { label: 'Keeper saves', homeVal: 1, awayVal: 6, homeNum: 1, awayNum: 6 },
      { label: 'Fouls committed', homeVal: 8, awayVal: 13, homeNum: 8, awayNum: 13 },
    ],
  },
  '1ST': {
    top: [
      { label: 'Ball possession', homeVal: '52%', awayVal: '48%', homeNum: 52, awayNum: 48 },
      { label: 'Expected goals (xG)', homeVal: '2.14', awayVal: '0.22', homeNum: 2.14, awayNum: 0.22 },
      { label: 'Total shots', homeVal: 10, awayVal: 3, homeNum: 10, awayNum: 3 },
      { label: 'Shots on target', homeVal: 6, awayVal: 1, homeNum: 6, awayNum: 1 },
      { label: 'Big chances', homeVal: 4, awayVal: 0, homeNum: 4, awayNum: 0 },
      { label: 'Touches in opp. box', homeVal: 19, awayVal: 6, homeNum: 19, awayNum: 6 },
      { label: 'Accurate passes', homeVal: '254 (90%)', awayVal: '230 (85%)', homeNum: 254, awayNum: 230 },
      { label: 'Corners', homeVal: 4, awayVal: 1, homeNum: 4, awayNum: 1 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 3, awayVal: 2, homeNum: 3, awayNum: 2 },
      { label: 'Blocked shots', homeVal: 1, awayVal: 0, homeNum: 1, awayNum: 0 },
      { label: 'Shots inside box', homeVal: 8, awayVal: 1, homeNum: 8, awayNum: 1 },
      { label: 'Shots outside box', homeVal: 2, awayVal: 2, homeNum: 2, awayNum: 2 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 110, awayVal: 125, homeNum: 110, awayNum: 125 },
      { label: 'Opposition half', homeVal: 144, awayVal: 105, homeNum: 144, awayNum: 105 },
      { label: 'Accurate long balls', homeVal: '14 (70%)', awayVal: '9 (50%)', homeNum: 14, awayNum: 9 },
      { label: 'Accurate crosses', homeVal: '4 (40%)', awayVal: '1 (17%)', homeNum: 4, awayNum: 1 },
      { label: 'Offsides', homeVal: 1, awayVal: 0, homeNum: 1, awayNum: 0 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '10 (83%)', awayVal: '6 (60%)', homeNum: 10, awayNum: 6 },
      { label: 'Interceptions', homeVal: 6, awayVal: 3, homeNum: 6, awayNum: 3 },
      { label: 'Clearances', homeVal: 8, awayVal: 14, homeNum: 8, awayNum: 14 },
      { label: 'Keeper saves', homeVal: 1, awayVal: 3, homeNum: 1, awayNum: 3 },
      { label: 'Fouls committed', homeVal: 4, awayVal: 6, homeNum: 4, awayNum: 6 },
    ],
  },
  '2ND': {
    top: [
      { label: 'Ball possession', homeVal: '56%', awayVal: '44%', homeNum: 56, awayNum: 44 },
      { label: 'Expected goals (xG)', homeVal: '2.48', awayVal: '0.16', homeNum: 2.48, awayNum: 0.16 },
      { label: 'Total shots', homeVal: 12, awayVal: 2, homeNum: 12, awayNum: 2 },
      { label: 'Shots on target', homeVal: 7, awayVal: 0, homeNum: 7, awayNum: 0 },
      { label: 'Big chances', homeVal: 4, awayVal: 0, homeNum: 4, awayNum: 0 },
      { label: 'Touches in opp. box', homeVal: 23, awayVal: 5, homeNum: 23, awayNum: 5 },
      { label: 'Accurate passes', homeVal: '258 (88%)', awayVal: '190 (81%)', homeNum: 258, awayNum: 190 },
      { label: 'Corners', homeVal: 4, awayVal: 1, homeNum: 4, awayNum: 1 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
      { label: 'Blocked shots', homeVal: 2, awayVal: 1, homeNum: 2, awayNum: 1 },
      { label: 'Shots inside box', homeVal: 9, awayVal: 1, homeNum: 9, awayNum: 1 },
      { label: 'Shots outside box', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 108, awayVal: 110, homeNum: 108, awayNum: 110 },
      { label: 'Opposition half', homeVal: 150, awayVal: 80, homeNum: 150, awayNum: 80 },
      { label: 'Accurate long balls', homeVal: '14 (74%)', awayVal: '9 (53%)', homeNum: 14, awayNum: 9 },
      { label: 'Accurate crosses', homeVal: '5 (50%)', awayVal: '1 (20%)', homeNum: 5, awayNum: 1 },
      { label: 'Offsides', homeVal: 1, awayVal: 1, homeNum: 1, awayNum: 1 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '9 (75%)', awayVal: '5 (50%)', homeNum: 9, awayNum: 5 },
      { label: 'Interceptions', homeVal: 6, awayVal: 2, homeNum: 6, awayNum: 2 },
      { label: 'Clearances', homeVal: 8, awayVal: 12, homeNum: 8, awayNum: 12 },
      { label: 'Keeper saves', homeVal: 0, awayVal: 3, homeNum: 0, awayNum: 3 },
      { label: 'Fouls committed', homeVal: 4, awayVal: 7, homeNum: 4, awayNum: 7 },
    ],
  },
};

interface LineupPlayer {
  num: number;
  name: string;
  shortName: string;
  pos: string;
  rating?: number;
  isCaptain?: boolean;
  isScorer?: boolean;
  photoUrl?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SubstitutePlayer {
  num: number;
  name: string;
  pos: string;
  rating?: number;
  photoUrl?: string;
  subbedInMinute?: number;
  isCaptain?: boolean;
}

interface TeamLineup {
  formation: string;
  teamRating: number;
  starters: LineupPlayer[];
  substitutes: SubstitutePlayer[];
}

const LINEUPS: { home: TeamLineup; away: TeamLineup } = {
  home: {
    formation: '4-3-3',
    teamRating: 7.7,
    starters: [
      { num: 1, name: 'Alisson Becker', shortName: 'Alisson', pos: 'GK', rating: 7.3, x: 6, y: 50, vx: 50, vy: 93, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/116535.png' },
      { num: 66, name: 'Trent Alexander-Arnold', shortName: 'Alexander-Arnold', pos: 'RB', rating: 7.6, x: 16, y: 16, vx: 83, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/169187.png' },
      { num: 5, name: 'Ibrahima Konaté', shortName: 'Konaté', pos: 'CB', rating: 7.2, x: 15, y: 38, vx: 61, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/204716.png' },
      { num: 4, name: 'Virgil van Dijk', shortName: 'Van Dijk', pos: 'CB', rating: 7.8, isCaptain: true, x: 15, y: 62, vx: 39, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/97032.png' },
      { num: 26, name: 'Andy Robertson', shortName: 'Robertson', pos: 'LB', rating: 7.1, x: 16, y: 84, vx: 17, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/122798.png' },
      { num: 38, name: 'Ryan Gravenberch', shortName: 'Gravenberch', pos: 'CM', rating: 7.4, x: 26, y: 28, vx: 32, vy: 73, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/477424.png' },
      { num: 10, name: 'Alexis Mac Allister', shortName: 'Mac Allister', pos: 'CM', rating: 7.5, x: 26, y: 72, vx: 68, vy: 73, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/243016.png' },
      { num: 8, name: 'Dominik Szoboszlai', shortName: 'Szoboszlai', pos: 'AM', rating: 7.3, x: 33, y: 50, vx: 50, vy: 66, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/247394.png' },
      { num: 11, name: 'Mohamed Salah', shortName: 'Salah', pos: 'RW', rating: 8.4, isScorer: true, x: 38, y: 18, vx: 83, vy: 59, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/118748.png' },
      { num: 20, name: 'Diogo Jota', shortName: 'Jota', pos: 'ST', rating: 7.2, x: 44, y: 50, vx: 50, vy: 55, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/194634.png' },
      { num: 7, name: 'Luis Díaz', shortName: 'Díaz', pos: 'LW', rating: 7.7, x: 38, y: 82, vx: 17, vy: 59, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/244731.png' },
    ],
    substitutes: [
      { num: 62, name: 'Caoimhín Kelleher', pos: 'GK', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/200720.png' },
      { num: 2, name: 'Joe Gomez', pos: 'DF', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/171287.png' },
      { num: 21, name: 'Kostas Tsimikas', pos: 'DF', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/214285.png' },
      { num: 17, name: 'Curtis Jones', pos: 'MF', rating: 7.6, subbedInMinute: 62, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/243568.png' },
      { num: 3, name: 'Wataru Endo', pos: 'MF', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/158534.png' },
      { num: 18, name: 'Cody Gakpo', pos: 'FW', rating: 6.9, subbedInMinute: 71, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/463650.png' },
    ],
  },
  away: {
    formation: '4-2-3-1',
    teamRating: 7.1,
    starters: [
      { num: 1, name: 'Robert Sánchez', shortName: 'Sánchez', pos: 'GK', rating: 6.7, x: 94, y: 50, vx: 50, vy: 7, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/215059.png' },
      { num: 27, name: 'Malo Gusto', shortName: 'Gusto', pos: 'RB', rating: 6.8, x: 84, y: 84, vx: 83, vy: 17, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/487500.png' },
      { num: 29, name: 'Wesley Fofana', shortName: 'Fofana', pos: 'CB', rating: 6.9, x: 85, y: 62, vx: 61, vy: 17, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/444463.png' },
      { num: 6, name: 'Levi Colwill', shortName: 'Colwill', pos: 'CB', rating: 7.0, x: 85, y: 38, vx: 39, vy: 17, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/463660.png' },
      { num: 3, name: 'Marc Cucurella', shortName: 'Cucurella', pos: 'LB', rating: 6.8, x: 84, y: 16, vx: 17, vy: 17, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/179268.png' },
      { num: 25, name: 'Moisés Caicedo', shortName: 'Caicedo', pos: 'DM', rating: 7.2, x: 74, y: 62, vx: 61, vy: 27, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/486672.png' },
      { num: 45, name: 'Roméo Lavia', shortName: 'Lavia', pos: 'DM', rating: 6.9, x: 74, y: 38, vx: 39, vy: 27, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/493108.png' },
      { num: 11, name: 'Noni Madueke', shortName: 'Madueke', pos: 'RM', rating: 6.9, x: 64, y: 82, vx: 83, vy: 37, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/476295.png' },
      { num: 20, name: 'Cole Palmer', shortName: 'Palmer', pos: 'AM', rating: 7.8, isCaptain: true, x: 65, y: 50, vx: 50, vy: 37, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/244855.png' },
      { num: 19, name: 'Jadon Sancho', shortName: 'Sancho', pos: 'LM', rating: 7.0, x: 64, y: 18, vx: 17, vy: 37, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/209244.png' },
      { num: 15, name: 'Nicolas Jackson', shortName: 'Jackson', pos: 'ST', rating: 7.4, isScorer: true, x: 56, y: 50, vx: 50, vy: 45, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/497565.png' },
    ],
    substitutes: [
      { num: 12, name: 'Filip Jörgensen', pos: 'GK', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/490459.png' },
      { num: 4, name: 'Tosin Adarabioyo', pos: 'DF', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/109745.png' },
      { num: 24, name: 'Reece James', pos: 'DF', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/225796.png' },
      { num: 8, name: 'Enzo Fernández', pos: 'MF', rating: 7.0, subbedInMinute: 55, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/493105.png' },
      { num: 14, name: 'João Félix', pos: 'FW', rating: 6.8, subbedInMinute: 68, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/463660.png' },
      { num: 18, name: 'Christopher Nkunku', pos: 'FW', rating: 7.1, subbedInMinute: 76, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/220566.png' },
    ],
  },
};

function buildTeamLineupFromApi(
  rawTeam: any,
  isHome: boolean,
  events: any[] = []
): TeamLineup {
  if (!rawTeam || !Array.isArray(rawTeam.startXI) || rawTeam.startXI.length === 0) {
    return isHome ? LINEUPS.home : LINEUPS.away;
  }

  const formation = rawTeam.formation || (isHome ? '4-3-3' : '4-2-3-1');
  const players = rawTeam.startXI;

  const rows: Record<number, any[]> = {};
  players.forEach((p: any) => {
    let r = 1;
    if (p.grid) {
      r = parseInt(p.grid.split(':')[0], 10) || 1;
    } else {
      r = p.pos === 'G' ? 1 : p.pos === 'D' ? 2 : p.pos === 'M' ? 3 : 4;
    }
    if (!rows[r]) rows[r] = [];
    rows[r].push(p);
  });

  const rowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);
  const maxRow = Math.max(...rowKeys, 4);

  const starters: LineupPlayer[] = players.map((p: any, idx: number) => {
    let r = p.grid
      ? parseInt(p.grid.split(':')[0], 10) || 1
      : p.pos === 'G'
      ? 1
      : p.pos === 'D'
      ? 2
      : p.pos === 'M'
      ? 3
      : 4;
    const rowPlayers = rows[r] || [p];
    const colIdx = rowPlayers.indexOf(p);
    const numCols = rowPlayers.length;

    let y = 50;
    if (numCols > 1) {
      const step = 68 / (numCols - 1);
      y = Math.round(16 + colIdx * step);
    }

    let x = 50;
    let vx = y;
    let vy = 50;

    if (isHome) {
      if (r === 1) {
        x = 6;
        y = 50;
        vx = 50;
        vy = 93;
      } else {
        const rowPct = (r - 1) / Math.max(1, maxRow - 1);
        x = Math.round(15 + rowPct * 30);
        vy = Math.round(83 - rowPct * 27);
      }
    } else {
      if (r === 1) {
        x = 94;
        y = 50;
        vx = 50;
        vy = 7;
      } else {
        const rowPct = (r - 1) / Math.max(1, maxRow - 1);
        x = Math.round(85 - rowPct * 30);
        vy = Math.round(17 + rowPct * 27);
      }
    }

    const shortName = p.name ? p.name.split(' ').pop() || p.name : `P${p.number}`;
    const isScorer = events.some(
      (ev) =>
        ev.type === 'Goal' &&
        (ev.player?.toLowerCase().includes(shortName.toLowerCase()) ||
          shortName.toLowerCase().includes(ev.player?.toLowerCase()))
    );

    const baseRating = 6.6 + ((p.number * 7) % 15) / 10;
    const rating = isScorer ? 8.2 : Number(baseRating.toFixed(1));

    return {
      num: p.number || idx + 1,
      name: p.name,
      shortName,
      pos: p.pos === 'G' ? 'GK' : p.pos === 'D' ? 'CB' : p.pos === 'M' ? 'CM' : 'FW',
      rating,
      isCaptain: colIdx === 0 && r === 2,
      isScorer,
      x,
      y,
      vx,
      vy,
      photoUrl: p.photoUrl || (p.id ? `https://media.api-sports.io/football/players/${p.id}.png` : undefined),
    };
  });

  const substitutes: SubstitutePlayer[] = (rawTeam.substitutes || []).slice(0, 9).map((p: any, idx: number) => ({
    num: p.number || idx + 12,
    name: p.name,
    pos: p.pos === 'G' ? 'GK' : p.pos === 'D' ? 'DF' : p.pos === 'M' ? 'MF' : 'FW',
    rating: 6.5,
    photoUrl: p.photoUrl || (p.id ? `https://media.api-sports.io/football/players/${p.id}.png` : undefined),
  }));

  const avgRating =
    starters.reduce((acc, curr) => acc + (curr.rating || 7.0), 0) / Math.max(1, starters.length);

  return {
    formation,
    teamRating: Number(avgRating.toFixed(1)),
    starters,
    substitutes,
  };
}

function getTeamCoach(teamName: string): { name: string; photoUrl: string } {
  const lower = (teamName || '').toLowerCase();
  if (lower.includes('united') || lower.includes('manchester united')) {
    return { name: 'Rúben Amorim', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man1427.png' };
  }
  if (lower.includes('city') || lower.includes('manchester city')) {
    return { name: 'Pep Guardiola', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man279.png' };
  }
  if (lower.includes('brazil') || lower.includes('brasil')) {
    return { name: 'Dorival Júnior', photoUrl: 'https://media.api-sports.io/football/coachs/1838.png' };
  }
  if (lower.includes('australia')) {
    return { name: 'Tony Popovic', photoUrl: 'https://media.api-sports.io/football/coachs/1723.png' };
  }
  if (lower.includes('arsenal')) {
    return { name: 'Mikel Arteta', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man5101.png' };
  }
  if (lower.includes('chelsea')) {
    return { name: 'Enzo Maresca', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man5300.png' };
  }
  if (lower.includes('liverpool')) {
    return { name: 'Arne Slot', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man5300.png' };
  }
  if (lower.includes('tottenham') || lower.includes('spurs')) {
    return { name: 'Ange Postecoglou', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man5101.png' };
  }
  if (lower.includes('aston villa') || lower.includes('villa')) {
    return { name: 'Unai Emery', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man279.png' };
  }
  if (lower.includes('newcastle')) {
    return { name: 'Eddie Howe', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man1427.png' };
  }
  if (lower.includes('brighton')) {
    return { name: 'Fabian Hürzeler', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man5300.png' };
  }
  if (lower.includes('bournemouth')) {
    return { name: 'Andoni Iraola', photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/man5101.png' };
  }
  if (lower.includes('real madrid') || lower.includes('madrid')) {
    return { name: 'Carlo Ancelotti', photoUrl: 'https://media.api-sports.io/football/coachs/1427.png' };
  }
  if (lower.includes('barcelona') || lower.includes('barca')) {
    return { name: 'Hansi Flick', photoUrl: 'https://media.api-sports.io/football/coachs/279.png' };
  }
  return { name: `${teamName} Manager`, photoUrl: '' };
}

function getTeamColor(teamName: string): string {
  const lower = (teamName || '').toLowerCase();
  if (lower.includes('brazil') || lower.includes('brasil')) return '#FED100';
  if (lower.includes('australia')) return '#00843D';
  if (lower.includes('liverpool')) return '#C8102E';
  if (lower.includes('chelsea')) return '#034694';
  if (lower.includes('manchester united') || lower.includes('man united')) return '#DA291C';
  if (lower.includes('manchester city') || lower.includes('man city')) return '#6CABDD';
  if (lower.includes('arsenal')) return '#EF0107';
  if (lower.includes('tottenham') || lower.includes('spurs')) return '#132257';
  if (lower.includes('aston villa') || lower.includes('villa')) return '#670E36';
  if (lower.includes('newcastle')) return '#241F20';
  if (lower.includes('brighton')) return '#0057B8';
  if (lower.includes('bournemouth')) return '#DA291C';
  if (lower.includes('real madrid')) return '#EEA320';
  if (lower.includes('barcelona')) return '#A50044';
  if (lower.includes('bayern')) return '#DC052D';
  if (lower.includes('dortmund')) return '#FDE100';
  if (lower.includes('psg') || lower.includes('paris')) return '#004170';
  if (lower.includes('tottenham')) return '#132257';
  if (lower.includes('aston villa')) return '#670E36';
  if (lower.includes('newcastle')) return '#241F20';
  if (lower.includes('argentina')) return '#75AADB';
  if (lower.includes('france')) return '#002654';
  if (lower.includes('germany')) return '#111111';
  if (lower.includes('spain')) return '#AA151B';
  if (lower.includes('italy')) return '#0064AA';
  if (lower.includes('england')) return '#CE1124';
  if (lower.includes('netherlands')) return '#FF4F00';
  if (lower.includes('portugal')) return '#E42518';
  if (lower.includes('japan')) return '#001489';
  if (lower.includes('indonesia')) return '#DA251D';
  return '#10B981';
}

function MatchStatRow({
  label,
  homeVal,
  awayVal,
  homeNum,
  awayNum,
  homeColor = '#DA291C',
  awayColor = '#6CABDD',
}: {
  label: string;
  homeVal: string | number;
  awayVal: string | number;
  homeNum: number;
  awayNum: number;
  homeColor?: string;
  awayColor?: string;
}) {
  const total = homeNum + awayNum;
  const homePct = total > 0 ? Math.round((homeNum / total) * 100) : 50;
  const awayPct = 100 - homePct;
  const isHomeWinner = homeNum > awayNum;
  const isAwayWinner = awayNum > homeNum;

  return (
    <div className="py-2 sm:py-2.5">
      <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
        <span
          className={`min-w-[68px] sm:min-w-[80px] text-left shrink-0 whitespace-nowrap transition-colors text-[10.5px] sm:text-xs ${
            isHomeWinner
              ? 'font-bold text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-zinc-400 font-medium'
          }`}
        >
          {homeVal}
        </span>

        <span className="text-[10px] sm:text-xs font-sans font-medium text-slate-600 dark:text-zinc-300 text-center flex-1 px-2 truncate">
          {label}
        </span>

        <span
          className={`min-w-[68px] sm:min-w-[80px] text-right shrink-0 whitespace-nowrap transition-colors text-[10.5px] sm:text-xs ${
            isAwayWinner
              ? 'font-bold text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-zinc-400 font-medium'
          }`}
        >
          {awayVal}
        </span>
      </div>

      <div className="flex h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800/80 gap-0.5 sm:gap-1">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${homePct}%`, backgroundColor: homeColor }}
        />
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
        />
      </div>
    </div>
  );
}

function UniversalPlayerNode({
  p,
  isVertical = false,
  hideRating = false,
}: {
  p: LineupPlayer;
  isVertical?: boolean;
  hideRating?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const posX = isVertical ? p.vx : p.x;
  const posY = isVertical ? p.vy : p.y;
  const hasPhoto = Boolean(p.photoUrl) && !imgError;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-transform hover:z-30 hover:scale-105 pointer-events-auto"
      style={{ left: `${posX}%`, top: `${posY}%` }}
    >
      <div className="relative">
        <div className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full ring-1 ring-white/20 overflow-hidden shadow-md flex items-center justify-center select-none bg-zinc-900">
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
            <User size={15} className="text-zinc-500/70" />
          </div>

          {hasPhoto && (
            <img
              src={p.photoUrl}
              alt={p.name}
              referrerPolicy="no-referrer"
              className="relative z-10 w-full h-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {!hideRating && p.rating !== undefined && (
          <div
            className={`absolute -top-1 -right-2 z-20 px-1 py-0.2 rounded-full font-mono text-[8.5px] font-bold leading-tight shadow-xs select-none border border-black/40 ${
              p.rating >= 8.0
                ? 'bg-sky-500 text-white font-black'
                : p.rating >= 7.0
                ? 'bg-emerald-600 text-white'
                : p.rating >= 6.0
                ? 'bg-amber-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {p.rating.toFixed(1)}
          </div>
        )}

        {p.isCaptain && (
          <div className="absolute -bottom-1 -left-1 z-20 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] flex items-center justify-center shadow-xs border border-black/40">
            C
          </div>
        )}

        {!hideRating && p.isScorer && (
          <div
            className={`absolute -bottom-1 z-20 ${
              p.isCaptain ? '-right-1' : '-left-1'
            } w-3.5 h-3.5 rounded-full bg-slate-900 border border-white/40 flex items-center justify-center text-[8px] shadow-xs`}
          >
            ⚽
          </div>
        )}
      </div>

      <div className="mt-0.5 sm:mt-1 flex items-center justify-center gap-1 text-center select-none whitespace-nowrap">
        <span className="font-mono text-zinc-400 text-[8px] sm:text-[9px] font-bold drop-shadow-sm">{p.num}</span>
        <span className="text-white text-[9.5px] sm:text-[10px] font-semibold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] max-w-[56px] sm:max-w-[66px] truncate">
          {p.shortName}
        </span>
      </div>
    </div>
  );
}

function SubstituteRow({
  player,
  hideRating = false,
}: {
  player: SubstitutePlayer;
  hideRating?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = Boolean(player.photoUrl) && !imgError;

  return (
    <div className="flex items-center justify-between py-1.5 px-1 hover:bg-slate-100/60 dark:hover:bg-white/[0.03] rounded-md transition-colors group">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500 w-4 text-right shrink-0 font-medium">
          {player.num}
        </span>
        <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800/80 ring-1 ring-white/10 shrink-0 flex items-center justify-center">
          {hasPhoto ? (
            <img
              src={player.photoUrl}
              alt={player.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          ) : (
            <User className="w-3 h-3 text-zinc-400" />
          )}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {player.name}
          </span>
          {player.isCaptain && (
            <span className="text-[9px] font-mono font-bold text-amber-500">
              (C)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {player.subbedInMinute && !hideRating ? (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400">
            <ArrowLeftRight className="w-2.5 h-2.5" />
            <span>{player.subbedInMinute}&apos;</span>
          </span>
        ) : null}
        <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider min-w-[20px] text-center">
          {player.pos}
        </span>
        {!hideRating && player.rating ? (
          <span
            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-white min-w-[26px] text-center ${
              player.rating >= 7.0
                ? 'bg-emerald-600'
                : player.rating >= 6.0
                ? 'bg-amber-600'
                : 'bg-rose-600'
            }`}
          >
            {player.rating.toFixed(1)}
          </span>
        ) : !hideRating ? (
          <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-600 min-w-[26px] text-center">
            —
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function MatchCenterPage() {
  const [mounted, setMounted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<MatchStatusType>('LIVE');
  const [matchTab, setMatchTab] = useState<string>('stats');
  const [statsPeriod, setStatsPeriod] = useState<'ALL' | '1ST' | '2ND'>('ALL');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [fixtures, setFixtures] = useState<MatchFixture[]>(MATCHDAY_FIXTURES);
  const [standings, setStandings] = useState<Array<{ rank: number; club: string; code?: string; played: number; gd: string; pts: number; form: string[]; isLeader: boolean }>>(LEAGUE_STANDINGS);
  const [absentees, setAbsentees] = useState(PREVIEW_ABSENTEES);
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncStatusToast, setSyncStatusToast] = useState<string | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [liveEventToast, setLiveEventToast] = useState<any | null>(null);
  const [isSimulatingEvent, setIsSimulatingEvent] = useState(false);
  const [scoreFlash, setScoreFlash] = useState(false);
  const [predictionData, setPredictionData] = useState<{
    score: string;
    homeWin: number;
    draw: number;
    awayWin: number;
    insights: string[];
  } | null>(null);

  // Active match state controlling the central hero scoreboard & tabs
  const [activeMatch, setActiveMatch] = useState<{
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
    statusType: MatchStatusType;
    timeOrStatus: string;
    scorersHome: string[];
    scorersAway: string[];
    xgHome: number;
    xgAway: number;
    winProbHome: number;
    winProbDraw: number;
    winProbAway: number;
    isLiveFeed?: boolean;
    events?: Array<{ minute: number; team: string; player: string; type: string; detail?: string }>;
  }>({
    id: 'fix-1',
    league: 'Premier League · Matchday 8',
    venue: 'Anfield, Liverpool',
    homeTeam: 'Liverpool',
    homeShort: 'LIV',
    homeColor: '#C8102E',
    awayTeam: 'Chelsea',
    awayShort: 'CHE',
    awayColor: '#034694',
    homeScore: 2,
    awayScore: 1,
    statusType: 'LIVE',
    timeOrStatus: "74'",
    scorersHome: ["Mohamed Salah 29' (P)", "Curtis Jones 51'"],
    scorersAway: ["Nicolas Jackson 48'"],
    xgHome: 1.94,
    xgAway: 1.12,
    winProbHome: 72,
    winProbDraw: 18,
    winProbAway: 10,
    isLiveFeed: false,
  });

  const [activeLineup, setActiveLineup] = useState<{ home: TeamLineup; away: TeamLineup }>(LINEUPS);
  const [matchStatsData, setMatchStatsData] = useState<typeof STATS_DATA>(STATS_DATA);
  const [matchH2HData, setMatchH2HData] = useState<H2HEncounter[]>(H2H_ENCOUNTERS);
  const [h2hSummary, setH2HSummary] = useState<{ homeWins: number; draws: number; awayWins: number }>({
    homeWins: 2,
    draws: 0,
    awayWins: 3,
  });

  const handleSelectLiveMatch = (m: any) => {
    const goalEvents = Array.isArray(m.events) ? m.events.filter((ev: any) => ev.type === 'Goal') : [];
    const homeGoals = goalEvents
      .filter((ev: any) => ev.team === m.homeTeam || ev.team?.toLowerCase().includes(m.homeTeam?.toLowerCase()) || m.homeTeam?.toLowerCase().includes(ev.team?.toLowerCase()))
      .map((ev: any) => `${ev.player || 'Goal'} ${ev.minute}'${ev.detail ? ` (${ev.detail})` : ''}`);
    const awayGoals = goalEvents
      .filter((ev: any) => ev.team === m.awayTeam || ev.team?.toLowerCase().includes(m.awayTeam?.toLowerCase()) || m.awayTeam?.toLowerCase().includes(ev.team?.toLowerCase()))
      .map((ev: any) => `${ev.player || 'Goal'} ${ev.minute}'${ev.detail ? ` (${ev.detail})` : ''}`);

    const hScore = Number(m.homeScore ?? 0);
    const aScore = Number(m.awayScore ?? 0);
    const xgH = Number(Math.max(0.35, hScore * 0.82 + 0.45).toFixed(2));
    const xgA = Number(Math.max(0.30, aScore * 0.82 + 0.35).toFixed(2));

    let pHome = 35, pDraw = 33, pAway = 32;
    if (hScore > aScore) {
      pHome = Math.min(94, 52 + (hScore - aScore) * 18);
      pDraw = Math.max(4, 28 - (hScore - aScore) * 10);
      pAway = Math.max(2, 100 - pHome - pDraw);
    } else if (aScore > hScore) {
      pAway = Math.min(94, 52 + (aScore - hScore) * 18);
      pDraw = Math.max(4, 28 - (aScore - hScore) * 10);
      pHome = Math.max(2, 100 - pAway - pDraw);
    }

    const hShort = (m.homeTeam || 'HOM').slice(0, 3).toUpperCase();
    const aShort = (m.awayTeam || 'AWA').slice(0, 3).toUpperCase();

    const hColor = getTeamColor(m.homeTeam);
    const aColor = getTeamColor(m.awayTeam);

    setActiveMatch({
      id: String(m.fixtureId),
      league: `${m.league} · Live In-Play`,
      venue: 'International Stadium',
      homeTeam: m.homeTeam,
      homeShort: hShort,
      homeColor: hColor,
      awayTeam: m.awayTeam,
      awayShort: aShort,
      awayColor: aColor,
      homeScore: hScore,
      awayScore: aScore,
      statusType: m.status === 'FT' ? 'FINISHED' : 'LIVE',
      timeOrStatus: m.status === 'HT' ? 'Half Time' : `${m.minute ?? 45}'`,
      scorersHome: homeGoals.length > 0 ? homeGoals : ['–'],
      scorersAway: awayGoals.length > 0 ? awayGoals : ['–'],
      xgHome: xgH,
      xgAway: xgA,
      winProbHome: pHome,
      winProbDraw: pDraw,
      winProbAway: pAway,
      isLiveFeed: true,
      events: m.events || [],
    });

    // Fetch live lineup, statistics, and H2H from API
    if (m.fixtureId) {
      api.getMatchLineup(String(m.fixtureId), { home: m.homeTeam, away: m.awayTeam }).then((res) => {
        if (res && res.home && res.away) {
          const homeL = buildTeamLineupFromApi(res.home, true, m.events || []);
          const awayL = buildTeamLineupFromApi(res.away, false, m.events || []);
          setActiveLineup({ home: homeL, away: awayL });
        }
      }).catch((e) => console.warn('Lineup fetch err:', e));

      api.getMatchStatistics(String(m.fixtureId), { home: m.homeTeam, away: m.awayTeam }).then((res) => {
        if (res && res.ALL) {
          setMatchStatsData(res);
        }
      }).catch((e) => console.warn('Stats fetch err:', e));

      const h2hQuery = m.homeTeamId && m.awayTeamId ? `${m.homeTeamId}-${m.awayTeamId}` : undefined;
      api.getMatchH2H(String(m.fixtureId), { h2h: h2hQuery, home: m.homeTeam, away: m.awayTeam }).then((res) => {
        if (res && Array.isArray(res.encounters) && res.encounters.length > 0) {
          setH2HSummary({
            homeWins: res.homeWins ?? 0,
            draws: res.draws ?? 0,
            awayWins: res.awayWins ?? 0,
          });
          const mappedEncounters: H2HEncounter[] = res.encounters.map((enc: any) => ({
            date: enc.date,
            homeTeam: enc.homeTeam,
            awayTeam: enc.awayTeam,
            homeShort: enc.homeShort || enc.homeTeam.slice(0, 3).toUpperCase(),
            awayShort: enc.awayShort || enc.awayTeam.slice(0, 3).toUpperCase(),
            homeScore: enc.homeScore,
            awayScore: enc.awayScore,
            competition: enc.competition,
          }));
          setMatchH2HData(mappedEncounters);
        }
      }).catch((e) => console.warn('H2H fetch err:', e));
    }

    setCurrentStatus(m.status === 'FT' ? 'FINISHED' : 'LIVE');
    setMatchTab('stats');
  };

  const handleSelectFixture = (fix: MatchFixture) => {
    const hScore = fix.homeScore ?? (fix.statusType === 'UPCOMING' ? 0 : 2);
    const aScore = fix.awayScore ?? (fix.statusType === 'UPCOMING' ? 0 : 1);
    const xgH = fix.xgHome ?? 1.85;
    const xgA = fix.xgAway ?? 1.10;

    setActiveMatch({
      id: fix.id,
      league: 'Premier League · Matchday 8',
      venue: fix.venue,
      homeTeam: fix.homeTeam,
      homeShort: fix.homeShort,
      homeColor: fix.homeColor,
      awayTeam: fix.awayTeam,
      awayShort: fix.awayShort,
      awayColor: fix.awayColor,
      homeScore: hScore,
      awayScore: aScore,
      statusType: fix.statusType,
      timeOrStatus: fix.timeOrStatus,
      scorersHome: fix.statusType !== 'UPCOMING' ? [`${fix.homeTeam} Goal 34'`] : ['–'],
      scorersAway: fix.statusType !== 'UPCOMING' ? [`${fix.awayTeam} Goal 61'`] : ['–'],
      xgHome: xgH,
      xgAway: xgA,
      winProbHome: fix.winProbHome ?? 48,
      winProbDraw: 28,
      winProbAway: 24,
      isLiveFeed: false,
    });

    // Fetch dynamic lineup, stats, and H2H for the selected fixture immediately
    api.getMatchLineup(fix.id, { home: fix.homeTeam, away: fix.awayTeam })
      .then((res) => {
        if (res && res.home && res.away) {
          const homeL = buildTeamLineupFromApi(res.home, true, []);
          const awayL = buildTeamLineupFromApi(res.away, false, []);
          setActiveLineup({ home: homeL, away: awayL });
        }
      })
      .catch((e) => console.warn('[MatchCenter] Fixture lineup fetch err:', e));

    api.getMatchStatistics(fix.id, { home: fix.homeTeam, away: fix.awayTeam })
      .then((res) => {
        if (res && res.ALL) {
          setMatchStatsData(res);
        }
      })
      .catch((e) => console.warn('[MatchCenter] Fixture stats fetch err:', e));

    api.getMatchH2H(fix.id, { home: fix.homeTeam, away: fix.awayTeam })
      .then((res) => {
        if (res && Array.isArray(res.encounters) && res.encounters.length > 0) {
          setH2HSummary({
            homeWins: res.homeWins ?? 0,
            draws: res.draws ?? 0,
            awayWins: res.awayWins ?? 0,
          });
          const mappedEncounters: H2HEncounter[] = res.encounters.map((enc: any) => ({
            date: enc.date,
            homeTeam: enc.homeTeam,
            awayTeam: enc.awayTeam,
            homeShort: enc.homeShort || enc.homeTeam.slice(0, 3).toUpperCase(),
            awayShort: enc.awayShort || enc.awayTeam.slice(0, 3).toUpperCase(),
            homeScore: enc.homeScore,
            awayScore: enc.awayScore,
            competition: enc.competition,
          }));
          setMatchH2HData(mappedEncounters);
        }
      })
      .catch((e) => console.warn('[MatchCenter] Fixture H2H fetch err:', e));

    setCurrentStatus(fix.statusType);
    if (fix.statusType === 'UPCOMING') {
      setMatchTab('preview');
    } else {
      setMatchTab('stats');
    }
  };

  const applyLiveScoresUpdate = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return;
    setLiveScores(data);

    // If active match is a live feed match, keep score and clock in real-time sync
    setActiveMatch((prev) => {
      if (prev.isLiveFeed) {
        const live = data.find((d: any) => String(d.fixtureId) === prev.id);
        if (live) {
          const goalEvents = Array.isArray(live.events) ? live.events.filter((ev: any) => ev.type === 'Goal') : [];
          const homeGoals = goalEvents
            .filter((ev: any) => ev.team === live.homeTeam || ev.team?.toLowerCase().includes(live.homeTeam?.toLowerCase()) || live.homeTeam?.toLowerCase().includes(ev.team?.toLowerCase()))
            .map((ev: any) => `${ev.player || 'Goal'} ${ev.minute}'${ev.detail ? ` (${ev.detail})` : ''}`);
          const awayGoals = goalEvents
            .filter((ev: any) => ev.team === live.awayTeam || ev.team?.toLowerCase().includes(live.awayTeam?.toLowerCase()) || live.awayTeam?.toLowerCase().includes(ev.team?.toLowerCase()))
            .map((ev: any) => `${ev.player || 'Goal'} ${ev.minute}'${ev.detail ? ` (${ev.detail})` : ''}`);

          const newHScore = Number(live.homeScore ?? prev.homeScore);
          const newAScore = Number(live.awayScore ?? prev.awayScore);

          if (newHScore !== prev.homeScore || newAScore !== prev.awayScore) {
            setScoreFlash(true);
            setTimeout(() => setScoreFlash(false), 2500);
          }

          // Dynamic xG calculation based on elapsed time and score
          const newXgHome = Number((0.45 + (homeGoals.length * 0.72) + ((live.minute || 20) * 0.015)).toFixed(2));
          const newXgAway = Number((0.85 + (awayGoals.length * 0.65) + ((live.minute || 20) * 0.018)).toFixed(2));

          return {
            ...prev,
            homeScore: newHScore,
            awayScore: newAScore,
            timeOrStatus: live.status === 'HT' ? 'Half Time' : `${live.minute ?? 45}'`,
            statusType: live.status === 'FT' ? 'FINISHED' : 'LIVE',
            scorersHome: homeGoals.length > 0 ? homeGoals : prev.scorersHome,
            scorersAway: awayGoals.length > 0 ? awayGoals : prev.scorersAway,
            events: live.events || prev.events,
            xgHome: newXgHome,
            xgAway: newXgAway,
          };
        }
      }
      return prev;
    });
  };

  const fetchLiveScores = () => {
    api.getLiveScores()
      .then((data) => {
        applyLiveScoresUpdate(data);
      })
      .catch((e) => console.warn('[MatchCenter] Live scores fetch error:', e));
  };

  const handleSimulateLiveGoal = async (teamSide: 'home' | 'away' = 'away') => {
    setIsSimulatingEvent(true);
    try {
      const res = await api.simulateLiveEvent({
        fixtureId: activeMatch.id,
        team: teamSide,
      });
      if (res?.data?.event) {
        const ev = res.data.event;
        setLiveEventToast(ev);
        setScoreFlash(true);
        setTimeout(() => setScoreFlash(false), 2500);
        setTimeout(() => setLiveEventToast(null), 7000);
      }
    } catch (err) {
      console.warn('Simulation trigger failed:', err);
    } finally {
      setIsSimulatingEvent(false);
    }
  };

  const handleSyncLiveData = async () => {
    setIsSyncingLive(true);
    setSyncStatusToast('Menghubungi Football-Data.org & API-Football...');
    try {
      const res = await api.triggerETLSync();
      if (res.success && res.data) {
        setSyncStatusToast(`Sinkronisasi Sukses! ${res.data.syncedStandings} tim EPL & ${res.data.syncedFixtures} laga diperbarui.`);
        // Reload standings
        const updatedStandings = await api.getStandings();
        if (Array.isArray(updatedStandings) && updatedStandings.length > 0) {
          setStandings(updatedStandings.map((s) => ({
            rank: s.position,
            club: s.team?.name || 'Club',
            code: s.team?.code || 'CLUB',
            played: s.played,
            gd: s.goalDifference > 0 ? `+${s.goalDifference}` : `${s.goalDifference}`,
            pts: s.points,
            form: s.won >= 4 ? ['W', 'W', 'W'] : s.won >= 2 ? ['W', 'D', 'W'] : ['L', 'D', 'L'],
            isLeader: s.position === 1,
          })));
        }
        fetchLiveScores();
      }
    } catch (err) {
      setSyncStatusToast('Sinkronisasi selesai menggunakan data aktif.');
    } finally {
      setIsSyncingLive(false);
      setTimeout(() => setSyncStatusToast(null), 6000);
    }
  };

  useEffect(() => {
    setMounted(true);

    // Initial fetch live scores & 10s fallback polling
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 10000);

    // WebSocket real-time subscription
    const socket = getSocket();

    const onConnect = () => {
      console.log('⚡ Connected to TactIQ Live WebSocket Hub');
      setIsWsConnected(true);
    };

    const onDisconnect = () => {
      setIsWsConnected(false);
    };

    const onScoreUpdate = (data: any[]) => {
      setIsWsConnected(true);
      applyLiveScoresUpdate(data);
    };

    const onMatchEvent = (event: any) => {
      setLiveEventToast(event);
      setScoreFlash(true);
      setTimeout(() => setScoreFlash(false), 2500);
      setTimeout(() => setLiveEventToast(null), 7000);
    };

    if (socket.connected) {
      setIsWsConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('match_score_update', onScoreUpdate);
    socket.on('match_event', onMatchEvent);

    // Fetch real matchday fixtures from PostgreSQL
    api.getFixtures()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: MatchFixture[] = data.map((f, idx) => ({
            id: f.id,
            homeTeam: f.homeTeam?.name || 'Home Club',
            homeShort: f.homeTeam?.code || 'HOM',
            homeColor: '#6CABDD',
            awayTeam: f.awayTeam?.name || 'Away Club',
            awayShort: f.awayTeam?.code || 'AWA',
            awayColor: '#DA291C',
            homeScore: f.homeScore ?? undefined,
            awayScore: f.awayScore ?? undefined,
            timeOrStatus: f.status === 'SCHEDULED' ? 'Upcoming' : f.status,
            statusType: (f.status === 'SCHEDULED' ? 'UPCOMING' : f.status === 'FINISHED' ? 'FINISHED' : 'LIVE') as MatchStatusType,
            venue: f.venue,
            xgHome: Number((1.85 + idx * 0.22).toFixed(2)),
            xgAway: Number((1.10 + idx * 0.15).toFixed(2)),
            matchdayNote: f.status === 'SCHEDULED' ? 'TactIQ AI Preview Ready' : 'Final Match Stats',
          }));
          setFixtures(mapped);
        }
      })
      .catch((err) => console.warn('[MatchCenter] Real fixtures fetch error:', err));

    // Fetch real standings table from PostgreSQL
    api.getStandings()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s) => ({
            rank: s.position,
            club: s.team?.name || 'Club',
            code: s.team?.code || 'CLUB',
            played: s.played,
            gd: s.goalDifference > 0 ? `+${s.goalDifference}` : `${s.goalDifference}`,
            pts: s.points,
            form: s.won >= 4 ? ['W', 'W', 'W'] : s.won >= 2 ? ['W', 'D', 'W'] : ['L', 'D', 'L'],
            isLeader: s.position === 1,
          }));
          setStandings(mapped);
        }
      })
      .catch((err) => console.warn('[MatchCenter] Real standings fetch error:', err));

    // Fetch live Transfermarkt injury & suspension absentees
    fetch('http://localhost:4000/api/v1/matches/preview/absentees?home=MCI&away=ARS')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setAbsentees(json.data);
        }
      })
      .catch(() => {});

    return () => {
      clearInterval(interval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('match_score_update', onScoreUpdate);
      socket.off('match_event', onMatchEvent);
    };
  }, []);

  // Auto-sync lineup, statistics, and H2H whenever activeMatch changes
  useEffect(() => {
    if (activeMatch.id) {
      api.getMatchLineup(activeMatch.id, { home: activeMatch.homeTeam, away: activeMatch.awayTeam })
        .then((res) => {
          if (res && res.home && res.away) {
            const homeL = buildTeamLineupFromApi(res.home, true, activeMatch.events || []);
            const awayL = buildTeamLineupFromApi(res.away, false, activeMatch.events || []);
            setActiveLineup({ home: homeL, away: awayL });
          }
        })
        .catch((e) => console.warn('[MatchCenter] Auto lineup sync err:', e));

      api.getMatchStatistics(activeMatch.id, { home: activeMatch.homeTeam, away: activeMatch.awayTeam })
        .then((res) => {
          if (res && res.ALL) {
            setMatchStatsData(res);
          }
        })
        .catch((e) => console.warn('[MatchCenter] Auto stats sync err:', e));

      api.getMatchH2H(activeMatch.id, {
        home: activeMatch.homeTeam,
        away: activeMatch.awayTeam,
      })
        .then((res) => {
          if (res && Array.isArray(res.encounters) && res.encounters.length > 0) {
            setH2HSummary({
              homeWins: res.homeWins ?? 0,
              draws: res.draws ?? 0,
              awayWins: res.awayWins ?? 0,
            });
            const mappedEncounters: H2HEncounter[] = res.encounters.map((enc: any) => ({
              date: enc.date,
              homeTeam: enc.homeTeam,
              awayTeam: enc.awayTeam,
              homeShort: enc.homeShort || enc.homeTeam.slice(0, 3).toUpperCase(),
              awayShort: enc.awayShort || enc.awayTeam.slice(0, 3).toUpperCase(),
              homeScore: enc.homeScore,
              awayScore: enc.awayScore,
              competition: enc.competition,
            }));
            setMatchH2HData(mappedEncounters);
          }
        })
        .catch((e) => console.warn('[MatchCenter] Auto H2H sync err:', e));
    }
  }, [activeMatch.id, activeMatch.homeTeam, activeMatch.awayTeam]);

  const handleOpenAiModal = async () => {
    setShowAiModal(true);
    try {
      const res = await api.predictMatch({ fixtureId: 'fixture-mci-ars' });
      if (res && res.winProbabilities) {
        setPredictionData({
          score: res.predictedScore,
          homeWin: res.winProbabilities.homeWin,
          draw: res.winProbabilities.draw,
          awayWin: res.winProbabilities.awayWin,
          insights: res.insights || [],
        });
      }
    } catch (e) {
      console.warn('[MatchCenter] Prediction API fallback:', e);
    }
  };

  const handleToggleNotification = () => {
    setIsNotified((prev) => !prev);
  };

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // fallback
    }
    setCopiedToast(true);
    setTimeout(() => {
      setCopiedToast(false);
    }, 2200);
  };

  const handleStatusChange = (status: MatchStatusType) => {
    setCurrentStatus(status);
    if (status === 'UPCOMING') {
      setMatchTab('preview');
    } else {
      setMatchTab('stats');
    }
  };

  const periodInfo = {
    homeScore: statsPeriod === '1ST' ? Math.floor(activeMatch.homeScore / 2) : activeMatch.homeScore,
    awayScore: statsPeriod === '1ST' ? Math.floor(activeMatch.awayScore / 2) : activeMatch.awayScore,
    statusText: statsPeriod === '1ST' ? 'Half Time' : statsPeriod === '2ND' ? '2nd Half' : activeMatch.timeOrStatus,
    scorersHome: activeMatch.scorersHome,
    scorersAway: activeMatch.scorersAway,
    homeProb: `${activeMatch.winProbHome}%`,
    drawProb: `${activeMatch.winProbDraw}%`,
    awayProb: `${activeMatch.winProbAway}%`,
    homeWidth: `${activeMatch.winProbHome}%`,
    drawWidth: `${activeMatch.winProbDraw}%`,
    awayWidth: `${activeMatch.winProbAway}%`,
    munProb: `${activeMatch.winProbHome}%`,
    mciProb: `${activeMatch.winProbAway}%`,
    munWidth: `${activeMatch.winProbHome}%`,
    mciWidth: `${activeMatch.winProbAway}%`,
  };

  const activeStats = matchStatsData[statsPeriod] || STATS_DATA[statsPeriod];
  const isPremierLeague =
    activeMatch.league.toLowerCase().includes('premier league') ||
    ['MCI', 'ARS', 'LIV', 'CHE', 'MUN', 'TOT', 'NEW', 'AVL', 'FUL', 'BHA'].includes(activeMatch.homeShort);
  const homeCoach = getTeamCoach(activeMatch.homeTeam);
  const awayCoach = getTeamCoach(activeMatch.awayTeam);

  const availableTabs = currentStatus === 'UPCOMING'
    ? ['preview', 'h2h', 'lineups', 'table']
    : ['stats', 'h2h', 'lineups', 'table'];

  // Helper koordinat SVG Dual Line Chart
  // Y: Win = 20, Draw = 60, Loss = 100
  const getYCoordinate = (pts: number) => {
    if (pts === 3) return 20;
    if (pts === 1) return 60;
    return 100;
  };

  const getPointsPath = (matches: FormMatchDetail[]) => {
    const xCoords = [30, 105, 180, 255, 330];
    return matches.map((m, idx) => `${xCoords[idx]},${getYCoordinate(m.points)}`).join(' L ');
  };

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0c0c0e] animate-pulse" />
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6 pb-12">
      
      {/* ── Matchday Header & Dev Mode Status Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3.5 border-b border-slate-200 dark:border-[#27272A] pb-3 sm:pb-3.5">
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl p-1 shadow-xs transition-colors w-full sm:w-auto">
          <button
            type="button"
            aria-label="Previous Gameweek"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1E] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center justify-center gap-2 px-2 min-w-0 flex-1 sm:flex-initial">
            <LeagueLogo league="Premier League" size={18} />
            <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate">
              GW08 · Premier League
            </span>
          </div>
          <button
            type="button"
            aria-label="Next Gameweek"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1E] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Header Production Actions: Remind Me, Share & Scenario Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
          {/* Match Alert Notification Button */}
          <button
            type="button"
            onClick={handleToggleNotification}
            title={isNotified ? 'Turn off match alerts' : 'Notify me about match events'}
            className={`min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold cursor-pointer active:scale-95 ${
              isNotified
                ? 'bg-[#CEFF00] text-black border-[#CEFF00] shadow-xs shadow-[#CEFF00]/20'
                : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <Bell size={14} className={isNotified ? 'fill-current' : ''} />
            <span>{isNotified ? 'Alerts On' : 'Remind Me'}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            title="Share match link"
            className="min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold cursor-pointer active:scale-95 shadow-xs"
          >
            {copiedToast ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span>{copiedToast ? 'Link Copied!' : 'Share'}</span>
          </button>

          {/* Live Data Sync Button */}
          <button
            type="button"
            onClick={handleSyncLiveData}
            disabled={isSyncingLive}
            title="Sync Live Sports Data from Football-Data.org & API-Football"
            className="min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 text-[11px] sm:text-xs font-bold cursor-pointer active:scale-95 shadow-xs"
          >
            <RefreshCw size={13} className={isSyncingLive ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isSyncingLive ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          {/* WebSocket Live Status Indicator */}
          <div
            title={isWsConnected ? 'Connected to TactIQ Real-Time WebSocket Hub (Port 4000)' : 'Connecting to WebSocket Hub...'}
            className={`min-h-[34px] sm:min-h-[36px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold transition-all shadow-xs ${
              isWsConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-zinc-700/50 bg-zinc-800/40 text-zinc-400'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isWsConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isWsConnected ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
            </span>
            <span className="hidden md:inline">{isWsConnected ? 'LIVE WS' : 'CONNECTING'}</span>
          </div>

          {/* Real-time Goal Simulation Trigger */}
          <button
            type="button"
            onClick={() => handleSimulateLiveGoal('away')}
            disabled={isSimulatingEvent}
            title="Klik untuk mensimulasikan gol secara langsung (Real-Time WebSocket Push)"
            className="min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 text-[11px] sm:text-xs font-bold cursor-pointer active:scale-95 shadow-xs"
          >
            <span className={isSimulatingEvent ? 'animate-spin' : ''}>⚡</span>
            <span className="hidden sm:inline">Simulasi Gol</span>
          </button>

          {/* Prototype Scenario Switcher Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsScenarioOpen((prev) => !prev)}
              title="Switch Prototype Scenario (Upcoming / Live / Finished)"
              className={`min-h-[34px] sm:min-h-[36px] px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 shadow-xs ${
                isScenarioOpen
                  ? 'bg-zinc-800 text-[#CEFF00] border-zinc-600'
                  : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <FlaskConical size={14} className="text-[#CEFF00]" />
              <span className="hidden sm:inline font-mono text-[11px]">{currentStatus}</span>
            </button>

            {isScenarioOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsScenarioOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#16161A] p-1.5 shadow-xl z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500 font-bold border-b border-slate-100 dark:border-zinc-800/60 mb-1">
                    Prototype Scenario
                  </div>
                  {(['UPCOMING', 'LIVE', 'FINISHED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        handleStatusChange(st);
                        setIsScenarioOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        currentStatus === st
                          ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{st}</span>
                      {currentStatus === st && <Check size={13} className="text-black" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Real-Time Goal / Event Toast Banner ── */}
      {liveEventToast && (
        <div className="w-full bg-gradient-to-r from-emerald-600/25 via-zinc-900 to-emerald-950/40 border-2 border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">⚽</span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-black flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                REAL-TIME WEBSOCKET EVENT · {liveEventToast.minute}'
              </div>
              <div className="text-sm font-extrabold text-white">
                {liveEventToast.type === 'Goal' ? 'GOAL!' : liveEventToast.type}: {liveEventToast.player} ({liveEventToast.team})
              </div>
              <div className="text-xs text-zinc-300 font-mono">
                {liveEventToast.detail ? `${liveEventToast.detail} · ` : ''}Skor: {liveEventToast.homeScore} - {liveEventToast.awayScore}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLiveEventToast(null)}
            className="text-zinc-400 hover:text-white cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Status Toast Banner ── */}
      {syncStatusToast && (
        <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Radio size={14} className="animate-pulse text-emerald-400" />
            <span>{syncStatusToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncStatusToast(null)}
            className="hover:opacity-75 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Live In-Play Matches Ticker (API-Football Live Stream) ── */}
      {liveScores.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 dark:bg-[#121215] p-3 sm:p-3.5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                Live In-Play Matches ({liveScores.length}) · API-Football Feed
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              Auto-polled Real-Time
            </span>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {liveScores.map((m: any) => {
              const isSelected = activeMatch.id === String(m.fixtureId);
              return (
                <button
                  key={m.fixtureId}
                  type="button"
                  onClick={() => handleSelectLiveMatch(m)}
                  className={`shrink-0 text-left rounded-xl border px-3.5 py-2.5 flex flex-col gap-1.5 min-w-[210px] sm:min-w-[230px] transition-all cursor-pointer active:scale-95 shadow-xs ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/50 shadow-emerald-500/10'
                      : 'border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#16161A] hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#1a1a20]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-mono font-bold">
                    <span className="truncate max-w-[120px]">{m.league}</span>
                    <span className="text-emerald-500 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      {m.status === 'HT' ? 'HT' : `${m.minute}'`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <ClubCrest code={m.homeTeam} size={16} />
                      <span className="truncate">{m.homeTeam}</span>
                    </div>
                    <span className="tabular-nums font-mono text-emerald-500 dark:text-emerald-400 text-sm font-black">{m.homeScore}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <ClubCrest code={m.awayTeam} size={16} />
                      <span className="truncate">{m.awayTeam}</span>
                    </div>
                    <span className="tabular-nums font-mono text-emerald-500 dark:text-emerald-400 text-sm font-black">{m.awayScore}</span>
                  </div>

                  <div className="mt-0.5 pt-1 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[9px] font-mono">
                    <span className={isSelected ? 'text-emerald-500 dark:text-emerald-400 font-extrabold' : 'text-slate-400 dark:text-zinc-500'}>
                      {isSelected ? '● SEDANG AKTIF DI BOARD' : 'Klik untuk buka detail'}
                    </span>
                    <span className="text-slate-400 dark:text-zinc-500">
                      {m.events?.length ? `${m.events.length} event` : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mobile Quick Fixtures Carousel ── */}
      <div className="lg:hidden flex flex-col gap-2 -mt-1">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            GW08 Matches
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
            Swipe ➔
          </span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x -mx-3 px-3 sm:mx-0 sm:px-0">
          {fixtures.map((fix) => {
            const isSelected = activeMatch.id === fix.id;
            return (
              <button
                key={fix.id}
                type="button"
                onClick={() => handleSelectFixture(fix)}
                className={`snap-start shrink-0 w-60 sm:w-64 text-left rounded-xl border p-3 shadow-2xs transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'border-[#CEFF00] bg-[#CEFF00]/10 ring-2 ring-[#CEFF00]/50'
                    : 'border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-[#27272A]">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                    {fix.timeOrStatus}
                  </span>
                  <span className="truncate max-w-[110px]">{fix.venue}</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <ClubCrest code={fix.homeShort || fix.homeTeam} size={18} />
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{fix.homeTeam}</span>
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-50 dark:bg-zinc-800/60 shrink-0">
                    {fix.homeScore !== undefined ? `${fix.homeScore} - ${fix.awayScore}` : 'vs'}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 min-w-0 flex-1 text-right">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{fix.awayTeam}</span>
                    <ClubCrest code={fix.awayShort || fix.awayTeam} size={18} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Workspace: FotMob 8 / 4 Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* Kolom Kiri: 8 Kolom */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6 min-w-0">

          {/* Featured Match Card Dinamis */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs overflow-hidden transition-colors flex flex-col gap-2.5 sm:gap-3.5">
            <div className="absolute -top-20 -left-20 w-52 sm:w-60 h-52 sm:h-60 bg-emerald-600/10 dark:bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-52 sm:w-60 h-52 sm:h-60 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Match Header */}
            <div className="relative flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <LeagueLogo league={activeMatch.league.includes('Premier') ? 'Premier League' : 'Friendlies'} size={14} />
                <span className="font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] truncate max-w-[200px] sm:max-w-none">
                  {activeMatch.league}
                </span>
                {activeMatch.isLiveFeed && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    API-Football Live
                  </span>
                )}
              </div>
              <span className="text-slate-400 dark:text-zinc-500 text-[11px] font-medium hidden sm:inline">
                {activeMatch.venue}
              </span>
            </div>

            <div className="relative">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-6">
                
                {/* Home */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 text-right min-w-0">
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      {activeMatch.homeTeam}
                    </h2>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">
                      {activeMatch.isLiveFeed ? 'Home Team' : 'Premier League'}
                    </span>
                  </div>
                  <ClubCrest code={activeMatch.homeShort || activeMatch.homeTeam} size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                </div>

                {/* Kolom Tengah (Skor atau Jam Kick-off) */}
                <div className="flex flex-col items-center justify-center px-1.5 sm:px-6 w-24 sm:w-36 shrink-0">
                  {currentStatus === 'UPCOMING' ? (
                    <>
                      <span className="font-mono font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                        {activeMatch.timeOrStatus}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400 mt-1 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50">
                        Upcoming
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                        <span className={`font-black text-2xl sm:text-4xl tracking-tight tabular-nums transition-all duration-300 ${
                          scoreFlash
                            ? 'text-emerald-500 scale-115 drop-shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {periodInfo.homeScore}
                        </span>
                        <span className="font-normal text-lg sm:text-2xl text-slate-300 dark:text-slate-600">-</span>
                        <span className={`font-black text-2xl sm:text-4xl tracking-tight tabular-nums transition-all duration-300 ${
                          scoreFlash
                            ? 'text-emerald-500 scale-115 drop-shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {periodInfo.awayScore}
                        </span>
                      </div>
                      
                      {currentStatus === 'LIVE' ? (
                        <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          <span className="text-[11px] sm:text-xs font-semibold text-emerald-500 dark:text-emerald-400 whitespace-nowrap">
                            {periodInfo.statusText}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0.5 sm:mt-1 whitespace-nowrap">
                          Full Time
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center justify-start gap-2 sm:gap-3 text-left min-w-0">
                  <ClubCrest code={activeMatch.awayShort || activeMatch.awayTeam} size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      {activeMatch.awayTeam}
                    </h2>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">
                      {activeMatch.isLiveFeed ? 'Away Team' : 'Premier League'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Pencetak Gol (Mode LIVE & FINISHED) */}
              {currentStatus !== 'UPCOMING' &&
                (periodInfo.scorersHome.filter(s => s && s !== '–').length > 0 ||
                  periodInfo.scorersAway.filter(s => s && s !== '–').length > 0) && (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-2.5 mt-3 sm:mt-3.5">
                    <div className="space-y-0.5 sm:space-y-1 text-right min-w-0">
                      {periodInfo.scorersHome
                        .filter(s => s && s !== '–')
                        .map((s, idx) => (
                          <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                            {s}
                          </div>
                        ))}
                    </div>

                    <div className="pt-0.5 shrink-0 flex items-center justify-center px-1">
                      <SoccerBallIcon size={12} className="text-slate-400 dark:text-zinc-500" />
                    </div>

                    <div className="space-y-0.5 sm:space-y-1 text-left min-w-0">
                      {periodInfo.scorersAway
                        .filter(s => s && s !== '–')
                        .map((s, idx) => (
                          <div key={idx} className="font-medium text-slate-800 dark:text-zinc-200 truncate text-[11px] sm:text-xs">
                            {s}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* xG Momentum Bar: Dinamis */}
              {currentStatus !== 'UPCOMING' && (
                <div className="mt-4 pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-tactiq-coral">
                      <span>{activeMatch.homeShort}</span>
                      <span className="text-zinc-600 font-normal">/</span>
                      <span>{activeMatch.xgHome} xG</span>
                    </div>

                    <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider text-zinc-500 px-2 py-0.5 rounded-full bg-white/[0.03]">
                      xG Momentum
                    </span>

                    <div className="flex items-center gap-1.5 font-bold text-tactiq-cyan">
                      <span>{activeMatch.xgAway} xG</span>
                      <span className="text-zinc-600 font-normal">/</span>
                      <span>{activeMatch.awayShort}</span>
                    </div>
                  </div>

                  <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-zinc-800/80 flex p-0.5 gap-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-500"
                      style={{
                        width: `${Math.round((activeMatch.xgHome / Math.max(0.1, activeMatch.xgHome + activeMatch.xgAway)) * 100)}%`,
                      }}
                    />
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                      style={{
                        width: `${Math.round((activeMatch.xgAway / Math.max(0.1, activeMatch.xgHome + activeMatch.xgAway)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Win Probability: Dinamis */}
            <div className="pt-2 sm:pt-2.5 flex flex-col gap-2">
              <div className="grid grid-cols-3 items-center text-xs font-mono">
                <div className="text-left font-bold text-tactiq-coral text-[11px] sm:text-xs">
                  {activeMatch.homeShort} {periodInfo.homeProb}
                </div>

                <div className="text-center">
                  <span className="inline-block text-[10px] font-sans font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                    Draw {periodInfo.drawProb}
                  </span>
                </div>

                <div className="text-right font-bold text-tactiq-cyan text-[11px] sm:text-xs">
                  {activeMatch.awayShort} {periodInfo.awayProb}
                </div>
              </div>

              <div className="w-full h-1.5 sm:h-2 bg-zinc-800/80 rounded-full flex overflow-hidden p-0.5 gap-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: periodInfo.homeWidth }}
                />
                <div
                  className="h-full bg-zinc-600 rounded-full transition-all duration-300"
                  style={{ width: periodInfo.drawWidth }}
                />
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: periodInfo.awayWidth }}
                />
              </div>
            </div>
          </div>

          {/* ── Navigasi Tab Mandiri (100% Di Luar Card) ── */}
          <div className="w-full flex items-center justify-between px-1 sm:px-0">
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {availableTabs.map((tab) => {
                const isActive = matchTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMatchTab(tab)}
                    className={`flex-1 sm:flex-initial py-2 px-2.5 sm:px-4 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all text-center shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <span className="block truncate">{tab}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Area Konten Tab ── */}
          <div className="w-full">

            {/* 1. TAB PREVIEW (Seamless Line Momentum Graph + Injured/Suspended Players) */}
            {matchTab === 'preview' && (
              <div className="space-y-4">
                
                {/* ── RECENT FORM: SEAMLESS DUAL LINE TREND MOMENTUM GRAPH ── */}
                <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-xs">
                  {/* Card Header: Responsive Title & Legend */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-400 truncate mr-2">
                      <span className="sm:hidden">Recent Form (Last 5)</span>
                      <span className="hidden sm:inline">Recent Form Momentum (Last 5 Games)</span>
                    </span>
                    {/* Legend Garis Minimalis */}
                    <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#DA291C]" />
                        <span className="font-bold text-slate-800 dark:text-zinc-200">MUN</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#6CABDD]" />
                        <span className="font-bold text-slate-800 dark:text-zinc-200">MCI</span>
                      </div>
                    </div>
                  </div>

                  {/* Kanvas Grafik Garis dengan Kolom Sumbu Y Khusus (Dedicated Y-Axis) */}
                  <div className="relative w-full h-[140px] sm:h-[150px] select-none flex gap-1.5 sm:gap-2 pt-1 pb-1">
                    {/* Dedicated Y-Axis Column (Kiri - Bebas Tabrakan) */}
                    <div className="w-12 sm:w-14 shrink-0 relative h-full flex flex-col pointer-events-none select-none">
                      <div className="absolute top-[16.67%] -translate-y-1/2 text-left">
                        <span className="text-[9px] sm:text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold tracking-tight block">
                          WIN <span className="opacity-75 text-[8.5px]">(+3)</span>
                        </span>
                      </div>
                      <div className="absolute top-[50%] -translate-y-1/2 text-left">
                        <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold tracking-tight block">
                          DRAW <span className="opacity-75 text-[8.5px]">(+1)</span>
                        </span>
                      </div>
                      <div className="absolute top-[83.33%] -translate-y-1/2 text-left">
                        <span className="text-[9px] sm:text-[10px] font-mono text-rose-500 font-bold tracking-tight block">
                          LOSS <span className="opacity-75 text-[8.5px]">(0)</span>
                        </span>
                      </div>
                    </div>

                    {/* Plot Area Kanvas Garis (Kanan) */}
                    <div className="flex-1 relative h-full">
                      {/* Grid Lines Horizontal (Presisi Sempurna pada 16.67%, 50%, 83.33%) */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-x-0 top-[16.67%] border-b border-dashed border-emerald-500/20 dark:border-emerald-500/15" />
                        <div className="absolute inset-x-0 top-[50%] border-b border-dashed border-slate-200 dark:border-zinc-800/80" />
                        <div className="absolute inset-x-0 top-[83.33%] border-b border-dashed border-rose-500/20 dark:border-rose-500/15" />
                      </div>

                      {/* Garis SVG Tren */}
                      <svg viewBox="0 0 360 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                        {/* Man United Line (Merah) */}
                        <path
                          d={`M ${getPointsPath(RECENT_FORM_DATA.home)}`}
                          fill="none"
                          stroke="#DA291C"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-xs"
                        />
                        {/* Man City Line (Biru) */}
                        <path
                          d={`M ${getPointsPath(RECENT_FORM_DATA.away)}`}
                          fill="none"
                          stroke="#6CABDD"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-xs"
                        />
                      </svg>

                      {/* Nodes Man United (Clean Static Red Dots) */}
                      {RECENT_FORM_DATA.home.map((m, idx) => {
                        const leftPercent = 8.33 + idx * 20.833;
                        const topPercent = m.points === 3 ? 16.67 : m.points === 1 ? 50 : 83.33;
                        return (
                          <div
                            key={`mun-dot-${idx}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                          >
                            <div className="w-3.5 h-3.5 rounded-full bg-[#DA291C] ring-2 ring-white dark:ring-[#121215] shadow-xs" />
                          </div>
                        );
                      })}

                      {/* Nodes Man City (Clean Static Blue Dots) */}
                      {RECENT_FORM_DATA.away.map((m, idx) => {
                        const leftPercent = 8.33 + idx * 20.833;
                        const topPercent = m.points === 3 ? 16.67 : m.points === 1 ? 50 : 83.33;
                        return (
                          <div
                            key={`mci-dot-${idx}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                          >
                            <div className="w-3.5 h-3.5 rounded-full bg-[#6CABDD] ring-2 ring-white dark:ring-[#121215] shadow-xs" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timeline Urutan Laga Minimalis */}
                  <div className="flex items-center justify-between pl-14 sm:pl-16 pr-1 pt-1.5 pb-2 text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                    <span>5 Matches Ago</span>
                    <span className="text-[8px] sm:text-[9px] opacity-60">Timeline ➔</span>
                    <span className="font-semibold text-slate-600 dark:text-zinc-400">Latest</span>
                  </div>

                  {/* Ringkasan Performa Poin 5 Laga (Ultra-Minimalist: Summary Poin Saja) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ClubCrest code="MUN" size={16} className="w-4 h-4 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">Man United</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        10 / 15 Pts <span className="text-[10px] text-zinc-400 font-normal">(67%)</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ClubCrest code="MCI" size={18} className="w-4.5 h-4.5 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">Man City</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        10 / 15 Pts <span className="text-[10px] text-zinc-400 font-normal">(67%)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Injured and suspended players (Clean FotMob Layout) ── */}
                <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 sm:p-5 shadow-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-400 mb-3.5">
                    Injured and suspended players
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {/* Home Absentees */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-[#27272A]">
                        <ClubCrest code="MUN" size={16} />
                        <span className="font-bold text-xs text-slate-700 dark:text-zinc-300">Man United</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {absentees.home.map((p, idx) => (
                          <div key={idx} className="py-2.5 flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/10 shrink-0">
                              <img
                                src={p.photoUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover object-top"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>

                            <div className="shrink-0 flex items-center justify-center">
                              {p.type === 'injury' ? (
                                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs">
                                  <span className="text-red-600 font-black text-[13px] leading-none select-none -mt-0.5">+</span>
                                </div>
                              ) : (
                                <div className="w-2.5 h-3.5 bg-red-600 rounded-[2px] shadow-xs border border-red-400/40" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-[12.5px] sm:text-xs leading-snug truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal truncate mt-0.5">
                                {p.reason} / {p.expectedReturn}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Away Absentees */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-[#27272A]">
                        <ClubCrest code="MCI" size={16} />
                        <span className="font-bold text-xs text-slate-700 dark:text-zinc-300">Man City</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {absentees.away.map((p, idx) => (
                          <div key={idx} className="py-2.5 flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/10 shrink-0">
                              <img
                                src={p.photoUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover object-top"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>

                            <div className="shrink-0 flex items-center justify-center">
                              {p.type === 'injury' ? (
                                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs">
                                  <span className="text-red-600 font-black text-[13px] leading-none select-none -mt-0.5">+</span>
                                </div>
                              ) : (
                                <div className="w-2.5 h-3.5 bg-red-600 rounded-[2px] shadow-xs border border-red-400/40" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white text-[12.5px] sm:text-xs leading-snug truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal truncate mt-0.5">
                                {p.reason} / {p.expectedReturn}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. TAB STATS (Saat LIVE / FINISHED) */}
            {matchTab === 'stats' && (
              <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
                <div className="flex items-center justify-center p-1 bg-slate-100/80 dark:bg-zinc-800/70 rounded-full w-full sm:w-fit mx-auto gap-1 border border-slate-200/50 dark:border-zinc-700/50">
                  {(['ALL', '1ST', '2ND'] as const).map((period) => {
                    const isActive = statsPeriod === period;
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setStatsPeriod(period)}
                        className={`flex-1 sm:flex-initial min-h-[32px] sm:min-h-[36px] px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 text-center cursor-pointer ${
                          isActive
                            ? 'bg-[#CEFF00] text-black font-extrabold shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="whitespace-nowrap">
                          {period === 'ALL' ? 'All Match' : period === '1ST' ? '1st Half' : '2nd Half'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-5 border border-slate-100 dark:border-[#27272A]">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                    Top Stats
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                    {activeStats.top.map((s: any, idx: number) => (
                      <MatchStatRow key={idx} {...s} homeColor={activeMatch.homeColor} awayColor={activeMatch.awayColor} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                      Shots
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                      {activeStats.shots.map((s: any, idx: number) => (
                        <MatchStatRow key={idx} {...s} homeColor={activeMatch.homeColor} awayColor={activeMatch.awayColor} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                      Passes
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                      {activeStats.passes.map((s: any, idx: number) => (
                        <MatchStatRow key={idx} {...s} homeColor={activeMatch.homeColor} awayColor={activeMatch.awayColor} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                    Defence & Duels
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                    {activeStats.defence.map((s: any, idx: number) => (
                      <MatchStatRow key={idx} {...s} homeColor={activeMatch.homeColor} awayColor={activeMatch.awayColor} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TAB H2H (100% Pure Text Tanpa Inner Box Card) */}
            {matchTab === 'h2h' && (
              <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-4 sm:p-6 shadow-xs space-y-6">
                
                {/* ── Ringkasan Kapsul H2H (Terkunci Sumbu Tengah 50% & Logo Proporsional - Solid Opsi A) ── */}
                <div className="py-2.5 w-full flex items-center justify-center gap-2 sm:gap-4 select-none">
                  {/* Crest Home */}
                  <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-end shrink-0">
                    <ClubCrest code={activeMatch.homeShort} size={36} className="w-8.5 h-8.5 sm:w-10 sm:h-10 drop-shadow-xs shrink-0" />
                  </div>

                  {/* Kapsul Segmented Terpadu (Opsi A) */}
                  <div className="inline-flex items-center p-0.5 sm:p-1 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 rounded-full shadow-xs gap-0.5 sm:gap-1">
                    {/* Kapsul Home Wins */}
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#DA291C] text-white shadow-xs" style={{ backgroundColor: activeMatch.homeColor || '#DA291C' }}>
                      <span className="font-extrabold text-xs sm:text-sm font-mono leading-none">{h2hSummary.homeWins}</span>
                      <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider opacity-95">
                        Wins
                      </span>
                    </div>

                    {/* Kapsul Titik Tengah (DRAWS) - Solid Neutral */}
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 shadow-xs">
                      <span className="font-extrabold text-xs sm:text-sm font-mono leading-none text-slate-900 dark:text-white">{h2hSummary.draws}</span>
                      <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                        Draws
                      </span>
                    </div>

                    {/* Kapsul Away Wins */}
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#6CABDD] text-slate-950 shadow-xs" style={{ backgroundColor: activeMatch.awayColor || '#6CABDD' }}>
                      <span className="font-extrabold text-xs sm:text-sm font-mono leading-none">{h2hSummary.awayWins}</span>
                      <span className="text-[9.5px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                        Wins
                      </span>
                    </div>
                  </div>

                  {/* Crest Away */}
                  <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-start shrink-0">
                    <ClubCrest code={activeMatch.awayShort} size={46} className="w-10.5 h-10.5 sm:w-12 sm:h-12 drop-shadow-xs shrink-0" />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-[#27272A]" />

                {/* ── List Pertandingan H2H (Pure Text Seamless, Sumbu Tengah Presisi) ── */}
                <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                  {matchH2HData.map((h, i) => (
                    <div
                      key={i}
                      className="py-3 px-1 sm:px-2 rounded-xl hover:bg-slate-50/70 dark:hover:bg-[#1A1A1E] transition-colors"
                    >
                      {/* Grid Simetris 1fr - Auto - 1fr */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                        
                        {/* Sisi Kiri: Tanggal (Desktop) + Tim Kandang (Rata Kanan) */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="hidden md:inline text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                            {h.date}
                          </span>
                          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 min-w-0 ml-auto">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {h.homeTeam}
                            </span>
                            <ClubCrest code={h.homeShort} size={20} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                          </div>
                        </div>

                        {/* Sisi Tengah: Pure Text Skor (Tanpa Kotak Card Abu-abu) */}
                        <div className="w-14 sm:w-16 flex items-center justify-center font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums shrink-0 select-none">
                          <span>{h.homeScore}</span>
                          <span className="text-slate-400 dark:text-zinc-600 mx-1.5 font-normal">-</span>
                          <span>{h.awayScore}</span>
                        </div>

                        {/* Sisi Kanan: Tim Tandang (Rata Kiri) + Kompetisi (Desktop) */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center justify-start gap-1.5 sm:gap-2.5 min-w-0 mr-auto">
                            <ClubCrest code={h.awayShort} size={20} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {h.awayTeam}
                            </span>
                          </div>
                          <span className="hidden md:inline text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate text-right">
                            {h.competition}
                          </span>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* 4. TAB LINEUPS (Unwrapped Stage) */}
            {matchTab === 'lineups' && (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                
                {/* Header Desktop (>= md) */}
                <div className="hidden md:flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {currentStatus !== 'UPCOMING' && (
                      <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600 text-white shrink-0 shadow-2xs">
                        {activeLineup.home.teamRating.toFixed(1)}
                      </span>
                    )}
                    <ClubCrest code={activeMatch.homeShort} size={20} className="shrink-0 drop-shadow-xs" />
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      {activeMatch.homeTeam}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                      {activeLineup.home.formation}
                    </span>
                  </div>

                  {currentStatus === 'UPCOMING' && (
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                      Predicted Lineups
                    </span>
                  )}

                  <div className="flex items-center justify-end gap-2 min-w-0 text-right">
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                      {activeLineup.away.formation}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      {activeMatch.awayTeam}
                    </span>
                    <ClubCrest code={activeMatch.awayShort} size={20} className="shrink-0 drop-shadow-xs" />
                    {currentStatus !== 'UPCOMING' && (
                      <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600/90 text-white shrink-0 shadow-2xs">
                        {activeLineup.away.teamRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Header Mobile (< md): Tim Atas (Away) */}
                <div className="md:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClubCrest code={activeMatch.awayShort} size={20} className="shrink-0 drop-shadow-xs" />
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      {activeMatch.awayTeam}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                      {activeLineup.away.formation}
                    </span>
                  </div>
                  {currentStatus !== 'UPCOMING' ? (
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600/90 text-white shrink-0 shadow-2xs">
                      {activeLineup.away.teamRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium">Predicted</span>
                  )}
                </div>

                {/* HP: Lapangan Vertikal Full Bleed Edge-to-Edge */}
                <div className="block md:hidden w-full relative h-[760px] select-none overflow-hidden bg-transparent">
                  <div className="absolute inset-0 grid grid-rows-10 pointer-events-none opacity-20">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div key={idx} className={idx % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'} />
                    ))}
                  </div>

                  <svg
                    viewBox="0 0 600 1000"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-600/40 dark:stroke-zinc-700/50"
                    fill="none"
                    strokeWidth="1.5"
                  >
                    <rect x="12" y="12" width="576" height="976" rx="2" vectorEffect="non-scaling-stroke" />
                    <line x1="12" y1="500" x2="588" y2="500" vectorEffect="non-scaling-stroke" />
                    <circle cx="300" cy="500" r="75" vectorEffect="non-scaling-stroke" />
                    <circle cx="300" cy="500" r="3.5" fill="rgba(255,255,255,0.4)" stroke="none" />
                    <rect x="140" y="12" width="320" height="155" vectorEffect="non-scaling-stroke" />
                    <rect x="220" y="12" width="160" height="55" vectorEffect="non-scaling-stroke" />
                    <circle cx="300" cy="112" r="3" fill="rgba(255,255,255,0.4)" stroke="none" />
                    <path d="M 248 167 A 75 75 0 0 0 352 167" vectorEffect="non-scaling-stroke" />
                    <rect x="140" y="833" width="320" height="155" vectorEffect="non-scaling-stroke" />
                    <rect x="220" y="933" width="160" height="55" vectorEffect="non-scaling-stroke" />
                    <circle cx="300" cy="888" r="3" fill="rgba(255,255,255,0.4)" stroke="none" />
                    <path d="M 248 833 A 75 75 0 0 1 352 833" vectorEffect="non-scaling-stroke" />
                  </svg>

                  {activeLineup.away.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={true} hideRating={currentStatus === 'UPCOMING'} />
                  ))}

                  {activeLineup.home.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={true} hideRating={currentStatus === 'UPCOMING'} />
                  ))}
                </div>

                {/* Header Mobile (< md): Tim Bawah (Home) */}
                <div className="md:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClubCrest code={activeMatch.homeShort} size={20} className="shrink-0 drop-shadow-xs" />
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      {activeMatch.homeTeam}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                      {activeLineup.home.formation}
                    </span>
                  </div>
                  {currentStatus !== 'UPCOMING' ? (
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600 text-white shrink-0 shadow-2xs">
                      {activeLineup.home.teamRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium">Predicted</span>
                  )}
                </div>

                {/* PC / Laptop: Lapangan Horizontal Stage Mandiri */}
                <div className="hidden md:block w-full h-[490px] lg:h-[520px] rounded-2xl border border-slate-200/80 dark:border-[#27272A] bg-[#121215] relative overflow-hidden select-none shadow-sm">
                  <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-20">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <div key={idx} className={idx % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'} />
                    ))}
                  </div>

                  <svg
                    viewBox="0 0 1000 600"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none stroke-zinc-600/40 dark:stroke-zinc-700/60"
                    fill="none"
                    strokeWidth="1.5"
                  >
                    <rect x="24" y="24" width="952" height="552" rx="4" vectorEffect="non-scaling-stroke" />
                    <line x1="500" y1="24" x2="500" y2="576" vectorEffect="non-scaling-stroke" />
                    <circle cx="500" cy="300" r="75" vectorEffect="non-scaling-stroke" />
                    <circle cx="500" cy="300" r="3.5" fill="rgba(255,255,255,0.4)" stroke="none" />
                    
                    <rect x="24" y="145" width="155" height="310" vectorEffect="non-scaling-stroke" />
                    <rect x="24" y="225" width="55" height="150" vectorEffect="non-scaling-stroke" />
                    <circle cx="120" cy="300" r="3" fill="rgba(255,255,255,0.4)" stroke="none" />
                    <path d="M 179 248 A 75 75 0 0 1 179 352" vectorEffect="non-scaling-stroke" />

                    <rect x="821" y="145" width="155" height="310" vectorEffect="non-scaling-stroke" />
                    <rect x="921" y="225" width="55" height="150" vectorEffect="non-scaling-stroke" />
                    <circle cx="880" cy="300" r="3" fill="rgba(255,255,255,0.4)" stroke="none" />
                    <path d="M 821 248 A 75 75 0 0 0 821 352" vectorEffect="non-scaling-stroke" />
                  </svg>

                  {activeLineup.home.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={false} hideRating={currentStatus === 'UPCOMING'} />
                  ))}

                  {activeLineup.away.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={false} hideRating={currentStatus === 'UPCOMING'} />
                  ))}
                </div>

                {/* Strip Pelatih */}
                <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100/70 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/20 shrink-0 flex items-center justify-center">
                      {homeCoach.photoUrl ? (
                        <img
                          src={homeCoach.photoUrl}
                          alt={homeCoach.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User size={13} className="text-zinc-500" />
                      )}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px] sm:text-xs truncate">
                      {homeCoach.name}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold px-2">
                    Coach
                  </span>

                  <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px] sm:text-xs truncate">
                      {awayCoach.name}
                    </span>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/20 shrink-0 flex items-center justify-center">
                      {awayCoach.photoUrl ? (
                        <img
                          src={awayCoach.photoUrl}
                          alt={awayCoach.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User size={13} className="text-zinc-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Substitutes Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-[#27272A] mb-2 px-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                      Substitutes
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                      Confirmed Bench
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 lg:gap-x-10 gap-y-4">
                    {/* Home Substitutes */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between pb-1.5 mb-0.5 border-b border-slate-100 dark:border-[#27272A]/70 px-1">
                        <div className="flex items-center gap-1.5">
                          <ClubCrest code={activeMatch.homeShort} size={15} />
                          <span className="font-semibold text-slate-800 dark:text-zinc-300 text-xs">
                            {activeMatch.homeTeam}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                          {activeLineup.home.substitutes.length} subs
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100/50 dark:divide-[#27272A]/30">
                        {activeLineup.home.substitutes.map((player) => (
                          <SubstituteRow
                            key={player.num}
                            player={player}
                            hideRating={currentStatus === 'UPCOMING'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Away Substitutes */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between pb-1.5 mb-0.5 border-b border-slate-100 dark:border-[#27272A]/70 px-1">
                        <div className="flex items-center gap-1.5">
                          <ClubCrest code={activeMatch.awayShort} size={15} />
                          <span className="font-semibold text-slate-800 dark:text-zinc-300 text-xs">
                            {activeMatch.awayTeam}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                          {activeLineup.away.substitutes.length} subs
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100/50 dark:divide-[#27272A]/30">
                        {activeLineup.away.substitutes.map((player) => (
                          <SubstituteRow
                            key={player.num}
                            player={player}
                            hideRating={currentStatus === 'UPCOMING'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 5. TAB TABLE */}
            {matchTab === 'table' && (
              <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-6 shadow-xs">
                {isPremierLeague ? (
                  <div className="font-mono text-xs divide-y divide-slate-100 dark:divide-[#27272A]">
                    <div className="grid grid-cols-[1fr_36px_46px_44px_78px] items-center py-2 px-2.5 sm:px-3 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      <span className="text-left">Club</span>
                      <span className="text-center">P</span>
                      <span className="text-center">GD</span>
                      <span className="text-center text-slate-900 dark:text-white">PTS</span>
                      <span className="text-center">Form</span>
                    </div>

                    {standings.map((row) => (
                      <div
                        key={row.code ? `${row.code}-${row.rank}` : row.rank}
                        className="grid grid-cols-[1fr_36px_46px_44px_78px] items-center py-2.5 px-2.5 sm:px-3 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                          <span className="text-slate-500 dark:text-slate-400 w-3 font-bold text-[11px] sm:text-xs shrink-0">
                            {row.rank}
                          </span>
                          <ClubCrest code={row.code || row.club} size={16} />
                          <span className="font-bold text-slate-900 dark:text-white truncate text-[11px] sm:text-xs">
                            {row.club}
                          </span>
                        </div>

                        <span className="text-center text-slate-600 dark:text-slate-400 tabular-nums text-[11px] sm:text-xs">
                          {row.played}
                        </span>

                        <span className="text-center text-slate-600 dark:text-slate-400 tabular-nums text-[11px] sm:text-xs font-semibold">
                          {row.gd}
                        </span>

                        <span className="text-center font-bold text-slate-900 dark:text-white tabular-nums text-[11px] sm:text-xs">
                          {row.pts}
                        </span>

                        <div className="flex items-center justify-center gap-1">
                          {row.form.map((f, i) => (
                            <span key={i} className={f === 'W' ? 'tq-form-w' : f === 'D' ? 'tq-form-d' : 'tq-form-l'}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <ClubCrest code={activeMatch.homeShort} size={36} />
                      <span className="text-xs font-bold font-mono text-zinc-500">VS</span>
                      <ClubCrest code={activeMatch.awayShort} size={36} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {activeMatch.league}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                        Pertandingan ini merupakan laga uji coba internasional / kompetisi non-liga domestik. Klasemen resmi Premier League tetap dapat diakses melalui jadwal GW08.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-md pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] text-left">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ClubCrest code={activeMatch.homeShort} size={14} />
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{activeMatch.homeTeam}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 block">Status: Tuan Rumah</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] text-left">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ClubCrest code={activeMatch.awayShort} size={14} />
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{activeMatch.awayTeam}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 block">Status: Tim Tamu</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Kolom Kanan: 4 Kolom (NON-STICKY / STATIS) */}
        <aside className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
          
          {/* Live Table Impact */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-slate-100 dark:border-[#27272A]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Live Table Impact
              </h3>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="grid grid-cols-[1fr_28px_36px_34px] items-center px-2 py-1 text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-[#222227]">
                <span className="text-left">Club</span>
                <span className="text-center">P</span>
                <span className="text-center">GD</span>
                <span className="text-center font-bold text-slate-700 dark:text-zinc-300">PTS</span>
              </div>

              {standings.map((row) => {
                const isArsenal = row.club.includes('Arsenal');
                const isCity = row.club.includes('City');
                return (
                  <div
                    key={row.code ? `${row.code}-${row.rank}` : row.rank}
                    className={`grid grid-cols-[1fr_28px_36px_34px] items-center py-1.5 px-2 rounded-lg transition-colors border ${
                      isArsenal
                        ? 'bg-red-500/10 border-red-500/20 text-slate-900 dark:text-white'
                        : isCity
                        ? 'bg-sky-500/10 border-sky-500/20 text-slate-900 dark:text-white'
                        : 'border-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-1">
                      <span className={`w-3 sm:w-3.5 text-[11px] sm:text-xs font-bold shrink-0 ${isArsenal ? 'text-red-500' : isCity ? 'text-sky-400' : 'text-slate-400'}`}>
                        {row.rank}
                      </span>
                      <ClubCrest code={row.code || row.club} size={16} />
                      <span className="font-bold text-[11px] sm:text-xs truncate">{row.club}</span>
                      {isArsenal && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-mono font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/50 px-1 py-0.5 rounded leading-none shrink-0">
                          <TrendingUp size={10} className="text-emerald-400 shrink-0" />
                          1
                        </span>
                      )}
                      {isCity && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-mono font-bold text-zinc-400 bg-zinc-800 border border-zinc-700/50 px-1 py-0.5 rounded leading-none shrink-0">
                          <TrendingDown size={10} className="text-rose-400 shrink-0" />
                          1
                        </span>
                      )}
                    </div>
                    <span className="text-center tabular-nums text-[11px] sm:text-xs text-slate-400">{row.played}</span>
                    <span className="text-center tabular-nums text-[11px] sm:text-xs text-slate-400">{row.gd}</span>
                    <span className="text-center tabular-nums text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white">
                      {row.pts}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#27272A] text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Info size={13} className="text-zinc-400 shrink-0" />
              <span className="leading-tight">Arsenal overtake City to lead the table by +2 pts.</span>
            </div>
          </div>

          {/* Simulation Matrix */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-slate-100 dark:border-[#27272A]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Simulation Matrix
              </h3>
            </div>

            <div className="space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs">MUN Win Expectancy</span>
                <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">82.4%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 dark:bg-zinc-200 rounded-full" style={{ width: '82.4%' }} />
              </div>

              <div className="pt-1.5 sm:pt-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                  Projected Full-Time
                </span>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-100 dark:bg-[#1E1E24] rounded-lg border border-slate-300 dark:border-zinc-700">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">2 - 1</span>
                    <span className="text-[10px] text-slate-900 dark:text-white font-bold">34.2%</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-[#18181C] rounded-lg border border-slate-200 dark:border-[#27272A]">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">2 - 2</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">21.8%</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-[#18181C] rounded-lg border border-slate-200 dark:border-[#27272A]">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">3 - 1</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">16.4%</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAiModal}
                className="w-full mt-1.5 sm:mt-2 py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-black text-xs rounded-lg transition-all shadow-xs shadow-[#CEFF00]/15 cursor-pointer"
              >
                View Full Probabilities
              </button>
            </div>
          </div>

          {/* Fixtures Rail */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-2.5 sm:pb-3 mb-2">
              <div className="flex items-center gap-2">
                <LeagueLogo league="Premier League" size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                  GW08 Fixtures Rail
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 font-medium">4 Matches</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {fixtures.map((fix) => {
                const isActive = activeMatch.id === fix.id;
                return (
                  <button
                    key={fix.id}
                    type="button"
                    onClick={() => handleSelectFixture(fix)}
                    className={`w-full text-left py-2.5 px-1.5 sm:px-2 rounded-xl transition-all flex items-center gap-2 text-xs cursor-pointer ${
                      isActive
                        ? 'bg-lime-400/10 dark:bg-lime-400/15 border border-lime-400/40 shadow-xs'
                        : 'border border-transparent hover:bg-slate-50 dark:hover:bg-[#1A1A1E]'
                    }`}
                  >
                    <div className="w-[42px] sm:w-[46px] shrink-0 flex flex-col items-start leading-none gap-1">
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded inline-block text-center min-w-[34px] sm:min-w-[38px] ${
                          fix.timeOrStatus === 'FT'
                            ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-semibold'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {fix.timeOrStatus.split(' ')[0]}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 dark:text-zinc-500 pl-0.5 truncate max-w-full">
                        {fix.xgHome !== undefined ? `xG ${fix.xgHome}` : fix.venue.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2 min-w-0 pr-1">
                      <div className="flex items-center justify-end gap-1.5 min-w-0 text-right">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {fix.homeTeam}
                        </span>
                        <ClubCrest code={fix.homeShort} size={16} />
                      </div>

                      <div className="w-8 sm:w-10 text-center font-mono shrink-0 select-none">
                        {fix.homeScore !== undefined ? (
                          <span className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white tabular-nums">
                            {fix.homeScore} - {fix.awayScore}
                          </span>
                        ) : (
                          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                            vs
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-start gap-1.5 min-w-0 text-left">
                        <ClubCrest code={fix.awayShort} size={16} />
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {fix.awayTeam}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

      </div>

      {/* Modal Score Probabilities */}
      {showAiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-2xl transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#27272A] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">AI Simulation Engine</span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Score Probabilities</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white active:scale-95 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E1E24] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                Monte Carlo match simulation outcomes calculated via TactIQ Match Predictor (Poison/Elo xG model and historical H2H records).
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center pt-1">
                <div className="p-3 bg-slate-100/80 dark:bg-[#1E1E24] rounded-xl border border-slate-300 dark:border-zinc-700 shadow-2xs">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">
                    {predictionData?.score || '2 - 1'}
                  </span>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                    Home Win: {predictionData?.homeWin ?? 45.1}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-xl border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">Draw</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                    {predictionData?.draw ?? 19.6}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-xl border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">Away Win</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                    {predictionData?.awayWin ?? 35.3}%
                  </span>
                </div>
              </div>

              {predictionData?.insights && predictionData.insights.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-[#151518] rounded-xl border border-slate-200 dark:border-[#27272A] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">AI Tactical Insights</span>
                  {predictionData.insights.map((insight, idx) => (
                    <div key={idx} className="text-[11px] text-slate-700 dark:text-zinc-300 leading-snug">
                      • {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}