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
        "accent-5": "var(--accent-5)",
        "accent-10": "var(--accent-10)",
        "accent-14": "var(--accent-14)",
        "accent-15": "var(--accent-15)",
        "accent-20": "var(--accent-20)",
        "accent-28": "var(--accent-28)",
        "accent-30": "var(--accent-30)",
        "accent-40": "var(--accent-40)",
        "bg-60": "var(--bg-60)",
        "bg-70": "var(--bg-70)",
        "text-muted-70": "var(--text-muted-70)",
        success: "var(--success)",
        border: "var(--border)",
        gold: "var(--gold)",
        "gold-10": "var(--gold-10)",
        "gold-30": "var(--gold-30)",
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
