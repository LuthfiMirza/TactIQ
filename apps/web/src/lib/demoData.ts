/**
 * TactIQ Demo Data Module
 * Central repository for all static fallback and demonstration data.
 * Active ONLY when DATA_MODE !== 'live' (or when demonstrating features).
 * Explicitly badged as DEMO throughout the application.
 */

export interface LineupPlayer {
  num: number;
  name: string;
  shortName?: string;
  pos: string;
  rating?: number;
  isCaptain?: boolean;
  isScorer?: boolean;
  subbedInMinute?: number;
  photoUrl?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface SubstitutePlayer {
  num: number;
  name: string;
  pos: string;
  rating?: number;
  photoUrl?: string;
  subbedInMinute?: number;
  isCaptain?: boolean;
}

export interface TeamLineup {
  formation: string;
  teamRating: number;
  starters: LineupPlayer[];
  substitutes: SubstitutePlayer[];
}

export interface AbsentPlayer {
  name: string;
  reason: string;
  expectedReturn: string;
  type: 'injury' | 'suspension';
  photoUrl?: string;
}

export interface H2HEncounter {
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

export interface MatchFixture {
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
  statusType: 'LIVE' | 'FINISHED' | 'UPCOMING';
  venue: string;
  xgHome?: number;
  xgAway?: number;
  projectedResult?: string;
  winProbHome?: number;
  matchdayNote?: string;
  isDemo?: boolean;
}

/** Check if application is running in demo/mock mode */
export function isDemoMode(): boolean {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DATA_MODE) {
    return process.env.NEXT_PUBLIC_DATA_MODE === 'demo';
  }
  return true; // default demo when live provider is not configured
}

export const DEFAULT_DEMO_MATCH = {
  id: 'pl-liv-che-gw8',
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
  statusType: 'FINISHED' as const,
  timeOrStatus: 'FT',
  scorersHome: ["Mohamed Salah 29' (P)", "Curtis Jones 51'"],
  scorersAway: ["Nicolas Jackson 48'"],
  xgHome: 1.94,
  xgAway: 1.12,
  winProbHome: 72,
  winProbDraw: 18,
  winProbAway: 10,
  isLiveFeed: false,
  isDemo: false,
  mode: 'cached' as const,
};

export const DEMO_LINEUPS: { home: TeamLineup; away: TeamLineup } = {
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

export const DEMO_STATS_DATA = {
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
      { label: 'Own half passes', homeVal: 110, awayVal: 120, homeNum: 110, awayNum: 120 },
      { label: 'Opposition half', homeVal: 144, awayVal: 110, homeNum: 144, awayNum: 110 },
      { label: 'Accurate long balls', homeVal: '14 (70%)', awayVal: '9 (50%)', homeNum: 14, awayNum: 9 },
      { label: 'Accurate crosses', homeVal: '5 (50%)', awayVal: '1 (20%)', homeNum: 5, awayNum: 1 },
      { label: 'Offsides', homeVal: 1, awayVal: 0, homeNum: 1, awayNum: 0 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '10 (83%)', awayVal: '6 (60%)', homeNum: 10, awayNum: 6 },
      { label: 'Interceptions', homeVal: 6, awayVal: 3, homeNum: 6, awayNum: 3 },
      { label: 'Clearances', homeVal: 8, awayVal: 14, homeNum: 8, awayNum: 14 },
      { label: 'Keeper saves', homeVal: 1, awayVal: 4, homeNum: 1, awayNum: 4 },
      { label: 'Fouls committed', homeVal: 4, awayVal: 7, homeNum: 4, awayNum: 7 },
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
      { label: 'Accurate passes', homeVal: '258 (88%)', awayVal: '190 (80%)', homeNum: 258, awayNum: 190 },
      { label: 'Corners', homeVal: 4, awayVal: 1, homeNum: 4, awayNum: 1 },
    ],
    shots: [
      { label: 'Shots off target', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
      { label: 'Blocked shots', homeVal: 2, awayVal: 1, homeNum: 2, awayNum: 1 },
      { label: 'Shots inside box', homeVal: 9, awayVal: 1, homeNum: 9, awayNum: 1 },
      { label: 'Shots outside box', homeVal: 3, awayVal: 1, homeNum: 3, awayNum: 1 },
    ],
    passes: [
      { label: 'Own half passes', homeVal: 108, awayVal: 115, homeNum: 108, awayNum: 115 },
      { label: 'Opposition half', homeVal: 150, awayVal: 75, homeNum: 150, awayNum: 75 },
      { label: 'Accurate long balls', homeVal: '14 (74%)', awayVal: '9 (55%)', homeNum: 14, awayNum: 9 },
      { label: 'Accurate crosses', homeVal: '4 (40%)', awayVal: '1 (17%)', homeNum: 4, awayNum: 1 },
      { label: 'Offsides', homeVal: 1, awayVal: 1, homeNum: 1, awayNum: 1 },
    ],
    defence: [
      { label: 'Tackles won', homeVal: '9 (75%)', awayVal: '5 (50%)', homeNum: 9, awayNum: 5 },
      { label: 'Interceptions', homeVal: 6, awayVal: 2, homeNum: 6, awayNum: 2 },
      { label: 'Clearances', homeVal: 8, awayVal: 12, homeNum: 8, awayNum: 12 },
      { label: 'Keeper saves', homeVal: 0, awayVal: 2, homeNum: 0, awayNum: 2 },
      { label: 'Fouls committed', homeVal: 4, awayVal: 6, homeNum: 4, awayNum: 6 },
    ],
  },
};

export const DEMO_H2H_ENCOUNTERS: H2HEncounter[] = [
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

export const DEMO_PREVIEW_ABSENTEES: { home: AbsentPlayer[]; away: AbsentPlayer[] } = {
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

export const DEMO_MATCHDAY_FIXTURES: MatchFixture[] = [
  {
    id: 'fix-1', homeTeam: 'Liverpool', homeShort: 'LIV', homeColor: '#C8102E',
    awayTeam: 'Chelsea', awayShort: 'CHE', awayColor: '#034694',
    homeScore: 3, awayScore: 1, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: 'Anfield', xgHome: 2.88, xgAway: 0.94, matchdayNote: 'High Conversion (Demo)',
    isDemo: true,
  },
  {
    id: 'fix-2', homeTeam: 'Aston Villa', homeShort: 'AVL', homeColor: '#95BFE5',
    awayTeam: 'Spurs', awayShort: 'TOT', awayColor: '#132257',
    timeOrStatus: '20:00 Today', statusType: 'UPCOMING',
    venue: 'Villa Park', projectedResult: 'Villa 2 — 1 Spurs', winProbHome: 48,
    isDemo: true,
  },
  {
    id: 'fix-3', homeTeam: 'Newcastle', homeShort: 'NEW', homeColor: '#241F20',
    awayTeam: 'Brighton', awayShort: 'BHA', awayColor: '#0057B8',
    homeScore: 0, awayScore: 0, timeOrStatus: 'FT', statusType: 'FINISHED',
    venue: "St. James' Park", xgHome: 0.88, xgAway: 0.74, matchdayNote: 'Low Block Draw (Demo)',
    isDemo: true,
  },
  {
    id: 'fix-4', homeTeam: 'Bournemouth', homeShort: 'BOU', homeColor: '#DA291C',
    awayTeam: 'Arsenal', awayShort: 'ARS', awayColor: '#EF0107',
    timeOrStatus: '16:30 Tomorrow', statusType: 'UPCOMING',
    venue: 'Vitality Stadium', projectedResult: 'Sim Readiness: 94%', matchdayNote: 'Preview Active (Demo)',
    isDemo: true,
  },
];

export const DEMO_LEAGUE_STANDINGS = [
  { rank: 1, club: 'Liverpool', code: 'LIV', played: 8, gd: '+15', pts: 21, form: ['W', 'W', 'W', 'L', 'W'], isLeader: true },
  { rank: 2, club: 'Man City', code: 'MCI', played: 8, gd: '+12', pts: 20, form: ['W', 'D', 'W', 'W', 'D'], isLeader: false },
  { rank: 3, club: 'Arsenal', code: 'ARS', played: 8, gd: '+10', pts: 17, form: ['W', 'W', 'D', 'W', 'L'], isLeader: false },
  { rank: 4, club: 'Aston Villa', code: 'AVL', played: 8, gd: '+5', pts: 17, form: ['D', 'W', 'W', 'D', 'W'], isLeader: false },
  { rank: 5, club: 'Brighton', code: 'BHA', played: 8, gd: '+4', pts: 15, form: ['W', 'D', 'L', 'W', 'W'], isLeader: false },
  { rank: 6, club: 'Chelsea', code: 'CHE', played: 8, gd: '+6', pts: 14, form: ['W', 'W', 'W', 'D', 'L'], isLeader: false },
  { rank: 7, club: 'Tottenham', code: 'TOT', played: 8, gd: '+4', pts: 13, form: ['L', 'W', 'W', 'L', 'W'], isLeader: false },
  { rank: 8, club: 'Newcastle', code: 'NEW', played: 8, gd: '+1', pts: 12, form: ['D', 'L', 'D', 'W', 'L'], isLeader: false },
];

export const SPANISH_PRESET_MATCHES: Array<{
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
      { num: 26, name: 'Kobbie Mainoo', pos: 'CM' },
      { num: 4, name: 'Declan Rice', pos: 'CM' },
      { num: 7, name: 'Bukayo Saka', pos: 'RW' },
      { num: 10, name: 'Jude Bellingham', pos: 'AM' },
      { num: 11, name: 'Phil Foden', pos: 'LW' },
      { num: 9, name: 'Harry Kane', pos: 'CF', isCaptain: true },
    ],
  },
  {
    id: 'match-rma-fcb',
    title: 'Real Madrid vs FC Barcelona (El Clásico)',
    competition: 'La Liga EA Sports (Spain)',
    venue: 'Santiago Bernabéu, Madrid',
    homeTeam: 'Real Madrid',
    homeShort: 'RMA',
    homeColor: '#FFFFFF',
    awayTeam: 'Barcelona',
    awayShort: 'FCB',
    awayColor: '#004D98',
    homeScore: 3,
    awayScore: 2,
    statusType: 'LIVE',
    timeOrStatus: "90+1'",
    scorersHome: ["Vinícius Jr 18' (P)", "Lucas Vázquez 73'", "Jude Bellingham 90+1'"],
    scorersAway: ["Andreas Christensen 6'", "Fermín López 69'"],
    xgHome: 2.34,
    xgAway: 1.82,
    events: [
      { minute: 6, team: 'Barcelona', player: 'Andreas Christensen', type: 'Goal', detail: 'Header from corner' },
      { minute: 18, team: 'Real Madrid', player: 'Vinícius Jr', type: 'Goal', detail: 'Penalty bottom left' },
      { minute: 69, team: 'Barcelona', player: 'Fermín López', type: 'Goal', detail: 'Rebound finish' },
      { minute: 73, team: 'Real Madrid', player: 'Lucas Vázquez', type: 'Goal', detail: 'Volley back post' },
      { minute: 91, team: 'Real Madrid', player: 'Jude Bellingham', type: 'Goal', detail: 'Dramatic winner inside box' },
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
      { num: 5, name: 'Jude Bellingham', pos: 'AM', isScorer: true },
      { num: 11, name: 'Rodrygo', pos: 'RW' },
      { num: 7, name: 'Vinícius Júnior', pos: 'LW', isScorer: true },
    ],
    awayLineup: [
      { num: 1, name: 'Marc-André ter Stegen', pos: 'GK', isCaptain: true },
      { num: 23, name: 'Jules Koundé', pos: 'RB' },
      { num: 4, name: 'Ronald Araújo', pos: 'CB' },
      { num: 33, name: 'Pau Cubarsí', pos: 'CB' },
      { num: 2, name: 'João Cancelo', pos: 'LB' },
      { num: 15, name: 'Andreas Christensen', pos: 'DM', isScorer: true },
      { num: 21, name: 'Frenkie de Jong', pos: 'CM' },
      { num: 22, name: 'İlkay Gündoğan', pos: 'CM' },
      { num: 27, name: 'Lamine Yamal', pos: 'RW' },
      { num: 11, name: 'Raphinha', pos: 'LW' },
      { num: 9, name: 'Robert Lewandowski', pos: 'CF' },
    ],
  },
];
