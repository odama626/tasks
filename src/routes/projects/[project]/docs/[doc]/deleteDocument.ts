import { Collections, type DocsResponse } from '$lib/db.types';
import { events } from '$lib/modelEvent';
import { db } from '$lib/storage';
import { notify } from '$lib/utils';

export async function deleteDocument(doc: DocsResponse) {
	const attachments = await db.doc_attachments.where({ doc: doc.id }).toArray();

	if (!doc) throw new Error('Document not found');

	attachments.forEach((attachment) => {
		events.delete(Collections.DocAttachments, attachment.id, { file: null });
	});

	events.delete(Collections.Docs, doc.id, { ydoc: null });
	notify({ text: `Deleted "${doc.title}"` });
}
