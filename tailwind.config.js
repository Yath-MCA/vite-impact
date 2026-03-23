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
        blue: {
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
