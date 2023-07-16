import { goto } from '$app/navigation';
import { Collections, type DocsRecord, type DocsResponse } from '$lib/db.types';
import { EventType, events } from '$lib/modelEvent';
import { RecordAccess, db, userStore } from '$lib/storage';
import { createId, notify } from '$lib/utils';
import type { JSONContent } from '@tiptap/core';
import { get } from 'svelte/store';
import { set } from 'lodash-es';
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

function getText(content): string {
	if (content.type === 'text' && content.text) return content.text;
	if (content.content) return getText(content.content[0]);
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

export async function saveDocument(docId: string, projectId: string, editorContent: JSONContent) {
	if (!editorContent.content) throw new Error('Cannot save an empty document');
	const isNew = docId === 'new';
	const id = isNew ? createId() : docId;

	const title = getText(editorContent);

	const record = {
		eventType: isNew ? EventType.Add : EventType.Update,
		modelType: Collections.Docs,
		recordId: id,
		payload: {
			title,
			createdBy: get(userStore).record.id,
			project: projectId,
			id
		}
	};

	await events.add(record);

	if (isNew) {
		const docsUsersId = createId();
		await events.add({
			eventType: EventType.Add,
			modelType: Collections.DocsUsers,
			recordId: docsUsersId,
			payload: {
				id: docsUsersId,
				user: get(userStore).record.id,
				doc: id,
				access: RecordAccess.Admin
			}
		});
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
