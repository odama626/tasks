export let ssr = false;

export async function load({ url, params }) {
	return {
		projectId: params.project
	};
}
