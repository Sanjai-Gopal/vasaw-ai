/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7f1d1d",
          light: "#991b1b",
        },
        accent: "#fbbf24",
      },
    },
  },
  plugins: [],
};
