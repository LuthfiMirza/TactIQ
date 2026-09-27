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
} from 'lucide-react';
import { ClubCrest, LeagueLogo, SoccerBallIcon } from '@/components/ui/club-crest';

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

interface TeamLineup {
  formation: string;
  teamRating: number;
  starters: LineupPlayer[];
}

const LINEUPS: { home: TeamLineup; away: TeamLineup } = {
  home: {
    formation: '4-2-3-1',
    teamRating: 7.4,
    starters: [
      { num: 24, name: 'André Onana', shortName: 'Onana', pos: 'GK', rating: 7.1, x: 6, y: 50, vx: 50, vy: 93, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/202641.png' },
      { num: 20, name: 'Diogo Dalot', shortName: 'Dalot', pos: 'RB', rating: 6.8, x: 16, y: 16, vx: 83, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/216051.png' },
      { num: 4, name: 'Matthijs de Ligt', shortName: 'De Ligt', pos: 'CB', rating: 7.2, x: 15, y: 38, vx: 61, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/220566.png' },
      { num: 6, name: 'Lisandro Martínez', shortName: 'Martínez', pos: 'CB', rating: 7.4, x: 15, y: 62, vx: 39, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/221820.png' },
      { num: 23, name: 'Luke Shaw', shortName: 'Shaw', pos: 'LB', rating: 6.7, x: 16, y: 84, vx: 17, vy: 83, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/106757.png' },
      { num: 18, name: 'Casemiro', shortName: 'Casemiro', pos: 'DM', rating: 7.3, x: 26, y: 36, vx: 38, vy: 73, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/112465.png' },
      { num: 37, name: 'Kobbie Mainoo', shortName: 'Mainoo', pos: 'CM', rating: 7.0, x: 26, y: 64, vx: 62, vy: 73, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/477424.png' },
      { num: 17, name: 'Alejandro Garnacho', shortName: 'Garnacho', pos: 'RW', rating: 7.6, x: 36, y: 18, vx: 83, vy: 64, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/493105.png' },
      { num: 8, name: 'Bruno Fernandes', shortName: 'Fernandes', pos: 'AM', rating: 8.5, isCaptain: true, isScorer: true, x: 35, y: 50, vx: 50, vy: 64, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/141746.png' },
      { num: 10, name: 'Marcus Rashford', shortName: 'Rashford', pos: 'LW', rating: 7.9, isScorer: true, x: 36, y: 82, vx: 17, vy: 64, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/176297.png' },
      { num: 11, name: 'Rasmus Højlund', shortName: 'Højlund', pos: 'ST', rating: 6.9, x: 44, y: 50, vx: 50, vy: 56, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/493108.png' },
    ],
  },
  away: {
    formation: '4-1-4-1',
    teamRating: 7.0,
    starters: [
      { num: 31, name: 'Ederson', shortName: 'Ederson', pos: 'GK', rating: 6.3, x: 94, y: 50, vx: 50, vy: 6, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/121160.png' },
      { num: 24, name: 'Joško Gvardiol', shortName: 'Gvardiol', pos: 'LB', rating: 6.9, x: 84, y: 16, vx: 17, vy: 16, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/477424.png' },
      { num: 25, name: 'Manuel Akanji', shortName: 'Akanji', pos: 'CB', rating: 6.6, x: 85, y: 38, vx: 39, vy: 16, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/224568.png' },
      { num: 3, name: 'Rúben Dias', shortName: 'Dias', pos: 'CB', rating: 6.8, x: 85, y: 62, vx: 61, vy: 16, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/171314.png' },
      { num: 2, name: 'Kyle Walker', shortName: 'Walker', pos: 'RB', rating: 6.7, isCaptain: true, x: 84, y: 84, vx: 83, vy: 16, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/58621.png' },
      { num: 16, name: 'Rodri', shortName: 'Rodri', pos: 'DM', rating: 7.4, x: 74, y: 50, vx: 50, vy: 26, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/220566.png' },
      { num: 11, name: 'Jérémy Doku', shortName: 'Doku', pos: 'LM', rating: 7.1, x: 64, y: 18, vx: 17, vy: 36, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/443204.png' },
      { num: 17, name: 'Kevin De Bruyne', shortName: 'De Bruyne', pos: 'AM', rating: 7.8, x: 65, y: 38, vx: 39, vy: 36, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/61366.png' },
      { num: 47, name: 'Phil Foden', shortName: 'Foden', pos: 'AM', rating: 7.2, x: 65, y: 62, vx: 61, vy: 36, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/209244.png' },
      { num: 20, name: 'Bernardo Silva', shortName: 'B. Silva', pos: 'RM', rating: 7.0, x: 64, y: 82, vx: 83, vy: 36, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/165809.png' },
      { num: 9, name: 'Erling Haaland', shortName: 'Haaland', pos: 'ST', rating: 7.5, isScorer: true, x: 56, y: 50, vx: 50, vy: 44, photoUrl: 'https://resources.premierleague.com/premierleague25/photos/players/110x140/223094.png' },
    ],
  },
};

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

export default function MatchCenterPage() {
  const [mounted, setMounted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<MatchStatusType>('LIVE');
  const [matchTab, setMatchTab] = useState<string>('stats');
  const [statsPeriod, setStatsPeriod] = useState<'ALL' | '1ST' | '2ND'>('ALL');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    ALL: {
      homeScore: 7,
      awayScore: 0,
      statusText: "88'",
      scorersHome: [
        "Fernandes 14' (P), 78'",
        "Rashford 28', 53'",
        "Højlund 41'",
        "Garnacho 65'",
        "Mainoo 88'",
      ],
      scorersAway: ['–'],
      munProb: '94%',
      drawProb: '4%',
      mciProb: '2%',
      munWidth: '94%',
      drawWidth: '4%',
      mciWidth: '2%',
    },
    '1ST': {
      homeScore: 3,
      awayScore: 0,
      statusText: 'Half Time',
      scorersHome: ["Fernandes 14' (P)", "Rashford 28'", "Højlund 41'"],
      scorersAway: ['–'],
      munProb: '88%',
      drawProb: '9%',
      mciProb: '3%',
      munWidth: '88%',
      drawWidth: '9%',
      mciWidth: '3%',
    },
    '2ND': {
      homeScore: 4,
      awayScore: 0,
      statusText: "2nd Half",
      scorersHome: ["Rashford 53'", "Garnacho 65'", "Fernandes 78'", "Mainoo 88'"],
      scorersAway: ['–'],
      munProb: '97%',
      drawProb: '2%',
      mciProb: '1%',
      munWidth: '97%',
      drawWidth: '2%',
      mciWidth: '1%',
    },
  }[statsPeriod];

  const activeStats = STATS_DATA[statsPeriod];

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
          {MATCHDAY_FIXTURES.map((fix) => (
            <div
              key={fix.id}
              className="snap-start shrink-0 w-60 sm:w-64 rounded-xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3 shadow-2xs hover:border-slate-300 dark:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-[#27272A]">
                <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                  {fix.timeOrStatus}
                </span>
                <span className="truncate max-w-[110px]">{fix.venue}</span>
              </div>
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <ClubCrest code={fix.homeShort} size={18} />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">{fix.homeTeam}</span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-50 dark:bg-zinc-800/60 shrink-0">
                  {fix.homeScore !== undefined ? `${fix.homeScore} - ${fix.awayScore}` : 'vs'}
                </div>
                <div className="flex items-center justify-end gap-1.5 min-w-0 flex-1 text-right">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">{fix.awayTeam}</span>
                  <ClubCrest code={fix.awayShort} size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Workspace: FotMob 8 / 4 Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* Kolom Kiri: 8 Kolom */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6 min-w-0">

          {/* Featured Match Card Dinamis */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-5 shadow-xs overflow-hidden transition-colors flex flex-col gap-1 sm:gap-2">
            <div className="absolute -top-20 -left-20 w-52 sm:w-60 h-52 sm:h-60 bg-red-600/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-52 sm:w-60 h-52 sm:h-60 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-6">
                
                {/* Home */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 text-right min-w-0">
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      <span className="hidden sm:inline">Man United</span>
                      <span className="sm:hidden">Man Utd</span>
                    </h2>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">
                      5th in PL
                    </span>
                  </div>
                  <ClubCrest code="MUN" size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                </div>

                {/* Kolom Tengah (Skor atau Jam Kick-off) */}
                <div className="flex flex-col items-center justify-center px-1.5 sm:px-6 w-24 sm:w-36 shrink-0">
                  {currentStatus === 'UPCOMING' ? (
                    <>
                      <span className="font-mono font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                        20:00
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400 mt-1 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50">
                        Today
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                        <span className="font-black text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight tabular-nums transition-all">
                          {periodInfo.homeScore}
                        </span>
                        <span className="font-normal text-lg sm:text-2xl text-slate-300 dark:text-slate-600">-</span>
                        <span className="font-black text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight tabular-nums transition-all">
                          {periodInfo.awayScore}
                        </span>
                      </div>
                      
                      {currentStatus === 'LIVE' ? (
                        <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tactiq-coral opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tactiq-coral" />
                          </span>
                          <span className="text-[11px] sm:text-xs font-semibold text-tactiq-coral whitespace-nowrap">
                            {periodInfo.statusText}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-zinc-300 mt-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/50">
                          FT
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center justify-start gap-2 sm:gap-3 text-left min-w-0">
                  <ClubCrest code="MCI" size={40} className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-xs" />
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      Man City
                    </h2>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block font-medium truncate">
                      2nd in PL
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

              {/* xG Momentum Bar: Minimalis Unboxed */}
              {currentStatus !== 'UPCOMING' && (
                <div className="mt-4 pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-tactiq-coral">
                      <span>MUN</span>
                      <span className="text-zinc-600 font-normal">/</span>
                      <span>4.62 xG</span>
                    </div>

                    <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider text-zinc-500 px-2 py-0.5 rounded-full bg-white/[0.03]">
                      xG Momentum
                    </span>

                    <div className="flex items-center gap-1.5 font-bold text-tactiq-cyan">
                      <span>0.38 xG</span>
                      <span className="text-zinc-600 font-normal">/</span>
                      <span>MCI</span>
                    </div>
                  </div>

                  <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-zinc-800/80 flex p-0.5 gap-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-500"
                      style={{ width: '92%' }}
                    />
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                      style={{ width: '8%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Win Probability: Simetris Rapi */}
            <div className="pt-2 sm:pt-2.5 flex flex-col gap-2">
              <div className="grid grid-cols-3 items-center text-xs font-mono">
                <div className="text-left font-bold text-tactiq-coral text-[11px] sm:text-xs">
                  {currentStatus === 'UPCOMING' ? 'MUN 44%' : `MUN ${periodInfo.munProb}`}
                </div>

                <div className="text-center">
                  <span className="inline-block text-[10px] font-sans font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                    {currentStatus === 'UPCOMING' ? 'Draw 26%' : `Draw ${periodInfo.drawProb}`}
                  </span>
                </div>

                <div className="text-right font-bold text-tactiq-cyan text-[11px] sm:text-xs">
                  {currentStatus === 'UPCOMING' ? 'MCI 30%' : `MCI ${periodInfo.mciProb}`}
                </div>
              </div>

              <div className="w-full h-1.5 sm:h-2 bg-zinc-800/80 rounded-full flex overflow-hidden p-0.5 gap-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: currentStatus === 'UPCOMING' ? '44%' : periodInfo.munWidth }}
                />
                <div
                  className="h-full bg-zinc-600 rounded-full transition-all duration-300"
                  style={{ width: currentStatus === 'UPCOMING' ? '26%' : periodInfo.drawWidth }}
                />
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: currentStatus === 'UPCOMING' ? '30%' : periodInfo.mciWidth }}
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
                        {PREVIEW_ABSENTEES.home.map((p, idx) => (
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
                        {PREVIEW_ABSENTEES.away.map((p, idx) => (
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
                    {activeStats.top.map((s, idx) => (
                      <MatchStatRow key={idx} {...s} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                      Shots
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                      {activeStats.shots.map((s, idx) => (
                        <MatchStatRow key={idx} {...s} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                      Passes
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                      {activeStats.passes.map((s, idx) => (
                        <MatchStatRow key={idx} {...s} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/70 dark:bg-[#16161A] rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-[#27272A]">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1.5 sm:pb-2 mb-2 border-b border-slate-200/60 dark:border-[#27272A]">
                    Defence & Duels
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                    {activeStats.defence.map((s, idx) => (
                      <MatchStatRow key={idx} {...s} />
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
                  {/* Crest Home (Ukuran Optik Proporsional: MUN Perisai Padat) */}
                  <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-end shrink-0">
                    <ClubCrest code="MUN" size={36} className="w-8.5 h-8.5 sm:w-10 sm:h-10 drop-shadow-xs shrink-0" />
                  </div>

                  {/* Kapsul Segmented Terpadu (Opsi A) */}
                  <div className="inline-flex items-center p-0.5 sm:p-1 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 rounded-full shadow-xs gap-0.5 sm:gap-1">
                    {/* Kapsul Home Wins */}
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#DA291C] text-white shadow-xs">
                      <span className="font-extrabold text-xs sm:text-sm font-mono leading-none">2</span>
                      <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider opacity-95">
                        Wins
                      </span>
                    </div>

                    {/* Kapsul Titik Tengah (DRAWS) - Solid Neutral */}
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 shadow-xs">
                      <span className="font-extrabold text-xs sm:text-sm font-mono leading-none text-slate-900 dark:text-white">0</span>
                      <span className="text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                        Draws
                      </span>
                    </div>

                    {/* Kapsul Away Wins - Solid Sky Blue */}
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#6CABDD] text-slate-950 shadow-xs">
                      <span className="font-extrabold text-xs sm:text-sm font-mono leading-none">3</span>
                      <span className="text-[9.5px] sm:text-[11px] font-extrabold uppercase tracking-wider">
                        Wins
                      </span>
                    </div>
                  </div>

                  {/* Crest Away (Ukuran Optik Proporsional: MCI Lingkaran) */}
                  <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-start shrink-0">
                    <ClubCrest code="MCI" size={46} className="w-10.5 h-10.5 sm:w-12 sm:h-12 drop-shadow-xs shrink-0" />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-[#27272A]" />

                {/* ── List Pertandingan H2H (Pure Text Seamless, Sumbu Tengah Presisi) ── */}
                <div className="divide-y divide-slate-100 dark:divide-[#222227]">
                  {H2H_ENCOUNTERS.map((h, i) => (
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
                        {LINEUPS.home.teamRating.toFixed(1)}
                      </span>
                    )}
                    <ClubCrest code="MUN" size={20} className="shrink-0 drop-shadow-xs" />
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      Man United
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                      {LINEUPS.home.formation}
                    </span>
                  </div>

                  {currentStatus === 'UPCOMING' && (
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                      Predicted Lineups
                    </span>
                  )}

                  <div className="flex items-center justify-end gap-2 min-w-0 text-right">
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                      {LINEUPS.away.formation}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      Man City
                    </span>
                    <ClubCrest code="MCI" size={20} className="shrink-0 drop-shadow-xs" />
                    {currentStatus !== 'UPCOMING' && (
                      <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600/90 text-white shrink-0 shadow-2xs">
                        {LINEUPS.away.teamRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Header Mobile (< md): Tim Atas (Man City) */}
                <div className="md:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClubCrest code="MCI" size={20} className="shrink-0 drop-shadow-xs" />
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      Man City
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                      {LINEUPS.away.formation}
                    </span>
                  </div>
                  {currentStatus !== 'UPCOMING' ? (
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600/90 text-white shrink-0 shadow-2xs">
                      {LINEUPS.away.teamRating.toFixed(1)}
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

                  {LINEUPS.away.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={true} hideRating={currentStatus === 'UPCOMING'} />
                  ))}

                  {LINEUPS.home.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={true} hideRating={currentStatus === 'UPCOMING'} />
                  ))}
                </div>

                {/* Header Mobile (< md): Tim Bawah (Man United) */}
                <div className="md:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClubCrest code="MUN" size={20} className="shrink-0 drop-shadow-xs" />
                    <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                      Man United
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                      {LINEUPS.home.formation}
                    </span>
                  </div>
                  {currentStatus !== 'UPCOMING' ? (
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-600 text-white shrink-0 shadow-2xs">
                      {LINEUPS.home.teamRating.toFixed(1)}
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

                  {LINEUPS.home.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={false} hideRating={currentStatus === 'UPCOMING'} />
                  ))}

                  {LINEUPS.away.starters.map((p) => (
                    <UniversalPlayerNode key={p.num} p={p} isVertical={false} hideRating={currentStatus === 'UPCOMING'} />
                  ))}
                </div>

                {/* Strip Pelatih */}
                <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100/70 dark:bg-[#16161A] border border-slate-200/60 dark:border-[#27272A] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/20 shrink-0">
                      <img
                        src="https://resources.premierleague.com/premierleague25/photos/players/110x140/man1427.png"
                        alt="Rúben Amorim"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px] sm:text-xs truncate">
                      Rúben Amorim
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold px-2">
                    Coach
                  </span>

                  <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px] sm:text-xs truncate">
                      Pep Guardiola
                    </span>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-white/20 shrink-0">
                      <img
                        src="https://resources.premierleague.com/premierleague25/photos/players/110x140/man279.png"
                        alt="Pep Guardiola"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 5. TAB TABLE */}
            {matchTab === 'table' && (
              <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] p-3.5 sm:p-6 shadow-xs">
                <div className="font-mono text-xs divide-y divide-slate-100 dark:divide-[#27272A]">
                  <div className="grid grid-cols-[1fr_36px_46px_44px_78px] items-center py-2 px-2.5 sm:px-3 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    <span className="text-left">Club</span>
                    <span className="text-center">P</span>
                    <span className="text-center">GD</span>
                    <span className="text-center text-slate-900 dark:text-white">PTS</span>
                    <span className="text-center">Form</span>
                  </div>

                  {LEAGUE_STANDINGS.map((row) => (
                    <div
                      key={row.rank}
                      className="grid grid-cols-[1fr_36px_46px_44px_78px] items-center py-2.5 px-2.5 sm:px-3 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                        <span className="text-slate-500 dark:text-slate-400 w-3 font-bold text-[11px] sm:text-xs shrink-0">
                          {row.rank}
                        </span>
                        <ClubCrest code={row.club} size={16} />
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

              {LEAGUE_STANDINGS.map((row) => {
                const isArsenal = row.club === 'Arsenal';
                const isCity = row.club === 'Man City';
                return (
                  <div
                    key={row.rank}
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
                      <ClubCrest code={row.club} size={16} />
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
                onClick={() => setShowAiModal(true)}
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
              {MATCHDAY_FIXTURES.map((fix) => (
                <div
                  key={fix.id}
                  className="py-2.5 px-0.5 sm:px-1 hover:bg-slate-50 dark:hover:bg-[#1A1A1E] rounded-lg transition-colors flex items-center gap-2 text-xs"
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
                </div>
              ))}
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
                Monte Carlo match simulation outcomes based on current team xG momentum and historical Premier League head-to-head records.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center pt-1">
                <div className="p-3 bg-slate-100/80 dark:bg-[#1E1E24] rounded-xl border border-slate-300 dark:border-zinc-700 shadow-2xs">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">2 - 1</span>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold">34.2%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-xl border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">2 - 2</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">21.8%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#18181C] rounded-xl border border-slate-200 dark:border-[#27272A]">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">3 - 1</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">16.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}