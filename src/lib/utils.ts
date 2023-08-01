import { nanoid } from 'nanoid';
import { writable } from 'svelte/store';
import type * as Y from 'yjs';
import { db } from './storage';
import type { DocAttachmentsResponse } from './db.types';

export const collectFormData = (callback) => (e) => {
	const data = new FormData(e.target);
	return callback(Object.fromEntries(data.entries()), e);
};

export function convertPbErrorToZod(result) {
	if (result.response.code !== 400) throw result;
	const { data } = result.response;
	const overalMessage = result.response.message;
	return {
		success: false,
		error: {
			overalMessage,
			issues: Object.entries(data).map(([name, error]) => {
				return {
					path: [name],
					...error
				};
			})
		}
	};
}

export const attachRecordToError = (message: string, record) => (e) => {
	throw new Error(`${message}\n${JSON.stringify(record, null, 2)}`, { cause: e });
};

export function createId() {
	return nanoid(15);
}

export function withKeys(keyCodes: string | string[], callback: (event: KeyboardEvent) => unknown) {
	const keys = Array.isArray(keyCodes) ? keyCodes : [keyCodes];
	return (event: KeyboardEvent) => {
		if (keys.includes(event.code)) callback(event);
	};
}

export enum NotificationType {
	Info = 'info',
	Accent = 'accent',
	Error = 'error'
}

interface Notification {
	id: string;
	text?: string;
	detail?: string;
	type?: NotificationType;
	timeout: number | null;
}

export const notificationStore = writable<Notification[]>([]);

export function notify(notification: Partial<Notification>) {
	const id = createId();
	const record = { timeout: 2500, type: NotificationType.Info, ...notification, id };

	console.log({ record });

	if (record.timeout) setTimeout(() => notify.dismiss(id), record.timeout);

	notificationStore.update((notifications) => {
		notifications.push(record);
		return notifications;
	});

	return {
		dismiss() {
			notify.dismiss(id);
		}
	};
}

notify.dismiss = function (id: string) {
	notificationStore.update((notifications) => notifications.filter((n) => n.id !== id));
};

export function prepareRecordFormData(record) {
	const formData = new FormData();
	for (const field in record) {
		let payload = record[field];
		if (payload === undefined) continue;
		if (Array.isArray(payload)) {
			for (const item of payload) {
				formData.append(field, item);
			}
			continue;
		}
		if (typeof payload === 'object' && !(payload instanceof Blob))
			payload = JSON.stringify(payload);

		formData.append(field, payload);
	}
	return formData;
}

export async function rehydrateImages(ydoc: Y.Doc, docId: string) {
	const attachments = await db.doc_attachments.where({ doc: docId }).toArray();

	const fragment = ydoc.getXmlFragment('doc');

	for (const image of fragment.createTreeWalker((yxml) => yxml.nodeName === 'image')) {
		if (!image.getAttribute('src').startsWith('blob')) continue;

		const attachmentId = image.getAttribute('docAttachment');
		const attachment = attachments.find(
			(attachment: DocAttachmentsResponse) => attachment.id === attachmentId
		);
		let src;
		if (attachment.file instanceof File) {
			src = URL.createObjectURL(attachment.file);
		} else if (attachment.cache_file) {
			src = attachment.cache_file;
		}
		image.setAttribute('src', src);
	}
}
