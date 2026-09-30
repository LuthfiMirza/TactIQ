import { io } from '../websocket/socket.server.js';
import type { LiveScoreMatch } from './apiFootball.service.js';
import { TheSportsDbService } from './theSportsDb.service.js';

export interface SimulatedEventPayload {
  fixtureId: string;
  minute: number;
  team: string;
  player: string;
  type: 'Goal' | 'Card' | 'subst';
  detail?: string;
  homeScore: number;
  awayScore: number;
  mode: 'live' | 'demo';
}

export class LiveMatchEngineService {
  private static tickerInterval: NodeJS.Timeout | null = null;
  private static tickCount = 0;

  // Active in-memory live matches state
  private static liveMatches: LiveScoreMatch[] = [
    {
      fixtureId: '1583654',
      league: 'Friendlies',
      homeTeam: 'Australia',
      homeTeamId: 1530,
      homeLogo: 'https://media.api-sports.io/football/teams/1530.png',
      homeScore: 0,
      awayTeam: 'Brazil',
      awayTeamId: 6,
      awayLogo: 'https://media.api-sports.io/football/teams/6.png',
      awayScore: 1,
      status: 'LIVE',
      minute: 17,
      events: [
        { minute: 3, team: 'Brazil', player: 'Vanderson', type: 'Goal', detail: 'Normal Goal' },
        { minute: 14, team: 'Australia', player: 'Jackson Irvine', type: 'Card', detail: 'Yellow Card' },
      ],
    },
    {
      fixtureId: 'live-gw08-ars-che',
      league: 'Premier League',
      homeTeam: 'Arsenal FC',
      homeScore: 2,
      awayTeam: 'Chelsea FC',
      awayScore: 1,
      status: 'LIVE',
      minute: 73,
      events: [
        { minute: 18, team: 'Arsenal FC', player: 'Bukayo Saka', type: 'Goal', detail: 'Left-foot curl' },
        { minute: 42, team: 'Chelsea FC', player: 'Cole Palmer', type: 'Goal', detail: 'Penalty' },
        { minute: 61, team: 'Arsenal FC', player: 'Kai Havertz', type: 'Goal', detail: 'Header' },
        { minute: 68, team: 'Chelsea FC', player: 'Marc Cucurella', type: 'Card', detail: 'Yellow Card' },
      ],
    },
    {
      fixtureId: 'live-gw08-mci-liv',
      league: 'Premier League',
      homeTeam: 'Manchester City',
      homeScore: 1,
      awayTeam: 'Liverpool FC',
      awayScore: 1,
      status: 'LIVE',
      minute: 82,
      events: [
        { minute: 27, team: 'Manchester City', player: 'Erling Haaland', type: 'Goal', detail: 'Box strike' },
        { minute: 54, team: 'Liverpool FC', player: 'Mohamed Salah', type: 'Goal', detail: 'Fast break counter' },
      ],
    },
  ];

  /**
   * Start the real-time in-play ticker engine
   */
  public static startEngine(intervalMs: number = 10000): void {
    if (this.tickerInterval) return;

    console.log(`⏱️ [LiveMatchEngine] Starting real-time match in-play ticker (interval: ${intervalMs}ms)...`);
    
    // Initial sync with TheSportsDB public global stream
    TheSportsDbService.getLiveScores().then((realMatches) => {
      if (realMatches && realMatches.length > 0) {
        this.syncWithRealWorldMatches(realMatches);
      }
    }).catch(() => {});

    this.tickerInterval = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  /**
   * Stop the ticker engine (e.g. on server shutdown)
   */
  public static stopEngine(): void {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
      console.log('⏱️ [LiveMatchEngine] Stopped real-time match in-play ticker.');
    }
  }

  /**
   * Get current live matches
   */
  public static getLiveMatches(): LiveScoreMatch[] {
    return this.liveMatches;
  }

