'use client';

import React, { useState } from 'react';

export interface ClubInfo {
  name: string;
  short: string;
  logoUrl: string;
  color: string;
}

export const CLUB_REGISTRY: Record<string, ClubInfo> = {
  ARS: {
    name: 'Arsenal',
    short: 'ARS',
    logoUrl: 'https://media.api-sports.io/football/teams/42.png',
    color: '#EF0107',
  },
  MCI: {
    name: 'Manchester City',
    short: 'MCI',
    logoUrl: 'https://media.api-sports.io/football/teams/50.png',
    color: '#6CABDD',
  },
  LIV: {
    name: 'Liverpool',
    short: 'LIV',
    logoUrl: 'https://media.api-sports.io/football/teams/40.png',
    color: '#C8102E',
  },
  CHE: {
    name: 'Chelsea',
    short: 'CHE',
    logoUrl: 'https://media.api-sports.io/football/teams/49.png',
    color: '#034694',
  },
  TOT: {
    name: 'Tottenham Hotspur',
    short: 'TOT',
    logoUrl: 'https://media.api-sports.io/football/teams/47.png',
    color: '#132257',
  },
  AVL: {
    name: 'Aston Villa',
    short: 'AVL',
    logoUrl: 'https://media.api-sports.io/football/teams/66.png',
    color: '#95BFE5',
  },
  NEW: {
    name: 'Newcastle United',
    short: 'NEW',
    logoUrl: 'https://media.api-sports.io/football/teams/34.png',
    color: '#241F20',
  },
  BHA: {
    name: 'Brighton',
    short: 'BHA',
    logoUrl: 'https://media.api-sports.io/football/teams/51.png',
    color: '#0057B8',
  },
  BOU: {
    name: 'Bournemouth',
    short: 'BOU',
    logoUrl: 'https://media.api-sports.io/football/teams/35.png',
    color: '#DA291C',
  },
  MUN: {
    name: 'Manchester United',
    short: 'MUN',
    logoUrl: 'https://media.api-sports.io/football/teams/33.png',
    color: '#DA291C',
  },
  WHU: {
    name: 'West Ham',
    short: 'WHU',
    logoUrl: 'https://media.api-sports.io/football/teams/48.png',
    color: '#7A263A',
  },
  WOL: {
    name: 'Wolves',
    short: 'WOL',
    logoUrl: 'https://media.api-sports.io/football/teams/39.png',
    color: '#FDB913',
  },
  FUL: {
    name: 'Fulham',
    short: 'FUL',
    logoUrl: 'https://media.api-sports.io/football/teams/36.png',
    color: '#CC0000',
  },
  CRY: {
    name: 'Crystal Palace',
    short: 'CRY',
    logoUrl: 'https://media.api-sports.io/football/teams/52.png',
    color: '#1B458F',
  },
  EVE: {
    name: 'Everton',
    short: 'EVE',
    logoUrl: 'https://media.api-sports.io/football/teams/45.png',
    color: '#003399',
  },
  BRE: {
    name: 'Brentford',
    short: 'BRE',
    logoUrl: 'https://media.api-sports.io/football/teams/55.png',
    color: '#E30613',
  },
  NFO: {
    name: 'Nottingham Forest',
    short: 'NFO',
    logoUrl: 'https://media.api-sports.io/football/teams/65.png',
    color: '#DD0000',
  },
  SOU: {
    name: 'Southampton',
    short: 'SOU',
    logoUrl: 'https://media.api-sports.io/football/teams/41.png',
    color: '#D71920',
  },
  LEI: {
    name: 'Leicester City',
    short: 'LEI',
    logoUrl: 'https://media.api-sports.io/football/teams/46.png',
    color: '#003090',
  },
  IPS: {
    name: 'Ipswich Town',
    short: 'IPS',
    logoUrl: 'https://media.api-sports.io/football/teams/60.png',
    color: '#00448A',
  },
  // European top clubs
  RMA: {
    name: 'Real Madrid',
    short: 'RMA',
    logoUrl: 'https://media.api-sports.io/football/teams/541.png',
    color: '#FEBE10',
  },
  BAR: {
    name: 'Barcelona',
    short: 'BAR',
    logoUrl: 'https://media.api-sports.io/football/teams/529.png',
    color: '#004D98',
  },
  BAY: {
    name: 'Bayern München',
    short: 'BAY',
    logoUrl: 'https://media.api-sports.io/football/teams/157.png',
    color: '#DC052D',
  },
  INT: {
    name: 'Inter Milan',
    short: 'INT',
    logoUrl: 'https://media.api-sports.io/football/teams/505.png',
    color: '#010E80',
  },
  JUV: {
    name: 'Juventus',
    short: 'JUV',
    logoUrl: 'https://media.api-sports.io/football/teams/496.png',
    color: '#1A1A1A',
  },
  RSO: {
    name: 'Real Sociedad',
    short: 'RSO',
    logoUrl: 'https://media.api-sports.io/football/teams/548.png',
    color: '#0067B1',
  },
  VEN: {
    name: 'Venezia',
    short: 'VEN',
    logoUrl: 'https://media.api-sports.io/football/teams/517.png',
    color: '#005A36',
  },
  POR: {
    name: 'FC Porto',
    short: 'POR',
    logoUrl: 'https://media.api-sports.io/football/teams/212.png',
    color: '#003882',
  },
  ATH: {
    name: 'Athletic Club',
    short: 'ATH',
    logoUrl: 'https://media.api-sports.io/football/teams/531.png',
    color: '#EE2524',
  },
  RBL: {
    name: 'RB Leipzig',
    short: 'RBL',
    logoUrl: 'https://media.api-sports.io/football/teams/173.png',
    color: '#DD013F',
  },
  B04: {
    name: 'Bayer Leverkusen',
    short: 'B04',
    logoUrl: 'https://media.api-sports.io/football/teams/168.png',
    color: '#E32221',
  },
  ATA: {
    name: 'Atalanta',
    short: 'ATA',
    logoUrl: 'https://media.api-sports.io/football/teams/499.png',
    color: '#1E71B8',
  },
  LIL: {
    name: 'Lille OSC',
    short: 'LIL',
    logoUrl: 'https://media.api-sports.io/football/teams/79.png',
    color: '#E01E12',
  },
  PSG: {
    name: 'Paris Saint-Germain',
    short: 'PSG',
    logoUrl: 'https://media.api-sports.io/football/teams/85.png',
    color: '#004170',
  },
  BVB: {
    name: 'Borussia Dortmund',
    short: 'BVB',
    logoUrl: 'https://media.api-sports.io/football/teams/165.png',
    color: '#FDE100',
  },
  BRA: {
    name: 'Brazil',
    short: 'BRA',
    logoUrl: 'https://media.api-sports.io/football/teams/6.png',
    color: '#009c3b',
  },
  AUS: {
    name: 'Australia',
    short: 'AUS',
    logoUrl: 'https://media.api-sports.io/football/teams/20.png',
    color: '#00843D',
  },
  ENG: {
    name: 'England',
    short: 'ENG',
    logoUrl: 'https://media.api-sports.io/football/teams/10.png',
    color: '#00247D',
  },
  FRA: {
    name: 'France',
    short: 'FRA',
    logoUrl: 'https://media.api-sports.io/football/teams/2.png',
    color: '#002395',
  },
  USA: {
    name: 'USA',
    short: 'USA',
    logoUrl: 'https://media.api-sports.io/football/teams/238.png',
    color: '#0A3161',
  },
  WAL: {
    name: 'Wales',
    short: 'WAL',
    logoUrl: 'https://media.api-sports.io/football/teams/767.png',
    color: '#C8102E',
  },
  PHI: {
    name: 'Philippines',
    short: 'PHI',
    logoUrl: 'https://media.api-sports.io/football/teams/1567.png',
    color: '#0038A8',
  },
  PAK: {
    name: 'Pakistan',
    short: 'PAK',
    logoUrl: 'https://media.api-sports.io/football/teams/1566.png',
    color: '#115740',
  },
  // La Liga
  ATM: {
    name: 'Atlético Madrid',
    short: 'ATM',
    logoUrl: 'https://media.api-sports.io/football/teams/530.png',
    color: '#CB3524',
  },
  VIL: {
    name: 'Villarreal',
    short: 'VIL',
    logoUrl: 'https://media.api-sports.io/football/teams/533.png',
    color: '#FFE500',
  },
  SEV: {
    name: 'Sevilla',
    short: 'SEV',
    logoUrl: 'https://media.api-sports.io/football/teams/536.png',
    color: '#D4001F',
  },
  BET: {
    name: 'Real Betis',
    short: 'BET',
    logoUrl: 'https://media.api-sports.io/football/teams/543.png',
    color: '#0BB364',
  },
  VAL: {
    name: 'Valencia',
    short: 'VAL',
    logoUrl: 'https://media.api-sports.io/football/teams/532.png',
    color: '#FF7500',
  },
  GIR: {
    name: 'Girona',
    short: 'GIR',
    logoUrl: 'https://media.api-sports.io/football/teams/547.png',
    color: '#CE1126',
  },
  // Serie A
  MIL: {
    name: 'AC Milan',
    short: 'MIL',
    logoUrl: 'https://media.api-sports.io/football/teams/489.png',
    color: '#FB090B',
  },
  NAP: {
    name: 'Napoli',
    short: 'NAP',
    logoUrl: 'https://media.api-sports.io/football/teams/492.png',
    color: '#008FD7',
  },
  ROM: {
    name: 'AS Roma',
    short: 'ROM',
    logoUrl: 'https://media.api-sports.io/football/teams/497.png',
    color: '#8E1F2F',
  },
  LAZ: {
    name: 'Lazio',
    short: 'LAZ',
    logoUrl: 'https://media.api-sports.io/football/teams/487.png',
    color: '#87D8F7',
  },
  FIO: {
    name: 'Fiorentina',
    short: 'FIO',
    logoUrl: 'https://media.api-sports.io/football/teams/502.png',
    color: '#4F1E7B',
  },
  TOR: {
    name: 'Torino',
    short: 'TOR',
    logoUrl: 'https://media.api-sports.io/football/teams/503.png',
    color: '#8B0000',
  },
  // Bundesliga
  SGE: {
    name: 'Eintracht Frankfurt',
    short: 'SGE',
    logoUrl: 'https://media.api-sports.io/football/teams/169.png',
    color: '#E1000F',
  },
  VFB: {
    name: 'VfB Stuttgart',
    short: 'VFB',
    logoUrl: 'https://media.api-sports.io/football/teams/172.png',
    color: '#E32219',
  },
  WOB: {
    name: 'VfL Wolfsburg',
    short: 'WOB',
    logoUrl: 'https://media.api-sports.io/football/teams/161.png',
    color: '#65B32E',
  },
  BMG: {
    name: 'Borussia M’gladbach',
    short: 'BMG',
    logoUrl: 'https://media.api-sports.io/football/teams/163.png',
    color: '#000000',
  },
  SCF: {
    name: 'SC Freiburg',
    short: 'SCF',
    logoUrl: 'https://media.api-sports.io/football/teams/160.png',
    color: '#000000',
  },
  HOF: {
    name: 'TSG Hoffenheim',
    short: 'HOF',
    logoUrl: 'https://media.api-sports.io/football/teams/167.png',
    color: '#1C63B7',
  },
  FCU: {
    name: 'Union Berlin',
    short: 'FCU',
    logoUrl: 'https://media.api-sports.io/football/teams/182.png',
    color: '#EB1923',
  },
  // Ligue 1
  OM: {
    name: 'Olympique de Marseille',
    short: 'OM',
    logoUrl: 'https://media.api-sports.io/football/teams/81.png',
    color: '#2FAEE0',
  },
  ASM: {
    name: 'AS Monaco',
    short: 'ASM',
    logoUrl: 'https://media.api-sports.io/football/teams/91.png',
    color: '#E2001A',
  },
  OL: {
    name: 'Olympique Lyonnais',
    short: 'OL',
    logoUrl: 'https://media.api-sports.io/football/teams/80.png',
    color: '#12264C',
  },
  REN: {
    name: 'Stade Rennais',
    short: 'REN',
    logoUrl: 'https://media.api-sports.io/football/teams/94.png',
    color: '#E30613',
  },
  NIC: {
    name: 'OGC Nice',
    short: 'NIC',
    logoUrl: 'https://media.api-sports.io/football/teams/84.png',
    color: '#000000',
  },
  LEN: {
    name: 'RC Lens',
    short: 'LEN',
    logoUrl: 'https://media.api-sports.io/football/teams/116.png',
    color: '#ED1C24',
  },
};

