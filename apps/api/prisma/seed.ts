import { PrismaClient, Position, MatchStatus, TrackingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TactIQ Database Seeder...');

  // 1. Clean existing records in correct relation order
  await prisma.trackingCoordinate.deleteMany({});
  await prisma.videoTrackingSession.deleteMany({});
  await prisma.h2H.deleteMany({});
  await prisma.fixture.deleteMany({});
  await prisma.standing.deleteMany({});
  await prisma.playerAttributes.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.team.deleteMany({});

  console.log('🧹 Cleaned previous database state.');

  // 2. Seed 4 Top Football Clubs
  const mci = await prisma.team.create({
    data: {
      id: 'team-mci',
      name: 'Manchester City',
      code: 'MCI',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&q=80',
      league: 'Premier League',
    },
  });

  const ars = await prisma.team.create({
    data: {
      id: 'team-ars',
      name: 'Arsenal FC',
      code: 'ARS',
      logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&q=80',
      league: 'Premier League',
    },
  });

  const liv = await prisma.team.create({
    data: {
      id: 'team-liv',
      name: 'Liverpool FC',
      code: 'LIV',
      logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=128&q=80',
      league: 'Premier League',
    },
  });

  const rma = await prisma.team.create({
    data: {
      id: 'team-rma',
      name: 'Real Madrid',
      code: 'RMA',
      logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=128&q=80',
      league: 'La Liga / European Elite',
    },
  });

  console.log('✅ Created 4 Clubs: MCI, ARS, LIV, RMA');

  // 3. Seed 20 Realistic Players with 0-100 Radar Attributes
  const playersSeedData: Array<{
    id: string;
    teamId: string;
    name: string;
    position: Position;
    nationality: string;
    age: number;
    marketValue: number;
    photoUrl: string;
    attributes: {
      pace: number;
      shooting: number;
      passing: number;
      dribbling: number;
      defending: number;
      physical: number;
      vision: number;
    };
  }> = [
    // Manchester City
    {
      id: 'player-kdb',
      teamId: mci.id,
      name: 'Kevin De Bruyne',
      position: Position.MID,
      nationality: 'Belgium',
      age: 33,
      marketValue: 50000000,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      attributes: { pace: 74, shooting: 88, passing: 95, dribbling: 87, defending: 65, physical: 78, vision: 97 },
    },
    {
      id: 'player-haaland',
      teamId: mci.id,
      name: 'Erling Haaland',
      position: Position.FWD,
      nationality: 'Norway',
      age: 24,
      marketValue: 180000000,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80',
      attributes: { pace: 91, shooting: 94, passing: 70, dribbling: 82, defending: 45, physical: 92, vision: 76 },
    },
    {
      id: 'player-rodri',
      teamId: mci.id,
      name: 'Rodri',
      position: Position.MID,
      nationality: 'Spain',
      age: 28,
      marketValue: 130000000,
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80',
      attributes: { pace: 68, shooting: 78, passing: 91, dribbling: 84, defending: 89, physical: 87, vision: 92 },
    },
    {
      id: 'player-foden',
      teamId: mci.id,
      name: 'Phil Foden',
      position: Position.MID,
      nationality: 'England',
      age: 24,
      marketValue: 150000000,
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&q=80',
      attributes: { pace: 86, shooting: 86, passing: 89, dribbling: 92, defending: 56, physical: 66, vision: 90 },
    },
    {
      id: 'player-ederson',
      teamId: mci.id,
      name: 'Ederson Moraes',
      position: Position.GK,
      nationality: 'Brazil',
      age: 31,
      marketValue: 35000000,
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&q=80',
      attributes: { pace: 64, shooting: 25, passing: 93, dribbling: 70, defending: 35, physical: 82, vision: 91 },
    },

    // Arsenal
    {
      id: 'player-odegaard',
      teamId: ars.id,
      name: 'Martin Ødegaard',
      position: Position.MID,
      nationality: 'Norway',
      age: 25,
      marketValue: 110000000,
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&q=80',
      attributes: { pace: 76, shooting: 82, passing: 93, dribbling: 90, defending: 68, physical: 69, vision: 95 },
    },
    {
      id: 'player-saka',
      teamId: ars.id,
      name: 'Bukayo Saka',
      position: Position.FWD,
      nationality: 'England',
      age: 23,
      marketValue: 140000000,
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80',
      attributes: { pace: 88, shooting: 84, passing: 86, dribbling: 90, defending: 65, physical: 76, vision: 87 },
    },
    {
      id: 'player-saliba',
      teamId: ars.id,
      name: 'William Saliba',
      position: Position.DEF,
      nationality: 'France',
      age: 23,
      marketValue: 80000000,
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80',
      attributes: { pace: 83, shooting: 40, passing: 81, dribbling: 77, defending: 91, physical: 88, vision: 80 },
    },
    {
      id: 'player-rice',
      teamId: ars.id,
      name: 'Declan Rice',
      position: Position.MID,
      nationality: 'England',
      age: 25,
      marketValue: 120000000,
      photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=256&q=80',
      attributes: { pace: 78, shooting: 74, passing: 85, dribbling: 82, defending: 88, physical: 89, vision: 84 },
    },
    {
      id: 'player-raya',
      teamId: ars.id,
      name: 'David Raya',
      position: Position.GK,
      nationality: 'Spain',
      age: 29,
      marketValue: 35000000,
      photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&q=80',
      attributes: { pace: 62, shooting: 20, passing: 86, dribbling: 65, defending: 30, physical: 78, vision: 85 },
    },

    // Liverpool
    {
      id: 'player-salah',
      teamId: liv.id,
      name: 'Mohamed Salah',
      position: Position.FWD,
      nationality: 'Egypt',
      age: 32,
      marketValue: 55000000,
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&q=80',
      attributes: { pace: 89, shooting: 90, passing: 87, dribbling: 89, defending: 45, physical: 76, vision: 90 },
    },
    {
      id: 'player-vvd',
      teamId: liv.id,
      name: 'Virgil van Dijk',
      position: Position.DEF,
      nationality: 'Netherlands',
      age: 33,
      marketValue: 30000000,
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&q=80',
      attributes: { pace: 78, shooting: 60, passing: 80, dribbling: 73, defending: 93, physical: 90, vision: 83 },
    },
    {
      id: 'player-trent',
      teamId: liv.id,
      name: 'Trent Alexander-Arnold',
      position: Position.DEF,
      nationality: 'England',
      age: 25,
      marketValue: 70000000,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80',
      attributes: { pace: 77, shooting: 75, passing: 94, dribbling: 82, defending: 74, physical: 73, vision: 94 },
    },
    {
      id: 'player-macallister',
      teamId: liv.id,
      name: 'Alexis Mac Allister',
      position: Position.MID,
      nationality: 'Argentina',
      age: 25,
      marketValue: 75000000,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80',
      attributes: { pace: 72, shooting: 79, passing: 88, dribbling: 85, defending: 79, physical: 77, vision: 89 },
    },
    {
      id: 'player-alisson',
      teamId: liv.id,
      name: 'Alisson Becker',
      position: Position.GK,
      nationality: 'Brazil',
      age: 31,
      marketValue: 28000000,
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80',
      attributes: { pace: 60, shooting: 20, passing: 87, dribbling: 60, defending: 35, physical: 85, vision: 86 },
    },

    // Real Madrid
    {
      id: 'player-bellingham',
      teamId: rma.id,
      name: 'Jude Bellingham',
      position: Position.MID,
      nationality: 'England',
      age: 21,
      marketValue: 180000000,
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&q=80',
      attributes: { pace: 82, shooting: 87, passing: 89, dribbling: 90, defending: 80, physical: 85, vision: 91 },
    },
    {
      id: 'player-vinicius',
      teamId: rma.id,
      name: 'Vinícius Júnior',
      position: Position.FWD,
      nationality: 'Brazil',
      age: 24,
      marketValue: 200000000,
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&q=80',
      attributes: { pace: 96, shooting: 85, passing: 81, dribbling: 93, defending: 38, physical: 72, vision: 84 },
    },
    {
      id: 'player-valverde',
      teamId: rma.id,
      name: 'Federico Valverde',
      position: Position.MID,
      nationality: 'Uruguay',
      age: 26,
      marketValue: 130000000,
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&q=80',
      attributes: { pace: 89, shooting: 84, passing: 86, dribbling: 84, defending: 81, physical: 89, vision: 86 },
    },
    {
      id: 'player-rudiger',
      teamId: rma.id,
      name: 'Antonio Rüdiger',
      position: Position.DEF,
      nationality: 'Germany',
      age: 31,
      marketValue: 25000000,
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80',
      attributes: { pace: 84, shooting: 55, passing: 74, dribbling: 68, defending: 88, physical: 91, vision: 72 },
    },
    {
      id: 'player-courtois',
      teamId: rma.id,
      name: 'Thibaut Courtois',
      position: Position.GK,
      nationality: 'Belgium',
      age: 32,
      marketValue: 28000000,
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&q=80',
      attributes: { pace: 55, shooting: 20, passing: 78, dribbling: 55, defending: 30, physical: 84, vision: 80 },
    },
  ];

  for (const item of playersSeedData) {
    const { attributes, ...playerFields } = item;
    const player = await prisma.player.create({
      data: playerFields,
    });

    await prisma.playerAttributes.create({
      data: {
        playerId: player.id,
        ...attributes,
      },
    });
  }

  console.log(`✅ Seeded ${playersSeedData.length} Players with 1-to-1 Radar Attributes.`);

  // 4. Seed 2 Upcoming Fixtures
  const matchDate1 = new Date();
  matchDate1.setDate(matchDate1.getDate() + 3); // 3 days ahead
  matchDate1.setHours(20, 0, 0, 0);

  const matchDate2 = new Date();
  matchDate2.setDate(matchDate2.getDate() + 7); // 7 days ahead
  matchDate2.setHours(21, 0, 0, 0);

  const fixture1 = await prisma.fixture.create({
    data: {
      id: 'fixture-mci-ars-2026',
      homeTeamId: mci.id,
      awayTeamId: ars.id,
      matchDate: matchDate1,
      status: MatchStatus.SCHEDULED,
      homeScore: null,
      awayScore: null,
      venue: 'Etihad Stadium, Manchester',
    },
  });

  const fixture2 = await prisma.fixture.create({
    data: {
      id: 'fixture-liv-rma-2026',
      homeTeamId: liv.id,
      awayTeamId: rma.id,
      matchDate: matchDate2,
      status: MatchStatus.SCHEDULED,
      homeScore: null,
      awayScore: null,
      venue: 'Anfield, Liverpool',
    },
  });

  console.log('✅ Seeded 2 Upcoming Fixtures: MCI vs ARS, LIV vs RMA');

  // 5. Seed Head-to-Head (H2H) Records
  await prisma.h2H.create({
    data: {
      id: 'h2h-mci-ars',
      teamHomeId: mci.id,
      teamAwayId: ars.id,
      matchesPlayed: 14,
      homeWins: 8,
      awayWins: 3,
      draws: 3,
    },
  });

  await prisma.h2H.create({
    data: {
      id: 'h2h-liv-rma',
      teamHomeId: liv.id,
      teamAwayId: rma.id,
      matchesPlayed: 11,
      homeWins: 3,
      awayWins: 7,
      draws: 1,
    },
  });

  console.log('✅ Seeded H2H Records for fixtures.');

  // 6. Seed League Standings Table
  await prisma.standing.createMany({
    data: [
      { id: 'std-mci', teamId: mci.id, position: 1, played: 28, won: 20, drawn: 5, lost: 3, goalsFor: 68, goalsAgainst: 26, goalDifference: 42, points: 65 },
      { id: 'std-ars', teamId: ars.id, position: 2, played: 28, won: 20, drawn: 4, lost: 4, goalsFor: 70, goalsAgainst: 24, goalDifference: 46, points: 64 },
      { id: 'std-liv', teamId: liv.id, position: 3, played: 28, won: 19, drawn: 6, lost: 3, goalsFor: 65, goalsAgainst: 27, goalDifference: 38, points: 63 },
      { id: 'std-rma', teamId: rma.id, position: 1, played: 28, won: 21, drawn: 5, lost: 2, goalsFor: 64, goalsAgainst: 18, goalDifference: 46, points: 68 },
    ],
  });

  console.log('✅ Seeded League Standings.');

  // 6. Seed 1 Pre-calculated Mock Video Session (10s @ 10fps = 100 frames)
  const session = await prisma.videoTrackingSession.create({
    data: {
      id: 'demo-session-tactical-001',
      youtubeUrl: 'https://www.youtube.com/watch?v=tactiq_sample_mci_ars',
      matchTitle: 'Manchester City vs Arsenal - Tactical Cam View (First Half Phase)',
      status: TrackingStatus.READY,
      durationSeconds: 10,
    },
  });

  console.log(`🎬 Creating 100 frames of tracking coordinates for session ${session.id}...`);

  // Initial player positions on a normalized pitch [xNorm, yNorm] between 0.05 and 0.95
  const baseEntities = [
    // Home team (MCI - Blue)
    { id: 1, teamSide: 'home', x: 0.15, y: 0.50, vx: 0.001, vy: 0.000 }, // GK
    { id: 2, teamSide: 'home', x: 0.32, y: 0.25, vx: 0.002, vy: 0.001 }, // LB
    { id: 3, teamSide: 'home', x: 0.30, y: 0.45, vx: 0.001, vy: -0.001 }, // CB
    { id: 4, teamSide: 'home', x: 0.30, y: 0.55, vx: 0.001, vy: 0.001 }, // CB
    { id: 5, teamSide: 'home', x: 0.33, y: 0.75, vx: 0.002, vy: -0.001 }, // RB
    { id: 6, teamSide: 'home', x: 0.46, y: 0.50, vx: 0.003, vy: 0.002 }, // DM (Rodri)
    { id: 7, teamSide: 'home', x: 0.55, y: 0.35, vx: 0.004, vy: 0.001 }, // AM (KDB)
    { id: 8, teamSide: 'home', x: 0.65, y: 0.50, vx: 0.004, vy: -0.002 }, // ST (Haaland)

    // Away team (ARS - Red)
    { id: 11, teamSide: 'away', x: 0.85, y: 0.50, vx: -0.001, vy: 0.000 }, // GK
    { id: 12, teamSide: 'away', x: 0.70, y: 0.30, vx: -0.002, vy: 0.001 }, // CB (Saliba)
    { id: 13, teamSide: 'away', x: 0.70, y: 0.70, vx: -0.002, vy: -0.001 }, // CB (Gabriel)
    { id: 14, teamSide: 'away', x: 0.58, y: 0.48, vx: -0.003, vy: 0.002 }, // DM (Rice)
    { id: 15, teamSide: 'away', x: 0.52, y: 0.62, vx: -0.002, vy: -0.003 }, // AM (Odegaard)
    { id: 16, teamSide: 'away', x: 0.48, y: 0.28, vx: -0.001, vy: 0.002 }, // RW (Saka)

    // Ball
    { id: 99, teamSide: 'ball', x: 0.52, y: 0.49, vx: 0.006, vy: -0.003 },
  ];

  const coordinateRows = [];

  for (let frame = 0; frame < 100; frame++) {
    const timestampMs = frame * 100; // 100ms per frame = 10fps

    // Compute subtle kinematic movement and oscillations
    const playersData = baseEntities.map((ent) => {
      // sinusoidal oscillation to simulate real tactical pressing runs
      const noiseX = Math.sin((frame + ent.id * 10) * 0.15) * 0.004;
      const noiseY = Math.cos((frame + ent.id * 10) * 0.15) * 0.004;

      const currentX = Math.min(0.95, Math.max(0.05, ent.x + ent.vx * frame * 0.5 + noiseX));
      const currentY = Math.min(0.95, Math.max(0.05, ent.y + ent.vy * frame * 0.5 + noiseY));

      return {
        id: ent.id,
        teamSide: ent.teamSide,
        xNorm: parseFloat(currentX.toFixed(4)),
        yNorm: parseFloat(currentY.toFixed(4)),
      };
    });

    coordinateRows.push({
      sessionId: session.id,
      timestampMs,
      frameNumber: frame,
      playersData: playersData as any,
    });
  }

  // Bulk insert coordinates
  await prisma.trackingCoordinate.createMany({
    data: coordinateRows,
  });

  console.log(`✅ Seeded 100 Frames of tracking data for session: ${session.id}`);
  console.log('🎉 TactIQ Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
