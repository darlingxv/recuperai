import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f1115",
        surface: "#171a21",
        surface2: "#1e222b",
        border: "#2a2f3a",
        ink: "#e7e9ee",
        muted: "#9aa1ad",
        faint: "#6b7280",
        brand: "#378add",
        "brand-soft": "#0c447c",
        success: "#1d9e75",
        warning: "#ef9f27",
        danger: "#e24b4a",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