  /**
   * Sync and merge genuine live matches from TheSportsDB
   */
  public static syncWithRealWorldMatches(realMatches: LiveScoreMatch[]): void {
    let hasUpdated = false;

    for (const real of realMatches) {
      // Find if match exists by team name similarity
      const existing = this.liveMatches.find(
        (m) =>
          m.fixtureId === real.fixtureId ||
          (m.homeTeam.toLowerCase().includes(real.homeTeam.toLowerCase()) &&
            m.awayTeam.toLowerCase().includes(real.awayTeam.toLowerCase()))
      );

      if (existing) {
        // Detect real-time goal event from real world
        if (real.homeScore > existing.homeScore) {
          this.triggerEvent(existing, {
            minute: real.minute,
            team: existing.homeTeam,
            player: `${existing.homeTeam} Striker`,
            type: 'Goal',
            detail: 'Live Goal from Global Live Feed',
          });
        }
        if (real.awayScore > existing.awayScore) {
          this.triggerEvent(existing, {
            minute: real.minute,
            team: existing.awayTeam,
            player: `${existing.awayTeam} Striker`,
            type: 'Goal',
            detail: 'Live Goal from Global Live Feed',
          });
        }

        existing.minute = real.minute;
        existing.status = real.status;
        existing.homeScore = real.homeScore;
        existing.awayScore = real.awayScore;
        if (real.homeLogo && !existing.homeLogo) existing.homeLogo = real.homeLogo;
        if (real.awayLogo && !existing.awayLogo) existing.awayLogo = real.awayLogo;
        hasUpdated = true;
      } else {
        // Add new active match to live feed
        if (this.liveMatches.length < 15) {
          this.liveMatches.push(real);
          hasUpdated = true;
        }
      }
    }

    if (hasUpdated) {
      this.broadcastUpdate();
    }
  }

  /**
   * Set or update external live matches from API-Football
   */
  public static updateFromExternalApi(apiMatches: LiveScoreMatch[]): void {
    if (!apiMatches || apiMatches.length === 0) return;

    for (const ext of apiMatches) {
      const idx = this.liveMatches.findIndex((m) => m.fixtureId === ext.fixtureId);
      if (idx !== -1) {
        this.liveMatches[idx] = {
          ...this.liveMatches[idx],
          ...ext,
          events: ext.events.length > 0 ? ext.events : this.liveMatches[idx].events,
        };
      } else {
        this.liveMatches.unshift(ext);
      }
    }

    this.broadcastUpdate();
  }

  /**
   * Ticker step: advances minutes, executes storylines, syncs global feed, emits WebSocket events
   */
  private static tick(): void {
    this.tickCount++;
    let hasChanges = false;

    // Periodically poll TheSportsDB for real-world score changes (~every 30s)
    if (this.tickCount % 3 === 0) {
      TheSportsDbService.getLiveScores().then((realMatches) => {
        if (realMatches && realMatches.length > 0) {
          this.syncWithRealWorldMatches(realMatches);
        }
      }).catch(() => {});
    }

    for (const match of this.liveMatches) {
      if (match.status === 'LIVE') {
        match.minute += 1;
        hasChanges = true;

        // Half Time logic
        if (match.minute === 45) {
          match.status = 'HT';
          console.log(`⏸️ [LiveMatchEngine] ${match.homeTeam} vs ${match.awayTeam} reached Half Time!`);
        } else if (match.minute >= 90) {
          match.status = 'FT';
          console.log(`🏁 [LiveMatchEngine] ${match.homeTeam} vs ${match.awayTeam} reached Full Time!`);
        }

        // Scripted storyline moments for high realism during demo
        this.checkStorylineEvents(match);
      } else if (match.status === 'HT') {
        // After 2 ticks in HT, resume second half
        if (this.tickCount % 2 === 0) {
          match.status = 'LIVE';
          match.minute = 46;
          hasChanges = true;
          console.log(`▶️ [LiveMatchEngine] Second half started: ${match.homeTeam} vs ${match.awayTeam}`);
        }
      }
    }

    if (hasChanges) {
      this.broadcastUpdate();
    }
  }

