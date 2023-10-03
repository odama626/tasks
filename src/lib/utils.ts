import { nanoid } from 'nanoid';
import { writable } from 'svelte/store';
import * as Y from 'yjs';
import { db, type DocsInstance } from './storage';
import type { DocAttachmentsResponse, DocsResponse, InvitesResponse } from './db.types';
import type { YXmlElement } from 'yjs/dist/src/internals';
import { WebrtcProvider } from 'y-webrtc';
import { pick } from 'lodash-es';

export const collectFormData = (callback) => (e) => {
	console.log({ e })
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

export async function getYdoc(doc: DocsInstance) {
	const ydoc = new Y.Doc();
	let arrayBuffer: ArrayBuffer;

	if (doc?.ydoc instanceof File) {
		arrayBuffer = await doc.ydoc.arrayBuffer();
	} else if (doc?.cache_ydoc) {
		arrayBuffer = await fetch(doc?.cache_ydoc).then((r) => r.arrayBuffer());
	}

	if (arrayBuffer) {
		Y.applyUpdate(ydoc, new Uint8Array(arrayBuffer));
		rehydrateImages(ydoc, doc.id);
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
		let serializedValue = JSON.stringify(content);
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
