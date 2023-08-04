import { Collections } from '$lib/db.types';
import { events } from '$lib/modelEvent';
import { RecordAccess, db, userStore } from '$lib/storage';
import { createId, getYdoc, notify } from '$lib/utils';
import { get } from 'svelte/store';
import * as Y from 'yjs';

export async function createDocument(projectId: string) {
	const id = createId();
	const ydoc = new Y.Doc();

	// attach metadata
	const metadata = ydoc.getMap('metadata');
	metadata.set('docId', id);
	metadata.set('projectId', projectId);

	const ydocFile = new File([Y.encodeStateAsUpdate(ydoc)], title + '.ydoc', {
		type: 'application/ydoc'
	});

	events.create(Collections.Docs, {
		title: 'Untitled Document',
		createdBy: get(userStore).record.id,
		project: data.projectId,
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

export async function saveDocument(docId: string, ydoc: Y.Doc) {
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
			element.setAttribute('doc', docId);
		}
	}

	// attach metadata
	const ydocFile = new File([Y.encodeStateAsUpdate(ydoc)], title + '.ydoc', {
		type: 'application/ydoc'
	});

	events.update(Collections.Docs, docId, {
		ydoc: ydocFile,
		title
	});

	const attachments = await db.doc_attachments.where({ doc: docId }).toArray();
	const referencedAttachments = new Set<string>();
	const fragment = ydoc.getXmlFragment('doc');
	for (const image of fragment.createTreeWalker((yxml) => yxml.nodeName === 'image')) {
		const id = image.getAttribute('docAttachment');
		referencedAttachments.add(id);
	}
	attachments.forEach((attachment) => {
		if (referencedAttachments.has(attachment.id)) return;
		events.delete(Collections.DocAttachments, attachment.id, { file: null });
	});

	notify({ text: `Saved "${title}"` });

	return docId;
}
