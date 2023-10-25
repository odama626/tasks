import { pick } from 'lodash-es';
import { nanoid } from 'nanoid';
import { writable } from 'svelte/store';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import type { YXmlElement } from 'yjs/dist/src/internals';
import type { DocsResponse } from './db.types';
import { db, type DocsInstance } from './storage';

export const collectFormData = (callback) => (e) => {
	console.log({ e });
	const data = new FormData(e.target);
	const record = Object.fromEntries(data.entries());
	for (const field in record) {
		// filter out empty file inputs to prevent overwriting files with untouched inputs
		if (record[field] instanceof Blob && record[field].size === 0) delete record[field];
	}
	return callback(record, e);
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

export function prepareLocalPayload(record: any) {
	for (const field in record) {
		let payload = record[field];
		if (payload instanceof Blob) {
			delete record[`cache_${field}`];
		}
	}
	return record;
}
export function prepareRecordFormData(record: any) {
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

export function getAttachmentUrl(record: any, field: string) {
	console.log({ record });
	if (!record) return;
	if (record[`cache_${field}`]) return record[`cache_${field}`];
	if (record[field] instanceof Blob) return URL.createObjectURL(record[field]);
}

export function sanitizeFilename(rawName: string) {
	const stripped = decodeURIComponent(rawName);
	let sanitized = stripped
		.toLowerCase()
		.trim()
		.replace(/[\#\!\<\>\/\\\:\"\'\=\|\`\+\$\%\^\{\}\s\?\!\@\*\&\.]+/g, '-');
	while (sanitized.startsWith('-')) sanitized = sanitized.slice(1);
	return sanitized;
}

export async function rehydrateAttachments(ydoc: Y.Doc, docId: string) {
	const attachments = await db.doc_attachments.where({ doc: docId }).toArray();
	const attachmentsById = attachments.reduce((result, attachment) => {
		result[attachment.id] = attachment;
		return result;
	}, {});

	const fragment = ydoc.getXmlFragment('doc');

	for (const file of fragment.createTreeWalker(
		(yxml) => yxml.nodeName === 'image' || yxml.nodeName === 'file'
	)) {
		const key = file.nodeName === 'image' ? 'src' : 'file';
		if (!file.getAttribute(key)?.startsWith('blob')) continue;

		const attachmentId = file.getAttribute('docAttachment');
		const attachment = attachmentsById[attachmentId];
		let url;
		if (attachment.file instanceof File) {
			url = URL.createObjectURL(attachment.file);
		} else if (attachment.cache_file) {
			url = attachment.cache_file;
		}
		file.setAttribute(key, url);
	}
}

export async function getYdoc(doc: DocsInstance, field = 'ydoc') {
	const ydoc = new Y.Doc();
	let arrayBuffer: ArrayBuffer;

	if (doc?.[field] instanceof File) {
		arrayBuffer = await doc[field].arrayBuffer();
	} else if (doc?.cache_ydoc) {
		arrayBuffer = await fetch(doc?.[`cache_${field}`]).then((r) => r.arrayBuffer());
	}

	if (arrayBuffer) {
		Y.applyUpdate(ydoc, new Uint8Array(arrayBuffer));
		rehydrateAttachments(ydoc, doc.id);
	}

	if (doc) {
		const metadata = ydoc.getMap('metadata');
		if (!metadata.has('docId')) metadata.set('docId', doc.id);
		if (!metadata.has('projectId')) metadata.set('projectId', doc.project);
	}
	return ydoc;
}

type InviteLinkArgs = { id: string; secret: string };

export async function getInviteLink(invite: InviteLinkArgs) {
	const hash = await getHash(pick(invite, ['id', 'secret']));
	return `${location.host}/invite/${invite.id}?hash=${hash}`;
}

export async function copyInviteToClipboard(invite: InviteLinkArgs) {
	navigator.clipboard.writeText(await getInviteLink(invite));
	notify({ text: `Invite copied to clipboard` });
}

export function getDocSyncRoom(doc: DocsResponse) {
	return `${location.host}/project/${doc?.project}/doc/${doc?.id}`;
}

export function getDocProvider(doc: DocsResponse, ydoc: Y.Doc) {
	return new WebrtcProvider(getDocSyncRoom(doc), ydoc, {
		signaling: ['wss://signals.tasks.lilbyte.dev']
	});
}

export async function getHash(input) {
	const message = typeof input === 'string' ? input : JSON.stringify(input);
	const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
	return hashHex;
}

interface CookieOpts {
	path?: string;
}

export class Cookie {
	static set<T>(name: string, content: T, opts: CookieOpts = {}) {
		const { path = '/' } = opts;
		const serializedValue = JSON.stringify(content);
		document.cookie = `${name}=${serializedValue};SameSite=Strict;path=${path}`;
	}
}

export interface TiptapNode<T> {
	type: T;
	content: TiptapNode<any>[];
	marks: unknown[];
	attrs: {
		id: string;
		[key: string]: unknown;
	};
}

export function serializeXmlToJson<T>(item: YXmlElement): TiptapNode<T> {
	/**
	 * @type {Object} NodeObject
	 * @property {string} NodeObject.type
	 * @property {Record<string, string>=} NodeObject.attrs
	 * @property {Array<NodeObject>=} NodeObject.content
	 */
	let response;

	// TODO: Must be a better way to detect text nodes than this
	if (!item.nodeName) {
		const delta = item.toDelta();
		response = delta.map((d) => {
			const text = {
				type: 'text',
				text: d.insert
			};

			if (d.attributes) {
				text.marks = Object.keys(d.attributes).map((type) => {
					const attrs = d.attributes[type];
					const mark = {
						type
					};

					if (Object.keys(attrs)) {
						mark.attrs = attrs;
					}

					return mark;
				});
			}
			return text;
		});
	} else {
		response = {
			type: item.nodeName
		};

		const attrs = item.getAttributes();
		if (Object.keys(attrs).length) {
			response.attrs = attrs;
		}

		const children = item.toArray();
		if (children.length) {
			response.content = children.map(serializeXmlToJson).flat();
		}
	}

	return response;
}
