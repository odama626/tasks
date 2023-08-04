import { db, pb } from '$lib/storage';
import { getYdoc } from '$lib/utils';

export const ssr = false;

export async function load({ params }) {
	const [doc, project] = await Promise.all([
		db.docs.get(params.doc),
		db.projects.get(params.project)
	]);

	let content = !doc?.ydoc;
	let ydoc = getYdoc(doc);

	return {
		doc,
		project,
		content,
		ydoc,
		projectId: params.project,
		docId: params.doc
	};
}
