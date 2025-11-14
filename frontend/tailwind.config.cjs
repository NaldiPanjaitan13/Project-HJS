/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['poppins', 'ui-sans-serif', 'system-ui'],
        heading: ['poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
