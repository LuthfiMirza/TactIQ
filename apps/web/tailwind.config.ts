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
        // TactIQ Design System (Soft-Gray Canvas + Crisp Cards)
        tactiq: {
          // Canvas & Surfaces
          base: '#F0F2F5',       // Soft neutral gray canvas
          canvas: '#F0F2F5',
          card: '#FFFFFF',       // Crisp white cards
          cardHover: '#F8FAFC',  // Subtle light hover
          surface2: '#F1F5F9',   // Light gray inputs, chips, sub-cards
          surface3: '#E2E8F0',   // Elevated borders & dividers
          border: '#E2E8F0',     // Clean slate border
          borderHover: '#CBD5E1',

          // Signature Pitch Green
          green: '#00A83F',      // TactIQ brand green
          greenHover: '#008734',
          greenLight: '#E6F7EC', // Light green tint for badges
          greenBg: '#ECFDF5',
          greenBorder: '#A7F3D0',
          liveGreen: '#00DF59',  // Vibrant live dot / dark badge

          // Typography
          heading: '#0F172A',    // Slate 900
          text: '#1E293B',       // Slate 800
          muted: '#64748B',      // Slate 500
          dim: '#94A3B8',        // Slate 400

          // Multi-Metric Tactical Functional Tokens (Opta / StatsBomb)
          attack: '#D97706',        // xG, Big Chances
          attackBg: '#FEF3C7',
          attackBorder: '#FDE68A',
          possess: '#00A83F',       // Possession, Passing
          possessBg: '#ECFDF5',
          possessBorder: '#A7F3D0',
          defense: '#0284C7',       // Pressing, Tackles
          defenseBg: '#F0F9FF',
          defenseBorder: '#BAE6FD',
          danger: '#DC2626',        // Turnovers, Red cards
          dangerBg: '#FEF2F2',
          dangerBorder: '#FECACA',

          // Status & Rating Colors
          ratingHigh: '#00A83F',  // 8.0+ (Emerald Green)
          ratingGood: '#10B981',  // 7.0 - 7.9 (Emerald)
          ratingAvg: '#F59E0B',   // 6.0 - 6.9 (Amber)
          ratingLow: '#EF4444',   // < 6.0 (Rose)

          // Club accent colors
          arsenal: '#EF0107',
          city: '#6CABDD',
          liverpool: '#C8102E',
          chelsea: '#034694',
          barca: '#A50044',
          real: '#FEBE10',
        },
        // Backward-compatibility aliases so existing modules transition smoothly
        tq: {
          base: '#F0F2F5',
          surface: '#FFFFFF',
          surface2: '#F1F5F9',
          surface3: '#E2E8F0',
          line: '#E2E8F0',
          lineHover: '#CBD5E1',
          white: '#FFFFFF',
          muted: '#64748B',
          dim: '#94A3B8',
          coral: '#00A83F',
          coralHover: '#008734',
          coralBg: '#ECFDF5',
          coralBorder: '#A7F3D0',
          win: '#00A83F',
          winBg: '#ECFDF5',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