export const CLUB_ALIASES: Record<string, string> = {
  'BRAZIL': 'BRA',
  'AUSTRALIA': 'AUS',
  'ENGLAND': 'ENG',
  'ENGLAND U20': 'ENG',
  'FRANCE': 'FRA',
  'FRANCE U20': 'FRA',
  'USA': 'USA',
  'USA U19': 'USA',
  'WALES': 'WAL',
  'WALES U19': 'WAL',
  'PHILIPPINES': 'PHI',
  'PAKISTAN': 'PAK',
  'PSG': 'PSG',
  'PARIS': 'PSG',
  'PARIS SG': 'PSG',
  'PARIS SAINT-GERMAIN': 'PSG',
  'PARIS SAINT GERMAIN': 'PSG',
  'BVB': 'BVB',
  'DORTMUND': 'BVB',
  'BORUSSIA DORTMUND': 'BVB',
  'MAN CITY': 'MCI',
  'MANCHESTER CITY': 'MCI',
  'MAN UTD': 'MUN',
  'MANCHESTER UNITED': 'MUN',
  'SPURS': 'TOT',
  'TOTTENHAM': 'TOT',
  'TOTTENHAM HOTSPUR': 'TOT',
  'NEWCASTLE': 'NEW',
  'NEWCASTLE UNITED': 'NEW',
  'WOLVES': 'WOL',
  'WOLVERHAMPTON': 'WOL',
  'WOLVERHAMPTON WANDERERS': 'WOL',
  'WEST HAM': 'WHU',
  'WEST HAM UNITED': 'WHU',
  'BRIGHTON': 'BHA',
  'BRIGHTON & HOVE ALBION': 'BHA',
  'PALACE': 'CRY',
  'CRYSTAL PALACE': 'CRY',
  'FOREST': 'NFO',
  'NOTTINGHAM FOREST': 'NFO',
  'VILLA': 'AVL',
  'ASTON VILLA': 'AVL',
  'BARCA': 'BAR',
  'BARCELONA': 'BAR',
  'REAL MADRID': 'RMA',
  'BAYERN': 'BAY',
  'BAYERN MUNICH': 'BAY',
  'BAYERN MÜNCHEN': 'BAY',
  'INTER': 'INT',
  'INTER MILAN': 'INT',
  'JUVENTUS': 'JUV',
  'JUVE': 'JUV',
  'ATALANTA': 'ATA',
  'LEVERKUSEN': 'B04',
  'BAYER LEVERKUSEN': 'B04',
  'LEIPZIG': 'RBL',
  'RB LEIPZIG': 'RBL',
  'PORTO': 'POR',
  'FC PORTO': 'POR',
  'LILLE': 'LIL',
  'LILLE OSC': 'LIL',
  'VENEZIA': 'VEN',
  'ATHLETIC': 'ATH',
  'ATHLETIC CLUB': 'ATH',
  'ATHLETIC BILBAO': 'ATH',
  'SOCIEDAD': 'RSO',
  'REAL SOCIEDAD': 'RSO',
  'LIVERPOOL': 'LIV',
  'ARSENAL': 'ARS',
  'CHELSEA': 'CHE',
  'EVERTON': 'EVE',
  'BRENTFORD': 'BRE',
  'BOURNEMOUTH': 'BOU',
  'FULHAM': 'FUL',
  'SOUTHAMPTON': 'SOU',
  'SAINTS': 'SOU',
  'SOU': 'SOU',
  'LEICESTER': 'LEI',
  'LEICESTER CITY': 'LEI',
  'LEI': 'LEI',
  'IPSWICH': 'IPS',
  'IPSWICH TOWN': 'IPS',
  'IPS': 'IPS',
  // European club aliases
  'ATLETICO': 'ATM',
  'ATLETICO MADRID': 'ATM',
  'ATLÉTICO MADRID': 'ATM',
  'ATM': 'ATM',
  'VILLARREAL': 'VIL',
  'VIL': 'VIL',
  'SEVILLA': 'SEV',
  'SEV': 'SEV',
  'BETIS': 'BET',
  'REAL BETIS': 'BET',
  'BET': 'BET',
  'VALENCIA': 'VAL',
  'VAL': 'VAL',
  'GIRONA': 'GIR',
  'GIR': 'GIR',
  'MILAN': 'MIL',
  'AC MILAN': 'MIL',
  'ACM': 'MIL',
  'MIL': 'MIL',
  'NAPOLI': 'NAP',
  'NAP': 'NAP',
  'ROMA': 'ROM',
  'AS ROMA': 'ROM',
  'ASR': 'ROM',
  'ROM': 'ROM',
  'LAZIO': 'LAZ',
  'LAZ': 'LAZ',
  'FIORENTINA': 'FIO',
  'FIO': 'FIO',
  'TORINO': 'TOR',
  'TOR': 'TOR',
  'FRANKFURT': 'SGE',
  'EINTRACHT FRANKFURT': 'SGE',
  'SGE': 'SGE',
  'STUTTGART': 'VFB',
  'VFB STUTTGART': 'VFB',
  'VFB': 'VFB',
  'WOLFSBURG': 'WOB',
  'VFL WOLFSBURG': 'WOB',
  'WOB': 'WOB',
  'GLADBACH': 'BMG',
  'BORUSSIA MÖNCHENGLADBACH': 'BMG',
  'BMG': 'BMG',
  'FREIBURG': 'SCF',
  'SC FREIBURG': 'SCF',
  'SCF': 'SCF',
  'HOFFENHEIM': 'HOF',
  'TSG HOFFENHEIM': 'HOF',
  'HOF': 'HOF',
  'UNION BERLIN': 'FCU',
  'FCU': 'FCU',
  'MARSEILLE': 'OM',
  'OLYMPIQUE MARSEILLE': 'OM',
  'OLYMPIQUE DE MARSEILLE': 'OM',
  'OM': 'OM',
  'MONACO': 'ASM',
  'AS MONACO': 'ASM',
  'ASM': 'ASM',
  'LYON': 'OL',
  'OLYMPIQUE LYONNAIS': 'OL',
  'OLYMPIQUE LYON': 'OL',
  'OL': 'OL',
  'RENNES': 'REN',
  'STADE RENNAIS': 'REN',
  'REN': 'REN',
  'SRFC': 'REN',
  'NICE': 'NIC',
  'OGC NICE': 'NIC',
  'NIC': 'NIC',
  'LENS': 'LEN',
  'RC LENS': 'LEN',
  'LEN': 'LEN',
};

