import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f17',
        surface: '#111827',
        ink: '#f8fafc',
        accent: '#22d3ee',
        focus: '#facc15',
      },
    },
  },
  plugins: [],
};

export default config;