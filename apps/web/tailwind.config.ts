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
        tactiq: {
          bg: '#0B0E14',
          card: '#131923',
          surface: '#1A2232',
          border: '#253046',
          muted: '#8A99AD',
          emerald: '#10B981',
          cyan: '#06B6D4',
          accent: '#10B981',
          pitch: '#0d2818',
          home: '#38BDF8', // Manchester City sky blue
          away: '#F43F5E', // Arsenal bright red
          ball: '#FACC15', // Neon gold
        },
      },
      boxShadow: {
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.4)',
        'glow-subtle': '0 4px 24px -2px rgba(0, 0, 0, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        pulseRadar: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
      animation: {
        radar: 'pulseRadar 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
