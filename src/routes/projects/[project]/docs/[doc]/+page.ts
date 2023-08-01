import { db, pb } from '$lib/storage';

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
	let ydoc;
	try {
		console.log(doc.ydoc instanceof File);
		if (doc?.ydoc instanceof File) {
			ydoc = new Uint8Array(await doc.ydoc.arrayBuffer());
		} else if (doc?.cache_ydoc) {
			const arrayBuffer = await fetch(doc?.cache_ydoc).then((r) => r.arrayBuffer());
			console.log(arrayBuffer);
			ydoc = new Uint8Array(arrayBuffer);
		}
	} catch (e) {
		console.error(e);
		content = await rebuildDoc(params.doc);
	}

	return {
		doc,
		project,
		content,
		ydoc,
		projectId: params.project,
		docId: params.doc
	};
}
