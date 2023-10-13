import { Collections } from './db.types';
import { events } from './modelEvent';
import { pb } from './storage';
import { createId } from './utils';

interface Metadata {
	docId: string;
	userId: string;
}

async function loadImage(url: string) {
	const image = new Image();
	image.src = url;
	await new Promise((resolve) => (image.onload = resolve));
	return image;
}

export async function insertFile(file: File, metadata: Metadata, view, pos) {
	console.log('insert file');
	const url = URL.createObjectURL(file);
	const isImage = file.type.startsWith('image/');
	let objectUrl: string;

	const attachmentId = createId();
	events.create(Collections.DocAttachments, {
		id: attachmentId,
		createdBy: metadata.userId,
		file,
		name: file.name,
		type: file.type,
		size: file.size,
		doc: metadata.docId
	});

	if (isImage) {
		objectUrl = URL.createObjectURL(file);
		await loadImage(objectUrl);
	}

	const { schema } = view.state;
	const node = schema.nodes[isImage ? 'image' : 'file'].create({
		src: url,
		url,
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
			const url = pb.getFileUrl(data.record, data.record.file, { token });
			if (isImage) await loadImage(url);
			if (objectUrl) URL.revokeObjectURL(objectUrl);

			const transaction = view.state.tr.setNodeAttribute(
				pos + offset,
				isImage ? 'src' : 'url',
				url
			);
			view.dispatch(transaction);
			pb.collection('doc_attachments').unsubscribe(attachmentId);
			resolve(offset);
		})
	);

	return offset;
}
