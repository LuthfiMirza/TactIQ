import type { Config } from 'tailwindcss';
import webConfig from './apps/web/tailwind.config';

const config: Config = {
  ...webConfig,
  content: [
    './apps/web/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};

export default config;
