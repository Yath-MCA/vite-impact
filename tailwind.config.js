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
        oxford: {
          50: '#eef3f8',
          100: '#d8e2ed',
          200: '#b7cadc',
          300: '#8eaac5',
          400: '#6388ab',
          500: '#406992',
          600: '#2a5179',
          700: '#193b60',
          800: '#0b2d53',
          900: '#002147', // Oxford Blue
        },
        primary: {
          50: '#fff3e8',
          100: '#ffe2c3',
          200: '#ffcb94',
          300: '#ffb065',
          400: '#ff9b55',
          500: '#ff8635',
          600: '#e46e22',
          700: '#c95f1d',
          800: '#a64d17',
          900: '#7a2c00',
        }
      }
    },
  },
  plugins: [],
}
