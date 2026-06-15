/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          darker: '#1D4ED8',
          light: '#60A5FA',
          lighter: '#93C5FD',
          tint: 'rgba(59, 130, 246, 0.15)',
        },
      },
    },
  },
  plugins: [],
};
