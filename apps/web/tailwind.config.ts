import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FotMob Design System + Multi-Metric Analytics Tokens
        fm: {
          // Canvas & Surfaces (FotMob Matchday Pro)
          base: '#0B0E14',       // Deep stadium dark canvas
          card: '#141A24',       // Crisp card surface
          cardHover: '#1C2432',  // Hover surface
          surface2: '#1D2534',   // Inner elements, tabs & input bg
          surface3: '#252F42',   // Elevated chips & highlights
          border: '#222B3D',     // Crisp card border
          borderHover: '#35425C',

          // Signature Electric Football Green
          green: '#00DF59',
          greenHover: '#00C84F',
          greenBg: '#092B16',
          greenBorder: '#145A30',

          // Typography
          white: '#FFFFFF',
          text: '#E2E8F0',
          muted: '#8E9EB5',
          dim: '#596982',

          // Multi-Metric Tactical Functional Tokens (StatsBomb / Opta)
          attack: '#F59E0B',        // xG, Big Chances, Shots, Attacking Threat
          attackBg: '#2E1F07',
          attackBorder: '#5E3D0A',
          possess: '#00DF59',       // Possession, Passing Volume, Key Passes
          possessBg: '#092B16',
          possessBorder: '#145A30',
          defense: '#38BDF8',       // Pressing (PPDA), Interceptions, Blocks, Duals
          defenseBg: '#0A253A',
          defenseBorder: '#16486D',
          danger: '#EF4444',        // Turnovers, Disciplinary, High Risk
          dangerBg: '#2E0F10',
          dangerBorder: '#5C1E20',

          // Status & Rating Colors (FotMob Standard)
          ratingHigh: '#00DF59',  // 8.0+
          ratingGood: '#10B981',  // 7.0 - 7.9
          ratingAvg: '#F59E0B',   // 6.0 - 6.9
          ratingLow: '#EF4444',   // < 6.0

          // Club accent colors
          arsenal: '#EF0107',
          city: '#6CABDD',
          liverpool: '#C8102E',
          chelsea: '#034694',
          barca: '#A50044',
          real: '#FEBE10',
        },
        // Backward-compatibility aliases so shared components don't break
        tq: {
          base: '#0B0E14',
          surface: '#141A24',
          surface2: '#1D2534',
          surface3: '#252F42',
          line: '#222B3D',
          lineHover: '#35425C',
          white: '#FFFFFF',
          muted: '#8E9EB5',
          dim: '#596982',
          coral: '#00DF59',
          coralHover: '#00C84F',
          coralBg: '#092B16',
          coralBorder: '#145A30',
          win: '#00DF59',
          winBg: '#092B16',
        },
      },
      fontFamily: {
        display: ['Syne', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
