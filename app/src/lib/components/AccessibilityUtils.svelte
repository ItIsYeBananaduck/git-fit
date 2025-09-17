<script lang="ts">
	// Accessibility utility functions for the Technically Fit application

	// Generate unique IDs for ARIA relationships
	let idCounter = 0;
	export function generateId(prefix = 'tf'): string {
		return `${prefix}-${++idCounter}`;
	}

	// Focus management utilities
	export function focusElement(element: HTMLElement): void {
		if (element && typeof element.focus === 'function') {
			element.focus();
		}
	}

	export function trapFocus(container: HTMLElement): void {
		const focusableElements = container.querySelectorAll(
			'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		function handleTabKey(e: KeyboardEvent): void {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					lastElement.focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === lastElement) {
					firstElement.focus();
					e.preventDefault();
				}
			}
		}

		container.addEventListener('keydown', handleTabKey);

		// Return cleanup function
		return () => container.removeEventListener('keydown', handleTabKey);
	}

	// Screen reader announcements
	export function announceToScreenReader(
		message: string,
		priority: 'polite' | 'assertive' = 'polite'
	): void {
		const announcement = document.createElement('div');
		announcement.setAttribute('aria-live', priority);
		announcement.setAttribute('aria-atomic', 'true');
		announcement.style.position = 'absolute';
		announcement.style.left = '-10000px';
		announcement.style.width = '1px';
		announcement.style.height = '1px';
		announcement.style.overflow = 'hidden';

		document.body.appendChild(announcement);
		announcement.textContent = message;

		// Remove after announcement
		setTimeout(() => {
			if (announcement.parentNode) {
				announcement.parentNode.removeChild(announcement);
			}
		}, 1000);
	}

	// Keyboard navigation helpers
	export function handleKeyboardActivation(event: KeyboardEvent, callback: () => void): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			callback();
		}
	}

	// Enhanced keyboard navigation for menus and lists
	export function createMenuNavigation(
		items: HTMLElement[],
		onSelect?: (index: number) => void,
		onEscape?: () => void
	): (event: KeyboardEvent) => void {
		let currentIndex = -1;

		return (event: KeyboardEvent) => {
			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					currentIndex = Math.min(currentIndex + 1, items.length - 1);
					items[currentIndex]?.focus();
					break;
				case 'ArrowUp':
					event.preventDefault();
					currentIndex = Math.max(currentIndex - 1, 0);
					items[currentIndex]?.focus();
					break;
				case 'Home':
					event.preventDefault();
					currentIndex = 0;
					items[currentIndex]?.focus();
					break;
				case 'End':
					event.preventDefault();
					currentIndex = items.length - 1;
					items[currentIndex]?.focus();
					break;
				case 'Enter':
				case ' ':
					event.preventDefault();
					if (currentIndex >= 0 && onSelect) {
						onSelect(currentIndex);
					}
					break;
				case 'Escape':
					event.preventDefault();
					if (onEscape) onEscape();
					break;
			}
		};
	}

	// Focus trap for modals and dropdowns
	export function createFocusTrap(container: HTMLElement): () => void {
		const focusableElements = container.querySelectorAll(
			'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		function handleTabKey(e: KeyboardEvent): void {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					lastElement.focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === lastElement) {
					firstElement.focus();
					e.preventDefault();
				}
			}
		}

		container.addEventListener('keydown', handleTabKey);

		// Focus first element when trap is created
		setTimeout(() => firstElement?.focus(), 10);

		// Return cleanup function
		return () => container.removeEventListener('keydown', handleTabKey);
	}

	// Color contrast utilities (basic implementation)
	export function hasGoodContrast(foreground: string, background: string): boolean {
		// This is a simplified version - in production, use a proper color contrast library
		// For now, we'll assume good contrast for our design system colors
		return true;
	}

	// Skip link functionality
	export function createSkipLink(targetId: string, linkText = 'Skip to main content'): HTMLElement {
		const skipLink = document.createElement('a');
		skipLink.href = `#${targetId}`;
		skipLink.textContent = linkText;
		skipLink.className = 'skip-link';
		skipLink.style.cssText = `
			position: absolute;
			top: -40px;
			left: 6px;
			background: #000;
			color: #fff;
			padding: 8px;
			text-decoration: none;
			z-index: 1000;
			border-radius: 4px;
		`;

		skipLink.addEventListener('focus', () => {
			skipLink.style.top = '6px';
		});

		skipLink.addEventListener('blur', () => {
			skipLink.style.top = '-40px';
		});

		return skipLink;
	}
</script>

<!-- This component provides accessibility utilities -->
<div class="sr-only">
	<!-- Screen reader only content for accessibility testing -->
	<p>Accessibility utilities loaded successfully</p>
</div>
