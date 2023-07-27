import { db, pb } from '$lib/storage';
import { set } from 'lodash-es';

export const ssr = false;

async function rebuildDoc(docId: string) {
	const blocks = await db.doc_blocks.where({ doc: docId }).toArray();
	blocks.sort((a, b) => a.path.length - b.path.length);
	const content = [];

	const fileToken = await pb.files.getToken();

	blocks.forEach((block) => {
		const { properties, type, id } = block;

		const file = block?.file ?? properties?.attrs?.file;
		if (type === 'image' && file) {
			try {
				const src = block?.file
					? pb.files.getUrl(block, block.file, { token: fileToken })
					: URL.createObjectURL(file);
				properties.attrs.src = src;
			} catch (e) {
				console.error(`failed to rebind image`, e);
			}
		}
		set(content, block.path.split('.').join('.content.'), properties);
	});

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
		if (doc?.ydoc) {
			console.log(doc?.ydoc);
			const token = await pb.files.getToken();
			const url = pb.files.getUrl(doc, doc.ydoc, { token });
			const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer());
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
