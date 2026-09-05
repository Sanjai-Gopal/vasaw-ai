/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f59e0b",
          light: "#eab308",
        },
        accent: "#fbbf24",
      },
    },
  },
  plugins: [],
};
