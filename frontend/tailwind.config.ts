import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                bg: {
                    page: '#0a0c12',
                    surface: '#111520',
                    'surface-secondary': '#1a1f2e',
                    sidebar: '#0d0f18',
                },
                text: {
                    default: '#e2e8f0',
                    muted: '#64748b',
                    subtle: '#94a3b8',
                },
                accent: {
                    primary: '#6366f1',
                    foreground: '#ffffff',
                    cyan: '#22d3ee',
                },
                status: {
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    locked: '#374151',
                },
                hairline: 'rgba(148,163,184,0.09)',
                'hairline-subtle': 'rgba(148,163,184,0.08)',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                base: '15px',
            },
            borderRadius: {
                card: '0.75rem',
                control: '0.375rem',
                badge: '0.25rem',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
            },
        },
    },
    plugins: [],
} satisfies Config;
