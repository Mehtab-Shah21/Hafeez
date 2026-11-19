import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Brand colours are CSS variables holding space-separated RGB channels (see globals.css), so the
 * admin can change the theme at runtime and Tailwind opacity modifiers still work (bg-navy/80).
 */
const brand = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        navy: { DEFAULT: brand('navy'), 900: brand('navy-900'), 700: brand('navy-700') },
        yellow: { DEFAULT: brand('yellow'), 600: brand('yellow-600') },
        blue: { DEFAULT: brand('blue') },
        offwhite: brand('offwhite'),
        ink: brand('ink'),
        mist: brand('mist'),
        steel: brand('steel'),
        // shadcn semantic tokens, used by the admin UI
        background: brand('background'),
        foreground: brand('foreground'),
        border: brand('border'),
        ring: brand('blue'),
        muted: { DEFAULT: brand('mist'), foreground: brand('steel') },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
      },
      fontSize: {
        // Fluid display sizes; capped at 6rem per the type rules.
        'display-xl': ['clamp(3rem, 1.6rem + 6vw, 6rem)', { lineHeight: '0.92', letterSpacing: '-0.01em' }],
        'display-lg': ['clamp(2.5rem, 1.6rem + 3.6vw, 4.5rem)', { lineHeight: '0.95', letterSpacing: '-0.005em' }],
        'display-md': ['clamp(2rem, 1.5rem + 2vw, 3rem)', { lineHeight: '1', letterSpacing: '0' }],
      },
      borderRadius: {
        '3xl': '1.5rem', // 24px cards
        '4xl': '2rem', // 32px hero frame / large containers
      },
      maxWidth: { content: '1280px', prose: '68ch' },
      boxShadow: {
        card: '0 1px 2px rgb(11 27 58 / 0.04), 0 12px 32px -12px rgb(11 27 58 / 0.18)',
        lift: '0 2px 4px rgb(11 27 58 / 0.06), 0 24px 48px -16px rgb(11 27 58 / 0.28)',
        cta: '0 8px 24px -8px rgb(255 198 43 / 0.55)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
