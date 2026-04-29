/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0f1e',
        'accent-cyan': '#00d4ff',
        'accent-amber': '#ffb300',
        'accent-green': '#00e676',
        'accent-red': '#ff1744',
        surface: '#111827',
        'surface-elevated': '#1f2937',
        'text-primary': '#f9fafb',
        'text-muted': '#6b7280',
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 212, 255, 0.24)',
        amber: '0 0 24px rgba(255, 179, 0, 0.24)',
        red: '0 0 24px rgba(255, 23, 68, 0.28)',
      },
      animation: {
        pulseRing: 'pulseRing 1.8s infinite',
        rotor: 'rotor 0.32s linear infinite',
        dataFlow: 'dataFlow 2s linear infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.82)', opacity: '0.9' },
          '70%': { transform: 'scale(1.45)', opacity: '0' },
          '100%': { transform: 'scale(1.45)', opacity: '0' },
        },
        rotor: {
          to: { transform: 'rotate(360deg)' },
        },
        dataFlow: {
          from: { strokeDashoffset: '80' },
          to: { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};
