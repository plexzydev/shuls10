/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — matches shuls-streamer-website green palette
        brand: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
          deep: '#064e3b',
        },
        kick: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
        accent: {
          gold: '#C9A84C',
          cream: '#F5F0E8',
          warm: '#E8DCC8',
          muted: '#8B7E6A',
        },
        // Surfaces — dark near-black
        surface: {
          DEFAULT: '#0a0a0a',
          50: '#D8F3DC',
          100: '#1a1a1a',
          200: '#111111',
          300: '#1c1c1c',
          400: '#232323',
        },
        // Semantic tokens matching streamer-website
        background: '#0a0a0a',
        foreground: '#f8fafc',
        card: {
          DEFAULT: '#1a1a1a',
          foreground: '#f8fafc',
        },
        popover: {
          DEFAULT: '#111111',
          foreground: '#f8fafc',
        },
        muted: {
          DEFAULT: '#1a1a1a',
          foreground: '#94a3b8',
        },
        // Keep neutral for backwards compatibility
        neutral: {
          850: '#1a1a1a',
          900: '#121212',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Space Grotesk', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        // Streamer-website float — larger range, rotation
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-20px) rotate(5deg)' },
          '75%': { transform: 'translateY(10px) rotate(-3deg)' },
        },
        'float-3d': {
          '0%': { transform: 'translateY(0) translateX(0) rotateX(0) rotateY(0)' },
          '25%': { transform: 'translateY(-15px) translateX(8px) rotateX(5deg) rotateY(5deg)' },
          '50%': { transform: 'translateY(-5px) translateX(-5px) rotateX(-3deg) rotateY(-8deg)' },
          '75%': { transform: 'translateY(-20px) translateX(3px) rotateX(8deg) rotateY(3deg)' },
          '100%': { transform: 'translateY(0) translateX(0) rotateX(0) rotateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.6' },
        },
        'grid-pan': {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '80px 80px, 80px 80px' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' }
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        breathe: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
          '50%': { boxShadow: '0 0 20px 2px rgba(34,197,94,0.15)' }
        },
        loadingBar: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' }
        },
        marqueeScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        curtainLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        curtainRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in-down': 'fadeInDown 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in-scale': 'fadeInScale 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'shimmer': 'shimmer 3s ease infinite',
        'float': 'float 7s ease-in-out infinite',
        'float-3d': 'float-3d 9s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'grid-pan': 'grid-pan 18s linear infinite',
        'spin-slow': 'spin-slow 26s linear infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'count-up': 'countUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'breathe': 'breathe 3s ease-in-out infinite',
        'loading-bar': 'loadingBar 2s cubic-bezier(0.4,0,0.2,1) 0.2s forwards',
        'marquee-scroll': 'marqueeScroll 35s linear infinite',
      },
    },
  },
  plugins: [],
}
