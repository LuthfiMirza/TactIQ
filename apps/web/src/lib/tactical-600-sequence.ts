import type { TrackingEntity, TrackingFramePayload, TacticalMetricsDTO } from '@tactiq/shared-types';

export interface PlayerRosterInfo {
  name: string;
  pos: 'GK' | 'DEF' | 'MID' | 'FWD';
  team: 'home' | 'away';
  num: number;
  dist: string;
}

/**
 * Official FA Community Shield 2024 Starting XI Rosters
 * Manchester United (Home) vs Manchester City (Away)
 */
export const FA_COMMUNITY_SHIELD_ROSTER: Record<string, PlayerRosterInfo> = {
  // ─── Manchester United (Home / Red - 3-2-4-1 Build-up) ───────────────────
  'home_1': { name: 'André Onana', pos: 'GK', team: 'home', num: 1, dist: '4.8 km' },
  'home_5': { name: 'Harry Maguire', pos: 'DEF', team: 'home', num: 5, dist: '8.4 km' },
  'home_4': { name: 'Matthijs de Ligt', pos: 'DEF', team: 'home', num: 4, dist: '8.7 km' },
  'home_6': { name: 'Lisandro Martínez', pos: 'DEF', team: 'home', num: 6, dist: '8.9 km' },
  'home_20': { name: 'Diogo Dalot', pos: 'DEF', team: 'home', num: 20, dist: '10.8 km' },
  'home_18': { name: 'Casemiro', pos: 'MID', team: 'home', num: 18, dist: '11.2 km' },
  'home_37': { name: 'Kobbie Mainoo', pos: 'MID', team: 'home', num: 37, dist: '11.0 km' },
  'home_16': { name: 'Amad Diallo', pos: 'FWD', team: 'home', num: 16, dist: '10.4 km' },
  'home_8': { name: 'Bruno Fernandes', pos: 'MID', team: 'home', num: 8, dist: '11.6 km' },
  'home_17': { name: 'Alejandro Garnacho', pos: 'FWD', team: 'home', num: 17, dist: '9.9 km' },
  'home_7': { name: 'Mason Mount', pos: 'FWD', team: 'home', num: 7, dist: '9.5 km' },

  // ─── Manchester City (Away / Sky Blue - 4-4-2 Mid-Block) ──────────────────
  'away_31': { name: 'Ederson Moraes', pos: 'GK', team: 'away', num: 31, dist: '4.2 km' },
  'away_82': { name: 'Rico Lewis', pos: 'DEF', team: 'away', num: 82, dist: '10.5 km' },
  'away_25': { name: 'Manuel Akanji', pos: 'DEF', team: 'away', num: 25, dist: '8.6 km' },
  'away_3': { name: 'Rúben Dias', pos: 'DEF', team: 'away', num: 3, dist: '8.8 km' },
  'away_24': { name: 'Joško Gvardiol', pos: 'DEF', team: 'away', num: 24, dist: '10.7 km' },
  'away_8': { name: 'Mateo Kovačić', pos: 'MID', team: 'away', num: 8, dist: '11.4 km' },
  'away_75': { name: 'Nico O’Reilly', pos: 'MID', team: 'away', num: 75, dist: '9.8 km' },
  'away_52': { name: 'Oscar Bobb', pos: 'FWD', team: 'away', num: 52, dist: '10.9 km' },
  'away_87': { name: 'James McAtee', pos: 'MID', team: 'away', num: 87, dist: '9.6 km' },
  'away_20': { name: 'Bernardo Silva', pos: 'FWD', team: 'away', num: 20, dist: '11.8 km' },
  'away_9': { name: 'Erling Haaland', pos: 'FWD', team: 'away', num: 9, dist: '9.4 km' },

  // Match Ball
  'ball_99': { name: 'Nike Flight Match Ball', pos: 'MID', team: 'home', num: 99, dist: '18.4 km' },
};

/**
 * Computes live tactical kinematics from 11v11 entity coordinates:
 * 1. Defensive Line Height in meters (scaled to 105m pitch length)
 * 2. Team Compactness Hull Area in m^2 (Shoelace polygon formula on 105x68m)
 * 3. Inter-line Distance between Defense and Midfield in meters
 */
