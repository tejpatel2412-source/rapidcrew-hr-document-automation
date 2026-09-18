import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { rapid: { 900: '#641515', 800: '#8B0000', 700: '#B91C1C' } } } },
  plugins: [],
};
export default config;
