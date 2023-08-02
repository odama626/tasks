import { Collections } from '$lib/db.types';
import { EventType, events } from '$lib/modelEvent';
import { RecordAccess, db, userStore } from '$lib/storage';
import { createId, notify } from '$lib/utils';
import type { JSONContent } from '@tiptap/core';
import { get } from 'svelte/store';
import * as Y from 'yjs';


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
	const existingIds = new Set();

	for (const element of ydocContent.createTreeWalker(() => true)) {
		const id = element.getAttribute('id');
		if (!id || existingIds.has(id)) {
			const newId = createId();
			existingIds.add(newId);
			element.setAttribute('id', newId);
		}
		if (element.nodeName === 'taskItem') {
			element.setAttribute('project', projectId);
			element.setAttribute('doc', docId);
		}
	}

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

	notify({ text: `Saved "${title}"` });

	return id;
}