// Aliases lookup helper (e.g. 'Man City' -> 'MCI' -> Manchester City)
export function resolveClubInfo(identifier: string): ClubInfo {
  const cleanId = identifier.trim().toUpperCase();
  if (CLUB_REGISTRY[cleanId]) {
    return CLUB_REGISTRY[cleanId];
  }

  // Check alias exact match
  if (CLUB_ALIASES[cleanId] && CLUB_REGISTRY[CLUB_ALIASES[cleanId]]) {
    return CLUB_REGISTRY[CLUB_ALIASES[cleanId]];
  }

  // Check alias substring match
  for (const [alias, code] of Object.entries(CLUB_ALIASES)) {
    if (cleanId === alias || cleanId.includes(alias) || alias.includes(cleanId)) {
      if (CLUB_REGISTRY[code]) return CLUB_REGISTRY[code];
    }
  }

  // Name search fallback
  const found = Object.values(CLUB_REGISTRY).find(
    (c) =>
      c.name.toUpperCase() === cleanId ||
      cleanId.includes(c.short) ||
      cleanId.includes(c.name.toUpperCase())
  );

  if (found) return found;

  return {
    name: identifier,
    short: cleanId.slice(0, 3),
    logoUrl: '',
    color: '#475569',
  };
}

interface ClubCrestProps {
  code: string;
  size?: number;
  className?: string;
  showFallbackBadge?: boolean;
}