export function calculateTacticalMetrics(entities: TrackingEntity[]): TacticalMetricsDTO {
  const homeOutfield = entities.filter((e) => e.team === 'home' && e.jerseyNumber !== 1);
  const awayOutfield = entities.filter((e) => e.team === 'away' && e.jerseyNumber !== 31);

  // 1. Defensive Line Height
  // Home attacks left to right; goal line at 0m. Deepest defenders average x * 105m
  const homeSortedX = [...homeOutfield].sort((a, b) => a.x - b.x);
  const homeDefenders = homeSortedX.slice(0, Math.min(4, homeSortedX.length));
  const homeDefAvgX = homeDefenders.length > 0
    ? homeDefenders.reduce((acc, p) => acc + p.x, 0) / homeDefenders.length
    : 0.28;
  const homeDefLineM = parseFloat((homeDefAvgX * 105.0).toFixed(1));

  // Away attacks right to left; goal line at 105m. Deepest defenders average (1 - x) * 105m
  const awaySortedX = [...awayOutfield].sort((a, b) => b.x - a.x);
  const awayDefenders = awaySortedX.slice(0, Math.min(4, awaySortedX.length));
  const awayDefAvgX = awayDefenders.length > 0
    ? awayDefenders.reduce((acc, p) => acc + p.x, 0) / awayDefenders.length
    : 0.74;
  const awayDefLineM = parseFloat(((1.0 - awayDefAvgX) * 105.0).toFixed(1));

  // 2. Compactness Hull Area (Shoelace polygon formula scaled to 105m x 68m)
  const computeHullArea = (players: TrackingEntity[]): number => {
    if (players.length < 3) return 650.0;
    const cx = players.reduce((sum, p) => sum + p.x, 0) / players.length;
    const cy = players.reduce((sum, p) => sum + p.y, 0) / players.length;
    const sorted = [...players].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

    let area = 0.0;
    const n = sorted.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const xi = sorted[i].x * 105.0;
      const yi = sorted[i].y * 68.0;
      const xj = sorted[j].x * 105.0;
      const yj = sorted[j].y * 68.0;
      area += xi * yj - xj * yi;
    }
    return Math.max(250.0, Math.round(Math.abs(area) * 0.5));
  };

  const homeArea = computeHullArea(homeOutfield);
  const awayArea = computeHullArea(awayOutfield);

  // 3. Inter-line Distance (Defenders to Midfielders in meters)
  const homeMidfielders = homeSortedX.slice(4, Math.min(8, homeSortedX.length));
  const homeMidAvgX = homeMidfielders.length > 0
    ? homeMidfielders.reduce((acc, p) => acc + p.x, 0) / homeMidfielders.length
    : homeDefAvgX + 0.15;
  const homeInterLineM = parseFloat((Math.abs(homeMidAvgX - homeDefAvgX) * 105.0).toFixed(1));

  const awayMidfielders = awaySortedX.slice(4, Math.min(8, awaySortedX.length));
  const awayMidAvgX = awayMidfielders.length > 0
    ? awayMidfielders.reduce((acc, p) => acc + p.x, 0) / awayMidfielders.length
    : awayDefAvgX - 0.16;
  const awayInterLineM = parseFloat((Math.abs(awayDefAvgX - awayMidAvgX) * 105.0).toFixed(1));

  return {
    homeDefensiveLineMeters: homeDefLineM,
    awayDefensiveLineMeters: awayDefLineM,
    homeCompactnessAreaM2: homeArea,
    awayCompactnessAreaM2: awayArea,
    homeInterLineDistanceMeters: homeInterLineM,
    awayInterLineDistanceMeters: awayInterLineM,
  };
}

/**
 * 600-Frame Continuous Tactical Match Flow Sequence (60.0s @ 10 FPS)
 * Realistically models FA Community Shield 2024:
 * - 000-150 (0-15s): MUN 3-2-4-1 Deep Build-up vs MCI Mid-Block
 * - 150-300 (15-30s): Progression into Zone 14 & Overload with Amad/Bruno
 * - 300-450 (30-45s): Garnacho Cut-Inside & Clinical Low Finish (82' Goal sequence)
 * - 450-600 (45-60s): MCI Counter-Press & Bernardo Silva Header Equalizer (89' sequence)
 */
