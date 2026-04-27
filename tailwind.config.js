/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf9f4',
          100: '#f5f2e8',
          200: '#ebe6d0',
          300: '#dcd1b8',
          400: '#c9b3a0',
          500: '#b39588',
          600: '#9c7670',
          700: '#7a5c58',
          800: '#5a4540',
          900: '#3a2b28',
          950: '#1a1512', // Black
        },
        secondary: {
          50: '#fefce8',
          100: '#fffacc',
          200: '#fffb99',
          300: '#fffa66',
          400: '#ffed33',
          500: '#ffda00', // Yellow
          600: '#e5c200',
          700: '#ccaa00',
          800: '#b39200',
          900: '#997a00',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
    },
  },
  plugins: [],
}
