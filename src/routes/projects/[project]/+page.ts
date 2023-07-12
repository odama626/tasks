import { db } from '$lib/storage';

export let ssr = false;

export async function load({ url, params }) {
	const project = await db.projects.get(params.project);
	return {
		project,
		projectId: params.project
	};
}
