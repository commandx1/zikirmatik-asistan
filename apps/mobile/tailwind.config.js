/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        success: "var(--success)",
        border: "var(--border)",
        gold: "var(--gold)",
        "on-gold": "var(--on-gold)",
        "toggle-on": "var(--toggle-on)",
        "toggle-on-muted": "var(--toggle-on-muted)",
        "toggle-off": "var(--toggle-off)"
      }
    }
  },
  presets: [require("nativewind/preset")],
  plugins: []
};
