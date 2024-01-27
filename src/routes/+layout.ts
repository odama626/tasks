import type { PageLoad } from './$types';
import '$lib/styles.scss';
import { redirect } from '@sveltejs/kit';
import { userStore } from '$lib/storage';
import { createRedirect } from './user/utils';

export let ssr = false;

const unauthenticatedRoutes = ['/', '/user', '/invite/[invite]'];

export const load = ((args) => {
	const auth = JSON.parse(globalThis?.localStorage?.getItem('auth') ?? 'null');

	if (!auth && !unauthenticatedRoutes.includes(args.route.id)) {
		createRedirect(args.url);
		return redirect(307, '/user');
	}
	userStore.set(auth);
	return {
		auth
	};
}) satisfies PageLoad;
