import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('dark');

	return {
		subscribe,
		
		/**
		 * Initialize theme from localStorage or system preference
		 */
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('theme') as Theme;
				const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
				const theme = stored || systemPreference;
				
				set(theme);
				applyTheme(theme);
			}
		},

		/**
		 * Toggle between light and dark themes
		 */
		toggle: () => {
			update(current => {
				const newTheme = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', newTheme);
					applyTheme(newTheme);
				}
				return newTheme;
			});
		},

		/**
		 * Set specific theme
		 */
		setTheme: (theme: Theme) => {
			set(theme);
			if (browser) {
				localStorage.setItem('theme', theme);
				applyTheme(theme);
			}
		}
	};
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme) {
	if (!browser) return;
	
	const root = document.documentElement;
	
	// Remove existing theme classes
	root.classList.remove('light', 'dark');
	
	// Add new theme class
	root.classList.add(theme);
	
	// Set data attribute for Skeleton
	root.setAttribute('data-theme', theme === 'light' ? 'fit-light' : 'fit-dark');
}

export const theme = createThemeStore();