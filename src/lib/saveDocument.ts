import { Collections, type DocsResponse } from '$lib/db.types';
import { events } from '$lib/modelEvent';
import { RecordAccess, db, userStore } from '$lib/storage';
import { createId, notify } from '$lib/utils';
import { get } from 'svelte/store';
import * as Y from 'yjs';

export function createDocument(projectId: string) {
	const id = createId();
	const title = 'Untitled Document';
	const ydoc = new Y.Doc();
	const user = get(userStore).record;

	// attach metadata
	const metadata = ydoc.getMap('metadata');
	metadata.set('docId', id);
	metadata.set('projectId', projectId);

	const ydocFile = new File([Y.encodeStateAsUpdate(ydoc)], title + '.ydoc', {
		type: 'application/ydoc'
	});

	events.create(Collections.Docs, {
		title: 'Untitled Document',
		createdBy: user.id,
		project: projectId,
		id,
		ydoc: ydocFile
	});

	events.create(Collections.DocsUsers, {
		id: createId(),
		user: user.id,
		doc: id,
		access: RecordAccess.Admin
	});

	return id;
}

export async function saveDocument(doc: DocsResponse, ydoc: Y.Doc) {
	const user = get(userStore).record;
	const title = ydoc.getText('title').toString();
	const projectId = ydoc.getMap('metadata').get('projectId');

	const ydocContent = ydoc.getXmlFragment('doc');
	const existingIds = new Set();

	// make sure every node has a unique id
	for (const element of ydocContent.createTreeWalker(() => true)) {
		const id = element.getAttribute('id');
		if (!id || existingIds.has(id)) {
			const newId = createId();
			existingIds.add(newId);
			element.setAttribute('id', newId);
		}
		if (element.nodeName === 'taskItem') {
			element.setAttribute('project', projectId);
			element.setAttribute('doc', doc.id);
		}
	}

	// attach metadata
	const ydocFile = new File([Y.encodeStateAsUpdate(ydoc)], title + '.ydoc', {
		type: 'application/ydoc'
	});

	events.update(Collections.Docs, doc.id, {
		ydoc: ydocFile,
		title
	});

	const attachments = await db.doc_attachments.where({ doc: doc.id}).toArray();
	const referencedAttachments = new Set<string>();
	const fragment = ydoc.getXmlFragment('doc');
	for (const file of fragment.createTreeWalker(
		(yxml) => yxml.nodeName === 'image' || yxml.nodeName === 'file'
	)) {
		const id = file.getAttribute('docAttachment');
		referencedAttachments.add(id);
	}
	attachments.forEach((attachment) => {
		if (referencedAttachments.has(attachment.id)) return;
		events.delete(Collections.DocAttachments, attachment.id, { file: null });
	});

	notify({ text: `Saved "${title}"` });

	return doc.id;
}
