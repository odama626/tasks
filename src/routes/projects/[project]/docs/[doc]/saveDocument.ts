import { Collections, type DocsResponse } from '$lib/db.types';
import { EventType, events } from '$lib/modelEvent';
import { RecordAccess, db, userStore } from '$lib/storage';
import { createId, notify } from '$lib/utils';
import type { JSONContent } from '@tiptap/core';
import { set } from 'lodash-es';
import { get } from 'svelte/store';
import * as Y from 'yjs';

interface Block {
	type: string;
	properties: unknown;
	content?: Block[];
}

interface ProcessBlockOptions {
	path: string;
	parent?: string;
	doc: string;
	project: string;
	usedIds: Set<string>;
}

async function processBlock(block: Block, options: ProcessBlockOptions): Promise<string[]> {
	const { path, parent, doc, project, usedIds } = options;
	const isNew = !(block.attrs?.id && !usedIds.has(block.attrs?.id));
	const id = isNew ? createId() : block.attrs.id;
	const eventType = isNew ? EventType.Add : EventType.Update;
	set(block, 'attrs.id', id);
	set(block, 'attrs.project', options.project);
	set(block, 'attrs.doc', options.doc);
	usedIds.add(id);
	let ids: string[] = [];

	const { content: _, ...properties } = block;

	if (!block.type) throw block;

	const payload = {
		id,
		type: block.type,
		properties,
		path,
		doc,
		parent,
		project,
		file: properties?.attrs?.file
	};

	delete properties?.attrs?.file;

	await events.add({
		eventType,
		recordId: id,
		modelType: Collections.DocBlocks,
		payload
	});

	if (block.content) {
		ids = await Promise.all(
			block.content.map((innerBlock, index) =>
				processBlock(innerBlock, { ...options, parent: id, path: `${path}.${index}` })
			)
		);
	}
	ids.unshift(id);
	return ids;
}

export async function saveDocument(
	title: string,
	docId: string,
	ydoc: Y.Doc,
	projectId: string,
	editorContent: JSONContent
) {
	if (!editorContent.content) throw new Error('Cannot save an empty document');
	const isNew = docId === 'new';
	const id = isNew ? createId() : docId;
	const user = get(userStore).record;

	// const title = getText(editorContent);

	const ydocContent = ydoc.getXmlFragment('doc');

	console.log(ydocContent.toDOM());
	console.log(ydoc.getMap());

	const ydocFile = new File([Y.encodeStateAsUpdate(ydoc)], title + '.ydoc', {
		type: 'application/ydoc'
	});

	const record = {
		eventType: isNew ? EventType.Add : EventType.Update,
		modelType: Collections.Docs,
		recordId: id,
		payload: {
			title,
			createdBy: user.id,
			project: projectId,
			id,
			ydoc: ydocFile
		}
	};

	await events.add(record);

	if (isNew) {
		const docsUsersId = createId();
		await events.add({
			eventType: EventType.Add,
			modelType: Collections.DocsUsers,
			payload: {
				id: docsUsersId,
				user: user.id,
				doc: id,
				access: RecordAccess.Admin
			}
		});
	}

	if (ydoc) {
		const attachments = await db.doc_attachments.where({ doc: docId }).toArray();
		const referencedAttachments = {};
		const fragment = ydoc.getXmlFragment('doc');
		for (const image of fragment.createTreeWalker((yxml) => yxml.nodeName === 'image')) {
			const id = image.getAttribute('docAttachment');
			referencedAttachments[id] = true;
		}
		attachments.forEach((attachment) => {
			if (referencedAttachments[attachment.id]) return;
			events.delete(Collections.DocAttachments, attachment.id, { file: null });
		});
		// return notify({ text: `Saved "${title}"` });
	}

	const usedIds = new Set();

	const blockIds: string[][] = await Promise.all(
		editorContent.content.map((block, index) =>
			processBlock(block, { path: `${index}`, doc: id, project: projectId, usedIds })
		)
	);

	const ids: Record<string, boolean> = blockIds.flat(Infinity).reduce((result, next) => {
		result[next] = true;
		return result;
	}, {});

	const staleRecords = (await db.doc_blocks.where({ doc: docId }).toArray())
		.filter((block: DocsResponse) => !ids[block.id])
		.map((block) => block.id);

	// db.doc_blocks.where({ id: staleRecords }).delete();

	await Promise.all(
		staleRecords.map((recordId) =>
			events.add({
				eventType: EventType.Delete,
				modelType: Collections.DocBlocks,
				recordId
			})
		)
	);

	notify({ text: `Saved "${title}"` });

	return id;

	// TODO text nodes can't have attributes

	// TODO if there is a tiptap plugin that generates ids, most of them should match so we can collect the ids and diff them with the current records
	// to know what to delete vs what to update or add, verify that the ids don't change in update
}
