import type { LiveScoreMatch } from './apiFootball.service.js';

export class TheSportsDbService {
  private static readonly BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

  /**
   * Fetch active real-world in-play live soccer matches from TheSportsDB (Free Public Live Stream)
   */
  public static async getLiveScores(): Promise<LiveScoreMatch[]> {
    try {
      console.log('🌐 [TheSportsDB] Polling global live soccer matches from public stream...');
      const res = await fetch(`${this.BASE_URL}/livescore.php?s=Soccer`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TactIQ-Intelligence/1.0',
        },
      });

      if (!res.ok) {
        console.warn(`⚠️ [TheSportsDB] Status: ${res.status}`);
        return [];
      }

      const json = (await res.json()) as any;
      const livescore = json?.livescore || [];
      if (!Array.isArray(livescore) || livescore.length === 0) {
        return [];
      }

      // STRICT TOP 5 EUROPEAN LEAGUES FILTER (Excluding women, youth, and non-top-5 leagues)
      const TOP_5_EXACT_NAMES = [
        'english premier league',
        'spanish la liga',
        'italian serie a',
        'german bundesliga',
        'french ligue 1',
      ];

      const top5Matches = livescore.filter((item: any) => {
        const leagueName = (item.strLeague || '').toLowerCase().trim();
        const isExcluded = leagueName.includes('women') || leagueName.includes('u19') || leagueName.includes('u21') || leagueName.includes('u23') || leagueName.includes('youth') || leagueName.includes('feminin');
        if (isExcluded) return false;
        return TOP_5_EXACT_NAMES.some((kw) => leagueName === kw || leagueName.startsWith(kw));
      });

      if (top5Matches.length === 0) {
        return [];
      }

      return top5Matches.map((item: any) => {
        const homeScore = parseInt(item.intHomeScore, 10) || 0;
        const awayScore = parseInt(item.intAwayScore, 10) || 0;
        const minute = parseInt(item.strProgress, 10) || (item.strStatus === '2H' ? 55 : 25);

        let status: 'LIVE' | 'HT' | 'FT' = 'LIVE';
        if (item.strStatus === 'HT') status = 'HT';
        else if (item.strStatus === 'FT') status = 'FT';

        return {
          fixtureId: String(item.idEvent || item.idLiveScore),
          league: item.strLeague || 'International Football',
          homeTeam: item.strHomeTeam,
          homeTeamId: parseInt(item.idHomeTeam, 10) || undefined,
          homeLogo: item.strHomeTeamBadge || undefined,
          homeScore,
          awayTeam: item.strAwayTeam,
          awayTeamId: parseInt(item.idAwayTeam, 10) || undefined,
          awayLogo: item.strAwayTeamBadge || undefined,
          awayScore,
          status,
          minute,
          events: [],
        };
      });
    } catch (err) {
      console.warn('⚠️ [TheSportsDB] Fetch error:', err);
      return [];
    }
  }
}
