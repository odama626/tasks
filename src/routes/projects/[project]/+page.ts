export function load({ url, params }) {
	console.log({ params });

	return {
		projectId: params.project
	};
}
