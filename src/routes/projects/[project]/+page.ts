export let ssr = false;

export function load({ url, params }) {
	return {
		projectId: params.project
	};
}
