/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover:      "hsl(var(--primary-hover))",
          active:     "hsl(var(--primary-active))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        /* ═════════════════════════════════════════════════════
           BRAND COLORS — Paleta 2026
        ═════════════════════════════════════════════════════ */
        brand: {
          /* Base */
          espresso:  "#2C2416",
          mocha:     "#6B5744",
          cream:     "#F5F0E8",
          offwhite:  "#FEFCF8",
          bone:      "#EDE8DF",
          sand:      "#E2D9CC",
          taupe:     "#9B8B7A",
          dust:      "#C4B8AB",
          /* Primária — Sage */
          sage:      "#7A9E7E",
          "sage-light":  "#9BB89F",
          "sage-dark":   "#5C7D60",
          "sage-pale":   "#E8F0E9",
          "sage-mid":    "#C5D9C7",
          /* Acento — Terra */
          terra:     "#C4714A",
          "terra-pale": "#F5E8E0",
          "terra-mid":  "#E4C0AD",
          /* Acento 2 — Lilac */
          lilac:     "#9B8EC4",
          "lilac-pale": "#EEEAF6",
          "lilac-mid":  "#CFC8E8",
        },
        /* Status colors */
        success: {
          DEFAULT: "hsl(var(--success))",
          bg:      "hsl(var(--success-bg))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          bg:      "hsl(var(--warning-bg))",
        },
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "DM Sans", "sans-serif"],
        heading: ["var(--font-heading)", "Syne", "sans-serif"],
        mono:    ["var(--font-mono)", "DM Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
