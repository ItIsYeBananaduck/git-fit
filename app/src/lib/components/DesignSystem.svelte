<!-- Design System Component for Consistent Styling -->
<script lang="ts">
	// This component serves as a design system reference
	// Import this in components that need consistent styling patterns

	export const designSystem = {
		// Colors
		colors: {
			primary: '#3B82F6',
			secondary: '#10B981',
			accent: '#F59E0B',
			dark: '#1F2937',
			light: '#F8FAFC',
			gray: {
				50: '#F9FAFB',
				100: '#F3F4F6',
				200: '#E5E7EB',
				300: '#D1D5DB',
				400: '#9CA3AF',
				500: '#6B7280',
				600: '#4B5563',
				700: '#374151',
				800: '#1F2937',
				900: '#111827'
			}
		},

		// Typography
		typography: {
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
				'3xl': '1.875rem',
				'4xl': '2.25rem'
			},
			fontWeight: {
				normal: 400,
				medium: 500,
				semibold: 600,
				bold: 700
			}
		},

		// Spacing
		spacing: {
			1: '0.25rem',
			2: '0.5rem',
			3: '0.75rem',
			4: '1rem',
			5: '1.25rem',
			6: '1.5rem',
			8: '2rem',
			10: '2.5rem',
			12: '3rem',
			16: '4rem',
			20: '5rem',
			24: '6rem'
		},

		// Border radius
		borderRadius: {
			none: '0',
			sm: '0.125rem',
			base: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			'2xl': '1rem',
			'3xl': '1.5rem',
			full: '9999px'
		},

		// Shadows
		shadows: {
			sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
			md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
			lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
			xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
			inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
		},

		// Transitions
		transitions: {
			fast: '150ms ease-in-out',
			normal: '200ms ease-in-out',
			slow: '300ms ease-in-out'
		}
	};

	// Component variants for consistent styling
	export const componentVariants = {
		button: {
			primary:
				'bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-all duration-200',
			secondary:
				'bg-secondary hover:bg-green-700 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-all duration-200',
			accent:
				'bg-accent hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-all duration-200',
			outline:
				'border border-gray-300 hover:border-primary text-gray-700 hover:text-primary font-medium py-2 px-4 rounded-xl transition-all duration-200',
			ghost:
				'text-gray-600 hover:text-primary hover:bg-gray-100 font-medium py-2 px-4 rounded-xl transition-all duration-200'
		},

		input: {
			base: 'w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200',
			error:
				'w-full px-3 py-2 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200'
		},

		card: {
			base: 'bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200',
			elevated:
				'bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200',
			outline:
				'bg-white rounded-xl border-2 border-gray-200 hover:border-primary transition-all duration-200'
		},

		badge: {
			primary:
				'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white',
			secondary:
				'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-white',
			accent:
				'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-white',
			gray: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
		}
	};
</script>

<!-- This is a utility component for design system reference -->
<div class="hidden">
	<!-- Design system documentation would go here -->
</div>