  /**
   * Programmed dynamic match events triggered at specific in-play minutes
   */
  private static checkStorylineEvents(match: LiveScoreMatch): void {
    // Only execute scripted storyline events when DATA_MODE is demo
    const isDemo = (process.env.DATA_MODE || 'demo') === 'demo';
    if (!isDemo) return;

    // Australia vs Brazil storylines
    if (match.fixtureId === '1583654') {
      if (match.minute === 24 && !match.events.some((e) => e.minute === 24)) {
        this.triggerEvent(match, {
          minute: 24,
          team: 'Brazil',
          player: 'Gabriel Martinelli',
          type: 'Goal',
          detail: 'Left-foot curl into bottom corner',
        });
      } else if (match.minute === 36 && !match.events.some((e) => e.minute === 36)) {
        this.triggerEvent(match, {
          minute: 36,
          team: 'Australia',
          player: 'Cameron Burgess',
          type: 'Card',
          detail: 'Yellow Card (Tactical foul)',
        });
      } else if (match.minute === 41 && !match.events.some((e) => e.minute === 41)) {
        this.triggerEvent(match, {
          minute: 41,
          team: 'Australia',
          player: 'Nestory Irankunda',
          type: 'Goal',
          detail: 'Fast break counter attack',
        });
      } else if (match.minute === 65 && !match.events.some((e) => e.minute === 65)) {
        this.triggerEvent(match, {
          minute: 65,
          team: 'Brazil',
          player: 'Endrick',
          type: 'Goal',
          detail: 'Solo run strike',
        });
      }
    }

    // Arsenal vs Chelsea storylines
    if (match.fixtureId === 'live-gw08-ars-che') {
      if (match.minute === 78 && !match.events.some((e) => e.minute === 78)) {
        this.triggerEvent(match, {
          minute: 78,
          team: 'Chelsea FC',
          player: 'Nicolas Jackson',
          type: 'Goal',
          detail: 'Box tap-in equalizer',
        });
      } else if (match.minute === 88 && !match.events.some((e) => e.minute === 88)) {
        this.triggerEvent(match, {
          minute: 88,
          team: 'Arsenal FC',
          player: 'Declan Rice',
          type: 'Goal',
          detail: 'Header from Saka corner',
        });
      }
    }
  }

  /**
   * Trigger an event on a match, update score if it's a Goal, and emit via WebSocket
   */
  public static triggerEvent(
    match: LiveScoreMatch,
    event: { minute: number; team: string; player: string; type: 'Goal' | 'Card' | 'subst'; detail?: string }
  ): void {
    match.events.push(event);

    if (event.type === 'Goal') {
      if (
        event.team === match.homeTeam ||
        match.homeTeam.toLowerCase().includes(event.team.toLowerCase()) ||
        event.team.toLowerCase().includes(match.homeTeam.toLowerCase())
      ) {
        match.homeScore += 1;
      } else {
        match.awayScore += 1;
      }
    }

    console.log(
      `⚡ [LiveMatchEngine EVENT] ${event.type.toUpperCase()}: ${event.player} (${event.team} ${event.minute}') | Score: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`
    );

    // Broadcast individual event with explicit mode: 'demo'
    const eventPayload: SimulatedEventPayload = {
      fixtureId: match.fixtureId,
      minute: event.minute,
      team: event.team,
      player: event.player,
      type: event.type,
      detail: event.detail,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      mode: 'demo',
    };

    if (io) {
      // Room-based event broadcast
      io.to(`match_${match.fixtureId}`).emit('match_event', eventPayload);
      // General broadcast
      io.emit('match_event', eventPayload);
    }

    this.broadcastUpdate(match.fixtureId);
  }

