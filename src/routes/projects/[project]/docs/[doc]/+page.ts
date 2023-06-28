import { db } from '$lib/storage';
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
	blocks.sort((a, b) => a.path.length - b.path.length)
	const content = [];

	blocks.forEach((block) => {
		const { properties, type, id } = block;
		set(content, block.path, properties);
	});

	const doc = {
		type: 'doc',
		content: content.length ? content : initialContent
	};

	console.log(blocks);
	return doc;
}

export async function load({ params }) {
	return {
		doc: await rebuildDoc(params.doc),
		projectId: params.project,
		docId: params.doc
	};
}
