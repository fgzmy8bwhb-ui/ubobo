/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette — océan / sable / coucher de soleil
        ocean: {
          50:  '#E8F4F8',
          100: '#D0EAF1',
          200: '#9DCFDC',
          300: '#5FB0C5',
          400: '#2B91AE',
          500: '#0A6E8A',       // primary
          600: '#075C75',
          700: '#054E63',
          800: '#033B4B',
          900: '#022633',
          light: '#E8F4F8',    // alias for ocean-50, used in admin badges
          DEFAULT: '#0A6E8A',
        },
        sand: {
          50:  '#FAF4E6',
          100: '#F5E6C8',       // base sand
          200: '#EFD7A8',
          300: '#E6C181',
          400: '#D9A858',
          500: '#C9870B',
          DEFAULT: '#F5E6C8',
        },
        sunset: {
          50:  '#FFF3DA',
          100: '#FFE6B8',
          200: '#FACF82',
          300: '#F5B447',
          400: '#F2A61D',       // accent sun
          500: '#D88C0F',
          600: '#B5740A',
          700: '#8B5707',
          DEFAULT: '#F2A61D',
        },
        // Shorthand aliases used in admin UI
        sun: {
          50:  '#FFF3DA',
          100: '#FFE6B8',
          200: '#FACF82',
          400: '#F2A61D',
          500: '#D88C0F',
          DEFAULT: '#F2A61D',   // golden — same as sunset.DEFAULT
        },
        pine: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          light: '#DCFCE7',    // for bg-pine-light
          DEFAULT: '#16A34A',  // solid green (success / delivered)
        },
        // Semantic surfaces driven by CSS vars (set in index.css)
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--surface-alt) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        // Aliases kept for legacy admin classes
        deep: '#021A23',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'tighter': '-0.025em',
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '36px',
      },
      boxShadow: {
        xs:    '0 1px 2px rgb(0 0 0 / 0.04)',
        soft:  '0 4px 16px -4px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.04)',
        card:  '0 1px 0 rgb(0 0 0 / 0.04), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        lift:  '0 12px 32px -8px rgb(0 0 0 / 0.12), 0 4px 12px rgb(0 0 0 / 0.06)',
        glow:  '0 0 0 4px rgb(10 110 138 / 0.12)',
        'glow-sun': '0 0 0 4px rgb(242 166 29 / 0.18)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'hero': ['clamp(2rem, 5vw, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        'display': ['clamp(1.625rem, 3.5vw, 2.25rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