  /**
   * Manual event simulation (callable from UI or API)
   */
  public static simulateGoal(
    fixtureId: string = '1583654',
    teamSide: 'home' | 'away' = 'away',
    player?: string,
    detail?: string
  ): { match: LiveScoreMatch; event: SimulatedEventPayload } {
    let match = this.liveMatches.find((m) => m.fixtureId === fixtureId);
    if (!match) {
      match = this.liveMatches[0];
    }

    const team = teamSide === 'home' ? match.homeTeam : match.awayTeam;
    const defaultPlayers: Record<string, string[]> = {
      Australia: ['Nestory Irankunda', 'Mitchell Duke', 'Craig Goodwin', 'Jackson Irvine'],
      Brazil: ['Vinicius Jr', 'Rodrygo', 'Endrick', 'Gabriel Martinelli', 'Raphinha'],
      'Arsenal FC': ['Bukayo Saka', 'Kai Havertz', 'Gabriel Martinelli', 'Declan Rice'],
      'Chelsea FC': ['Cole Palmer', 'Nicolas Jackson', 'Noni Madueke', 'Christopher Nkunku'],
    };

    const pool = defaultPlayers[team] || [teamSide === 'home' ? 'Home Striker' : 'Away Striker'];
    const chosenPlayer = player || pool[Math.floor(Math.random() * pool.length)];

    const minute = match.minute || 25;
    const goalDetail = detail || (teamSide === 'away' ? 'Clinical strike inside the box' : 'Counter attack finish');

    this.triggerEvent(match, {
      minute,
      team,
      player: chosenPlayer,
      type: 'Goal',
      detail: goalDetail,
    });

    return {
      match,
      event: {
        fixtureId: match.fixtureId,
        minute,
        team,
        player: chosenPlayer,
        type: 'Goal',
        detail: goalDetail,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        mode: 'demo',
      },
    };
  }

  /**
   * Advance minute manually
   */
  public static advanceMinute(fixtureId: string = '1583654', deltaMinutes: number = 2): LiveScoreMatch {
    let match = this.liveMatches.find((m) => m.fixtureId === fixtureId) || this.liveMatches[0];
    match.minute += deltaMinutes;
    if (match.minute >= 90) match.status = 'FT';
    else if (match.minute >= 45 && match.minute <= 46) match.status = 'HT';
    else match.status = 'LIVE';

    this.broadcastUpdate(match.fixtureId);
    return match;
  }

  /**
   * Reset match to default baseline
   */
  public static resetMatch(fixtureId: string = '1583654'): LiveScoreMatch {
    let match = this.liveMatches.find((m) => m.fixtureId === fixtureId) || this.liveMatches[0];
    match.minute = 17;
    match.homeScore = 0;
    match.awayScore = 1;
    match.status = 'LIVE';
    match.events = [
      { minute: 3, team: 'Brazil', player: 'Vanderson', type: 'Goal', detail: 'Normal Goal' },
      { minute: 14, team: 'Australia', player: 'Jackson Irvine', type: 'Card', detail: 'Yellow Card' },
    ];

    this.broadcastUpdate(match.fixtureId);
    return match;
  }

  /**
   * Broadcast all live scores to connected WebSocket clients (room-based and global)
   */
  public static broadcastUpdate(targetFixtureId?: string): void {
    if (!io) return;
    const meta = {
      source: 'TactIQ LiveMatchEngine',
      fetchedAt: new Date().toISOString(),
      isStale: false,
      mode: 'demo' as const,
    };

    if (targetFixtureId) {
      const match = this.liveMatches.find((m) => m.fixtureId === targetFixtureId);
      if (match) {
        io.to(`match_${targetFixtureId}`).emit('match_score_update', [match], meta);
      }
    }

    io.emit('match_score_update', this.liveMatches, meta);
  }

  /**
   * Snapshot provider for match room subscription
   */
  public static getMatchSnapshot(matchId: string) {
    const match = this.liveMatches.find((m) => m.fixtureId === matchId) || null;
    return {
      match,
      events: match?.events || [],
      meta: {
        source: 'TactIQ LiveMatchEngine',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'demo' as const,
      },
    };
  }
}