export function generate600FrameSequence(rawFrameIndex: number, sessionId: string = 'demo-session-tactical-001'): TrackingFramePayload {
  const f = Math.abs(rawFrameIndex) % 600;
  const t = f / 600.0; // 0.0 -> 1.0 full loop
  const sec = f * 0.1; // seconds

  // Tactical phase interpolation factor
  let phase = 1;
  let phaseT = 0;
  if (f < 150) {
    phase = 1;
    phaseT = f / 150.0;
  } else if (f < 300) {
    phase = 2;
    phaseT = (f - 150) / 150.0;
  } else if (f < 450) {
    phase = 3;
    phaseT = (f - 300) / 150.0;
  } else {
    phase = 4;
    phaseT = (f - 450) / 150.0;
  }

  // Base positions for 11 Man United players
  const homeBase = [
    { id: 1, num: 1, pos: 'GK', bx: 0.08, by: 0.50 },
    { id: 4, num: 4, pos: 'DEF', bx: 0.22, by: 0.24 },
    { id: 5, num: 5, pos: 'DEF', bx: 0.20, by: 0.50 },
    { id: 6, num: 6, pos: 'DEF', bx: 0.22, by: 0.76 },
    { id: 20, num: 20, pos: 'DEF', bx: 0.36, by: 0.16 },
    { id: 18, num: 18, pos: 'MID', bx: 0.36, by: 0.44 },
    { id: 37, num: 37, pos: 'MID', bx: 0.38, by: 0.62 },
    { id: 16, num: 16, pos: 'FWD', bx: 0.58, by: 0.18 },
    { id: 8, num: 8, pos: 'MID', bx: 0.54, by: 0.46 },
    { id: 17, num: 17, pos: 'FWD', bx: 0.60, by: 0.82 },
    { id: 7, num: 7, pos: 'FWD', bx: 0.68, by: 0.50 },
  ];

  // Base positions for 11 Man City players
  const awayBase = [
    { id: 31, num: 31, pos: 'GK', bx: 0.92, by: 0.50 },
    { id: 82, num: 82, pos: 'DEF', bx: 0.78, by: 0.20 },
    { id: 25, num: 25, pos: 'DEF', bx: 0.75, by: 0.40 },
    { id: 3, num: 3, pos: 'DEF', bx: 0.75, by: 0.60 },
    { id: 24, num: 24, pos: 'DEF', bx: 0.78, by: 0.80 },
    { id: 8, num: 8, pos: 'MID', bx: 0.58, by: 0.38 },
    { id: 75, num: 75, pos: 'MID', bx: 0.58, by: 0.62 },
    { id: 52, num: 52, pos: 'FWD', bx: 0.52, by: 0.20 },
    { id: 87, num: 87, pos: 'MID', bx: 0.50, by: 0.44 },
    { id: 20, num: 20, pos: 'FWD', bx: 0.52, by: 0.80 },
    { id: 9, num: 9, pos: 'FWD', bx: 0.42, by: 0.50 },
  ];

  // Tactical flow offsets depending on current phase
  // Phase 1: United backline circulation, City mid-block pressing
  // Phase 2: Shift to right wing (Amad) then diagonal to Zone 14 (Bruno)
  // Phase 3: Switch to left wing, Garnacho cuts inside and scores!
  // Phase 4: City counter transition down the right wing (Bobb/Bernardo)
  let homeTeamShiftX = 0;
  let homeTeamShiftY = 0;
  let awayTeamShiftX = 0;
  let awayTeamShiftY = 0;
  let ballX = 0.50;
  let ballY = 0.50;

  if (phase === 1) {
    // Build up from back
    homeTeamShiftX = Math.sin(phaseT * Math.PI) * 0.05;
    homeTeamShiftY = Math.cos(phaseT * Math.PI) * 0.03;
    awayTeamShiftX = -Math.sin(phaseT * Math.PI) * 0.04;
    // Ball moving between Onana (0.08, 0.50) -> Maguire (0.20, 0.50) -> Casemiro (0.36, 0.44)
    if (phaseT < 0.4) {
      ballX = 0.08 + phaseT * 0.3;
      ballY = 0.50 - phaseT * 0.1;
    } else {
      ballX = 0.20 + (phaseT - 0.4) * 0.26;
      ballY = 0.46 - (phaseT - 0.4) * 0.04;
    }
  } else if (phase === 2) {
    // Overload Zone 14
    homeTeamShiftX = 0.05 + phaseT * 0.10;
    awayTeamShiftX = -0.04 - phaseT * 0.08;
    // Ball passed into Zone 14 (x: 0.65, y: 0.48)
    ballX = 0.36 + phaseT * 0.29;
    ballY = 0.44 + Math.sin(phaseT * Math.PI) * 0.12;
  } else if (phase === 3) {
    // Garnacho Cut-Inside & Finish (82' Community Shield goal)
    homeTeamShiftX = 0.15 + phaseT * 0.08;
    awayTeamShiftX = -0.12 - phaseT * 0.04;
    if (phaseT < 0.6) {
      // Garnacho drives from left (0.60, 0.82) cutting toward box (0.82, 0.56)
      ballX = 0.65 + phaseT * 0.28;
      ballY = 0.56 + Math.cos(phaseT * Math.PI * 0.5) * 0.16;
    } else {
      // Shot strikes low into bottom corner!
      const shotT = (phaseT - 0.6) / 0.4;
      ballX = 0.82 + shotT * 0.13;
      ballY = 0.56 - shotT * 0.08;
    }
  } else {
    // City Counter-attack & Bernardo Silva Header Equalizer (89')
    homeTeamShiftX = 0.23 - phaseT * 0.23;
    awayTeamShiftX = -0.16 + phaseT * 0.16;
    // Ball crosses from City right wing (Bobb 0.52, 0.20) into box for Bernardo
    if (phaseT < 0.5) {
      ballX = 0.50 - phaseT * 0.50;
      ballY = 0.22 + phaseT * 0.10;
    } else {
      const headT = (phaseT - 0.5) / 0.5;
      ballX = 0.25 - headT * 0.18;
      ballY = 0.27 + headT * 0.21;
    }
  }

  // Generate 11 Home entities
  const entities: TrackingEntity[] = homeBase.map((b) => {
    const swayX = Math.sin((f * 0.08) + b.id * 1.5) * 0.015;
    const swayY = Math.cos((f * 0.08) + b.id * 1.5) * 0.015;
    let px = b.bx + homeTeamShiftX + swayX;
    let py = b.by + homeTeamShiftY + swayY;

    // Specific player dynamic moves
    if (b.num === 17 && phase === 3) {
      // Garnacho cutting inside
      px = 0.60 + phaseT * 0.24;
      py = 0.80 - phaseT * 0.26;
    } else if (b.num === 8 && phase === 2) {
      // Bruno Fernandes in Zone 14
      px = 0.54 + phaseT * 0.14;
      py = 0.46 + Math.sin(phaseT * Math.PI) * 0.06;
    }

    px = Math.min(0.96, Math.max(0.04, px));
    py = Math.min(0.96, Math.max(0.04, py));

    const speed = 12.0 + Math.abs(Math.sin(f * 0.12 + b.id) * 16.0);

    return {
      id: b.id,
      team: 'home',
      x: parseFloat(px.toFixed(4)),
      y: parseFloat(py.toFixed(4)),
      speedKmh: parseFloat(speed.toFixed(1)),
      jerseyNumber: b.num,
    };
  });

  // Generate 11 Away entities
  awayBase.forEach((b) => {
    const swayX = Math.sin((f * 0.08) + b.id * 1.5) * 0.015;
    const swayY = Math.cos((f * 0.08) + b.id * 1.5) * 0.015;
    let px = b.bx + awayTeamShiftX + swayX;
    let py = b.by + awayTeamShiftY + swayY;

    // Specific player dynamic moves
    if (b.num === 20 && phase === 4) {
      // Bernardo Silva attacking far post
      px = 0.52 - phaseT * 0.38;
      py = 0.80 - phaseT * 0.32;
    } else if (b.num === 9 && phase === 4) {
      // Haaland dragging Maguire
      px = 0.42 - phaseT * 0.28;
      py = 0.50 + Math.sin(phaseT * Math.PI) * 0.08;
    }

    px = Math.min(0.96, Math.max(0.04, px));
    py = Math.min(0.96, Math.max(0.04, py));

    const speed = 12.0 + Math.abs(Math.cos(f * 0.12 + b.id) * 15.0);

    entities.push({
      id: b.id,
      team: 'away',
      x: parseFloat(px.toFixed(4)),
      y: parseFloat(py.toFixed(4)),
      speedKmh: parseFloat(speed.toFixed(1)),
      jerseyNumber: b.num,
    });
  });

  // Add Match Ball
  const ballSpeed = phase === 3 && phaseT > 0.6 ? 84.5 : 28.5 + Math.abs(Math.sin(f * 0.25) * 22.0);
  entities.push({
    id: 99,
    team: 'ball',
    x: parseFloat(Math.min(0.97, Math.max(0.03, ballX)).toFixed(4)),
    y: parseFloat(Math.min(0.97, Math.max(0.03, ballY)).toFixed(4)),
    speedKmh: parseFloat(ballSpeed.toFixed(1)),
    jerseyNumber: 0,
  });

  const metrics = calculateTacticalMetrics(entities);

  return {
    sessionId,
    timestampMs: f * 100,
    frameNumber: f,
    entities,
    tacticalMetrics: metrics,
  };
}