export function ClubCrest({
  code,
  size = 24,
  className = '',
  showFallbackBadge = true,
}: ClubCrestProps) {
  const [hasError, setHasError] = useState(false);
  const club = resolveClubInfo(code);
  const hasCustomSizing = className.includes('w-') || className.includes('h-');

  if (club.logoUrl && !hasError) {
    return (
      <img
        src={club.logoUrl}
        alt={club.name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`object-contain shrink-0 drop-shadow-2xs select-none transition-opacity duration-150 ${className}`}
        style={hasCustomSizing ? undefined : { width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  if (!showFallbackBadge) return null;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-2xs select-none ${className}`}
      style={{
        ...(hasCustomSizing ? {} : { width: `${size}px`, height: `${size}px` }),
        backgroundColor: club.color,
        fontSize: `${Math.max(8, Math.floor(size * 0.38))}px`,
      }}
      title={club.name}
    >
      {club.short.slice(0, 3)}
    </div>
  );
}

interface LeagueLogoProps {
  league?: 'Premier League' | 'La Liga' | 'Serie A' | 'Bundesliga' | 'UCL' | string;
  size?: number;
  className?: string;
}

export interface LeagueInfo {
  id: number;
  name: string;
  code: string;
  fotmobId: number;
  apiSportsId: number;
}

export const LEAGUE_REGISTRY: Record<string, LeagueInfo> = {
  PREMIER_LEAGUE: { id: 47, name: 'Premier League', code: 'PL', fotmobId: 47, apiSportsId: 39 },
  CHAMPIONS_LEAGUE: { id: 42, name: 'Champions League', code: 'UCL', fotmobId: 42, apiSportsId: 2 },
  EUROPA_LEAGUE: { id: 73, name: 'Europa League', code: 'UEL', fotmobId: 73, apiSportsId: 3 },
  LA_LIGA: { id: 87, name: 'LaLiga', code: 'LL', fotmobId: 87, apiSportsId: 140 },
  SERIE_A: { id: 55, name: 'Serie A', code: 'SA', fotmobId: 55, apiSportsId: 135 },
  BUNDESLIGA: { id: 54, name: 'Bundesliga', code: 'BL', fotmobId: 54, apiSportsId: 78 },
  LIGUE_1: { id: 53, name: 'Ligue 1', code: 'L1', fotmobId: 53, apiSportsId: 61 },
  EREDIVISIE: { id: 57, name: 'Eredivisie', code: 'ERE', fotmobId: 57, apiSportsId: 88 },
  LIGA_PORTUGAL: { id: 61, name: 'Liga Portugal', code: 'LP', fotmobId: 61, apiSportsId: 94 },
  FA_CUP: { id: 77, name: 'FA Cup', code: 'FAC', fotmobId: 77, apiSportsId: 45 },
  WORLD_CUP: { id: 71, name: 'FIFA World Cup', code: 'WC', fotmobId: 71, apiSportsId: 1 },
};

export function resolveLeagueInfo(identifier: string): LeagueInfo {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes('premier') || clean === 'epl' || clean === 'pl') return LEAGUE_REGISTRY.PREMIER_LEAGUE;
  if (clean.includes('champions') || clean === 'ucl') return LEAGUE_REGISTRY.CHAMPIONS_LEAGUE;
  if (clean.includes('europa') || clean === 'uel') return LEAGUE_REGISTRY.EUROPA_LEAGUE;
  if (clean.includes('liga') && (clean.includes('la') || clean.includes('laliga') || clean.includes('spain'))) return LEAGUE_REGISTRY.LA_LIGA;
  if (clean.includes('serie') || clean.includes('italy')) return LEAGUE_REGISTRY.SERIE_A;
  if (clean.includes('bundesliga') || clean.includes('germany')) return LEAGUE_REGISTRY.BUNDESLIGA;
  if (clean.includes('ligue') || clean.includes('france')) return LEAGUE_REGISTRY.LIGUE_1;
  if (clean.includes('eredivisie') || clean.includes('netherland')) return LEAGUE_REGISTRY.EREDIVISIE;
  if (clean.includes('portugal') || clean.includes('primeira')) return LEAGUE_REGISTRY.LIGA_PORTUGAL;
  if (clean.includes('fa cup')) return LEAGUE_REGISTRY.FA_CUP;
  if (clean.includes('world cup') || clean.includes('fifa')) return LEAGUE_REGISTRY.WORLD_CUP;
  return LEAGUE_REGISTRY.PREMIER_LEAGUE;
}

export function LeagueLogo({
  league = 'Premier League',
  size = 20,
  className = '',
}: LeagueLogoProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [hasError, setHasError] = useState(false);
  const info = resolveLeagueInfo(league);

  const fotmobDarkUrl = `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${info.fotmobId}.png`;
  const fotmobLightUrl = `https://images.fotmob.com/image_resources/logo/leaguelogo/${info.fotmobId}.png`;
  const apiSportsUrl = `https://media.api-sports.io/football/leagues/${info.apiSportsId}.png`;

  if (hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono font-bold text-[9px] border border-slate-200 dark:border-zinc-700 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {info.code}
      </span>
    );
  }

  if (useFallback) {
    return (
      <img
        src={apiSportsUrl}
        alt={info.name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`object-contain shrink-0 filter dark:brightness-110 select-none ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={fotmobLightUrl}
        alt={info.name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setUseFallback(true)}
        className="w-full h-full object-contain filter drop-shadow-2xs transition-opacity duration-150 dark:hidden"
      />
      <img
        src={fotmobDarkUrl}
        alt={info.name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setUseFallback(true)}
        className="w-full h-full object-contain filter drop-shadow-2xs transition-opacity duration-150 hidden dark:block"
      />
    </span>
  );
}

export function SoccerBallIcon({
  size = 14,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 select-none ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 7 15.5 9.5 14 13.5 10 13.5 8.5 9.5" fill="currentColor" fillOpacity="0.2" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="15.5" y1="9.5" x2="20.5" y2="7.5" />
      <line x1="14" y1="13.5" x2="17.5" y2="18.5" />
      <line x1="10" y1="13.5" x2="6.5" y2="18.5" />
      <line x1="8.5" y1="9.5" x2="3.5" y2="7.5" />
    </svg>
  );
}

