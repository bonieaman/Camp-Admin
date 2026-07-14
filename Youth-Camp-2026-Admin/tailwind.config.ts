import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14152b",
        royal: "#6551a7",
        cobalt: "#2e78b7",
        amber: "#f9b21a"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(25, 20, 60, 0.14)"
      }
    }
  },
  plugins: []
} satisfies Config;
