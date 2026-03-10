import type { Config } from "tailwindcss";

const corePreset = require("@gcforms/core/tailwind-preset");
const highlightColor = corePreset.theme?.extend?.colors?.gcds?.green?.[650] ?? "#29a356";
const logoPrimaryColor = "#D8F999";
module.exports = {
  presets: [corePreset],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        highlight: highlightColor,
        "logo-primary": logoPrimaryColor,
      },
    },
  },
  plugins: [],
} satisfies Config;
