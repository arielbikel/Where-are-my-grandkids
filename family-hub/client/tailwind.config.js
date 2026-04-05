/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        handwritten: ['Caveat', 'cursive'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FFF8F0',
          200: '#F5EDE0',
          300: '#EDD9C0',
        },
        earth: {
          500: '#8B7355',
          600: '#6B5445',
          700: '#3D2B1F',
          800: '#2D1B0E',
        },
        brand: {
          500: '#E76F2A',
          600: '#C2410C',
          700: '#9A3408',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
