import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { l1: "#1B7F3B", l2: "#7CB342", l3: "#F9A825", l4: "#EF6C00", l5: "#C62828", brand: "#0E5A6D" },
    fontFamily: { sans: ["Cairo", "system-ui", "sans-serif"] },
  } },
  plugins: [],
} satisfies Config;