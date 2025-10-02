import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./app.html'
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Mobile UI Dark Theme - specified palette
				dark: {
					bg: '#0A0A0A',      // black
					navy: '#001F3F',     // navy  
					blue: '#00BFFF',     // electric blue
					gray: '#333333',     // gray
					text: '#FFFFFF'      // white text
				},
				// Existing color scheme maintained for compatibility
				primary: {
					50: '#eff6ff',
					100: '#dbeafe', 
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa', // Electric Blue
					500: '#3b82f6', // Royal Blue - Primary
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af', // Royal Blue Dark
					900: '#1e3a8a',
					950: '#172554'
				},
				secondary: {
					50: '#f9fafb',
					100: '#f3f4f6',
					200: '#e5e7eb',
					300: '#d1d5db',
					400: '#9ca3af', // Gray
					500: '#6b7280',
					600: '#4b5563',
					700: '#374151',
					800: '#1f2937',
					900: '#111827', // Black
					950: '#030712'
				},
				electric: {
					400: '#60a5fa', // Electric Blue Light
					500: '#3b82f6', // Electric Blue
					600: '#2563eb'
				},
				royal: {
					500: '#1e40af', // Royal Blue
					600: '#1d4ed8',
					700: '#1e3a8a'
				},
				gray: {
					50: '#f9fafb',
					100: '#f3f4f6',
					200: '#e5e7eb',
					300: '#d1d5db',
					400: '#9ca3af',
					500: '#6b7280',
					600: '#4b5563',
					700: '#374151',
					800: '#1f2937',
					900: '#111827'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			spacing: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)'
			},
			screens: {
				'xs': '475px',
			},
			animation: {
				'fade-in': 'fade-in 0.3s ease-out',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite'
			},
			boxShadow: {
				'mobile-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
				'mobile-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
				'mobile-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
			}
		}
	},
	plugins: [
		forms({
			strategy: 'class' // Only add form styles when using .form-input class
		}),
		typography
	]
};