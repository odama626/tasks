import { db, pb } from '$lib/storage';
import { getYdoc } from '$lib/utils';

export const ssr = false;

async function rebuildDoc(docId: string) {
	const blocks = await db.doc_blocks.where({ doc: docId }).toArray();
	blocks.sort((a, b) => a.path.length - b.path.length);
	const content = [];

	const doc = {
		type: 'doc',
		content: content.length ? content : []
	};

	return doc;
}

export async function load({ params }) {
	const [doc, project] = await Promise.all([
		db.docs.get(params.doc),
		db.projects.get(params.project)
	]);

	let content = !doc?.ydoc && (await rebuildDoc(params.doc));
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
