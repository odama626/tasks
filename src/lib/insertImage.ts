import { get } from 'svelte/store';
import { Collections } from './db.types';
import { events } from './modelEvent';
import { userStore, pb } from './storage';
import { createId } from './utils';

export async function insertImage(file: File, metadata, view, pos) {
	const image = new Image();
	image.src = URL.createObjectURL(file);

	await new Promise((resolve) => (image.onload = resolve));

	const attachmentId = createId();
	events.create(Collections.DocAttachments, {
		id: attachmentId,
		createdBy: metadata.userId,
		file,
		doc: metadata.docId
	});

	const { schema } = view.state;
	const node = schema.nodes.image.create({
		src: image.src,
		docAttachment: attachmentId
	}); // creates the image element

	const originalTransaction = view.state.tr.insert(pos, node); // places it in the correct position
	view.dispatch(originalTransaction);
	const offset = originalTransaction.steps.reduce(
		(offset, step) => offset + step.to - step.from,
		0
	);
	const waitForUpdate = new Promise<number>(async (resolve) =>
		pb.collection('doc_attachments').subscribe(attachmentId, async (data) => {
			const token = await pb.files.getToken();
			const src = pb.getFileUrl(data.record, data.record.file, { token });
			const image = new Image();
			image.src = src;

			await new Promise((resolve) => (image.onload = resolve));

			const transaction = view.state.tr.setNodeAttribute(pos + offset, 'src', src);
			view.dispatch(transaction);
			pb.collection('doc_attachments').unsubscribe(attachmentId);
			resolve(offset);
		})
	);


	return offset
}
