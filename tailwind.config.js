/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tokenops-primary-50': '#F2F6FF',
        'tokenops-primary-300': '#8FAAFF',
        'tokenops-primary-400': '#5B88FE',
        'tokenops-primary-500': '#376FFE',
        'tokenops-primary-600': '#1455FE',
        'tokenops-primary-700': '#124EFE',

      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
