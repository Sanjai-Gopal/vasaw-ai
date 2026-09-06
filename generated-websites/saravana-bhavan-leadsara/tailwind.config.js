/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ea580c",
          light: "#d97706",
        },
        accent: "#fef3c7",
      },
    },
  },
  plugins: [],
};
