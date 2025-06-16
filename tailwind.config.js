/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Salonsphere brand colors
        primary: {
          50: '#f0f4ff',
          100: '#e3ecfb',
          500: '#7091d9',
          600: '#5a7bc8',
          700: '#4a68b5',
          900: '#051740',
        },
        background: '#f9faf7',
        muted: '#8d91a0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        // Sidebar specific colors
        sidebar: {
          bg: '#F9FAF7',
          text: '#010009',
          icon: '#B1B2AD',
          hover: '#E3ECFB',
          border: '#F3F4F6',
        },
        // Metric card colors
        metric: {
          title: '#6B7280',
          value: '#1F2937',
        },
        // Icon background colors
        icon: {
          blue: '#7091D9',
          'blue-bg': '#E3ECFB',
          green: '#ABD37A',
          'green-bg': '#E5F6EE',
          purple: '#A977FD',
          'purple-bg': '#EAE6FC',
          orange: '#EBB474',
          'orange-bg': '#FEF3C7',
        },
      },
      fontFamily: {
        sans: ['Aeonik', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Aeonik', 'Inter', 'system-ui', 'sans-serif'], // Explicit heading font
        body: ['Aeonik', 'Inter', 'system-ui', 'sans-serif'], // Explicit body font
      },
      fontWeight: {
        normal: '400', // Aeonik Regular
        medium: '500', // Aeonik Medium
        semibold: '500', // Map to Aeonik Medium
        bold: '500', // Map to Aeonik Medium (since no bold available)
      },
      fontSize: {
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'heading': ['18px', { lineHeight: '22px', fontWeight: '500' }],
        'metric': ['20px', { lineHeight: '24px', fontWeight: '500' }],
        // Mobile-first responsive font sizes
        'xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'base': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '500' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '500' }],
      },
      letterSpacing: {
        'tight': '-0.03em',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      spacing: {
        '18': '72px', // 3 * 24px
        '22': '88px', // For specific layout needs
        'sidebar': '260px',
        // Mobile-first spacing
        'mobile': '1rem',
        'mobile-lg': '1.5rem',
        'mobile-xl': '2rem',
      },
      boxShadow: {
        'card': '1px 4px 8px rgba(0, 0, 0, 0.04)',
        'hover': '2px 8px 16px rgba(0, 0, 0, 0.08)',
      },
      gridTemplateColumns: {
        'dashboard': 'repeat(12, minmax(0, 1fr))',
        'metrics': 'repeat(auto-fit, minmax(250px, 1fr))',
        'mobile-metrics': 'repeat(auto-fit, minmax(150px, 1fr))',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom breakpoints for specific layouts
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px' },
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      minWidth: {
        'touch': '44px', // Minimum touch target size
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}