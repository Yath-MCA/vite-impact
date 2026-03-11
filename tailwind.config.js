/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff3e8',
          100: '#ffe2c3',
          200: '#ffcb94',
          300: '#ffb065',
          400: '#ff9847',
          500: '#ff8635',
          600: '#e56515',
          700: '#cc4d00',
          800: '#a33c00',
          900: '#7a2c00',
        }
      }
    },
  },
  plugins: [],
}
