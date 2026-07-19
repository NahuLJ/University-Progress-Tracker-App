import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                base: {
                    900: '#05060a',
                    800: '#0a0e17',
                    700: '#0f1623',
                    600: '#151d2e',
                    500: '#1c2638',
                },
                neon: {
                    cyan: '#22d3ee',
                    blue: '#3b82f6',
                    violet: '#a855f7',
                    pink: '#ec4899',
                    green: '#34d399',
                    yellow: '#facc15',
                    red: '#f87171',
                    orange: '#fb923c',
                },
            },
            boxShadow: {
                'neon-cyan': '0 0 3px rgba(34,211,238,0.35), 0 0 10px rgba(34,211,238,0.12)',
                'neon-violet': '0 0 3px rgba(168,85,247,0.35), 0 0 10px rgba(168,85,247,0.12)',
                'neon-pink': '0 0 3px rgba(236,72,153,0.35), 0 0 10px rgba(236,72,153,0.12)',
                'neon-green': '0 0 3px rgba(52,211,153,0.35), 0 0 10px rgba(52,211,153,0.12)',
                'neon-yellow': '0 0 3px rgba(250,204,21,0.35), 0 0 10px rgba(250,204,21,0.12)',
                'neon-red': '0 0 3px rgba(248,113,113,0.35), 0 0 10px rgba(248,113,113,0.12)',
                'neon-orange': '0 0 3px rgba(251,146,60,0.35), 0 0 10px rgba(251,146,60,0.12)',
                'neon-soft': '0 0 0 1px rgba(34,211,238,0.10), 0 8px 30px rgba(0,0,0,0.4)',
            },
            backgroundImage: {
                'grid-neon':
                    'linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)',
                'radial-glow':
                    'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.10), transparent 60%)',
            },
            backgroundSize: {
                grid: '40px 40px',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.65' },
                },
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'slide-in': {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
            },
            animation: {
                'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
                'float-slow': 'float-slow 6s ease-in-out infinite',
                'slide-in': 'slide-in 0.3s ease-out',
            },
        },
    },
    plugins: [],
} satisfies Config;
