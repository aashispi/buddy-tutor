import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito:  ["var(--font-nunito)",  "sans-serif"],
        fredoka: ["var(--font-fredoka)", "sans-serif"],
      },
      colors: {
        "app-bg":  "#f5f4ff",
        "chat-bg": "#f0effc",
      },
    },
  },
  plugins: [],
};
export default config;
