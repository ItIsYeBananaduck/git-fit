import { redirect } from '@sveltejs/kit';

export async function load() {
	// All workout functionality should go through Alice on the home page
	// Redirect to home where Alice handles workout interactions
	throw redirect(302, '/?mode=workout');
}