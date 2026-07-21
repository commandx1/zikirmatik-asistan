import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1423",
          light: "#152238"
        },
        accent: {
          DEFAULT: "#2A5C3E",
          light: "#3E7E57",
          soft: "#E7F2EC"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(11,20,35,0.08) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
