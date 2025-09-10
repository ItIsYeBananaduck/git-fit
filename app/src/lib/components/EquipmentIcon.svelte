<script lang="ts">
	export let type: string;
	export let size: string = "24";
	export let className: string = "";

	function getIconSVG(iconType: string): string {
		switch (iconType.toLowerCase()) {
			case 'weights':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
				</svg>`;
			case 'body':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M12 5.5A3.5 3.5 0 0 1 15.5 2A3.5 3.5 0 0 1 19 5.5a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 12 5.5M5 12c0 .64.09 1.26.26 1.86l2.74-1.54l.91 1.58l-2.73 1.54A7 7 0 0 0 12 19a7 7 0 0 0 5.82-3.56l-2.73-1.54l.91-1.58l2.74 1.54A7.01 7.01 0 0 0 19 12a7 7 0 0 0-7-7a7 7 0 0 0-7 7z"/>
				</svg>`;
			case 'functional':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
				</svg>`;
			case 'machine':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 2.18L9.86 7.82l-4.42.64 3.2 3.12-.76 4.4L12 14.44l4.12 1.54-.76-4.4 3.2-3.12-4.42-.64L12 4.18z"/>
				</svg>`;
			case 'cardio':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
				</svg>`;
			case 'barbell':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M2 10v4h2v-4h2V8H4V6h2v2h12V6h2v2h-2v2h2v4h-2v-4h-2v4H6v-4H4z"/>
				</svg>`;
			case 'dumbbell':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
				</svg>`;
			case 'cable':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M4 15.5C4 17.43 5.57 19 7.5 19L16.5 19C18.43 19 20 17.43 20 15.5C20 13.57 18.43 12 16.5 12L7.5 12C5.57 12 4 13.57 4 15.5ZM7.5 14L16.5 14C17.33 14 18 14.67 18 15.5C18 16.33 17.33 17 16.5 17L7.5 17C6.67 17 6 16.33 6 15.5C6 14.67 6.67 14 7.5 14Z"/>
				</svg>`;
			case 'band':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2M7 7h10v10H7V7z"/>
				</svg>`;
			case 'ball':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8z"/>
				</svg>`;
			case 'pullup':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M4 2h16v2H4V2m0 18h16v2H4v-2m8-16l4 4h-2v8h-4V8H8l4-4z"/>
				</svg>`;
			case 'treadmill':
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
				</svg>`;
			default:
				return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" class="${className}">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
				</svg>`;
		}
	}
</script>

{@html getIconSVG(type)}