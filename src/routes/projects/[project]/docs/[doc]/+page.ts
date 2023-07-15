import { db, pb } from '$lib/storage';
import { set } from 'lodash-es';

export const ssr = false;

const initialContent = [
	{
		type: 'heading',
		attrs: {
			level: 1
		},
		content: [
			{
				type: 'text',
				text: 'Untitled Document'
			}
		]
	},
	{
		type: 'paragraph'
	}
];

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
				console.log(block.file, properties?.attrs?.file);
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
		content: content.length ? content : initialContent
	};

	return doc;
}

export async function load({ params }) {
	const [doc, project, content] = await Promise.all([
		db.docs.get(params.doc),
		db.projects.get(params.project),
		rebuildDoc(params.doc)
	]);
	return {
		doc,
		project,
		content,
		projectId: params.project,
		docId: params.doc
	};
}
