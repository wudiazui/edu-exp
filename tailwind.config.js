/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js,ts,jsx,tsx,mdx}",
    "!./node_modules/**",
    "./content/**/*.{js,ts,jsx,tsx}",
    "./sidebar/**/*.{html,js,ts,jsx,tsx}",
    "./options/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
};
