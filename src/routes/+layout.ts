import type { PageLoad } from './$types';
import '$lib/styles.scss';
import { redirect } from '@sveltejs/kit';
import { userStore } from '$lib/storage';

export let ssr = false;

const unauthenticatedRoutes = ['/', '/user'];

export const load = (async (args) => {
	console.log({ globalThis })
	const auth = JSON.parse(localStorage.getItem('auth') ?? 'null');

	if (!auth && !unauthenticatedRoutes.includes(args.url.pathname)) {
		args.setHeaders({ 'Set-Cookie': args.url.pathname });
		throw redirect(307, '/user');
	}
	userStore.set(auth);
	return {
		auth
	};
}) satisfies PageLoad;