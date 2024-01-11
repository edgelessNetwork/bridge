/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        custom: ['CustomFont', 'sans-serif'],
        bridge: [
          'Nunito VF Beta',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
        ],
      },
      colors: {
        colorOne: 'var(--colorOne)',
        colorTwo: 'var(--colorTwo)',
        colorThree: 'var(--colorThree)',
        colorFour: 'var(--colorFour)',
        colorFive: 'var(--colorFive)',
        colorSix: 'var(--colorSix)',
        colorSeven: 'var(--colorSeven)',
        colorEight: 'var(--colorEight)',
      },
    },
  },
  plugins: [require('@headlessui/tailwindcss')],
};
