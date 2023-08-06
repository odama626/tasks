import type { PageLoad } from './$types';
import '$lib/styles.scss';
import { redirect } from '@sveltejs/kit';
import { userStore } from '$lib/storage';

export let ssr = false;

const unauthenticatedRoutes = ['/', '/user', '/invite/[invite]'];

export const load = (async (args) => {
	const auth = JSON.parse(globalThis?.localStorage?.getItem('auth') ?? 'null');

	if (!auth && !unauthenticatedRoutes.includes(args.route.id)) {
		globalThis?.localStorage?.setItem('login-redirect', args.url.pathname);
		throw redirect(307, '/user');
	}
	userStore.set(auth);
	return {
		auth
	};
}) satisfies PageLoad;
