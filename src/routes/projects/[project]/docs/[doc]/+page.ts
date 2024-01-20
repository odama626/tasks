import { db, pb } from '$lib/storage';
import { getYdoc } from '$lib/utils';

export const ssr = false;

export async function load({ params }) {
	const [doc, project] = await Promise.all([
		db.docs.get(params.doc),
		db.projects.get(params.project)
	]);

	const content = !doc?.ydoc;
	const token = await pb.files.getToken().catch(() => null);
	const ydoc = getYdoc(doc, undefined, token);

	return {
		doc,
		project,
		content,
		ydoc,
		token,
		projectId: params.project,
		docId: params.doc
	};
}
