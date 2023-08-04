import Dexie from 'dexie';
import PocketBase from 'pocketbase';
import { get, writable } from 'svelte/store';
import type { DocAttachmentsResponse, DocsResponse } from './db.types';

export const db = new Dexie('todo-db');
export const pb = new PocketBase(import.meta.env.VITE_SERVER_URL);

db.version(1).stores({
	lists: '&id, name, description',
	tasks: '&id, list, title, body, completed, createdBy',
	lists_users: '&id, user, list, access',
	events: '++id, eventType, modelType, payload'
});

db.version(2).stores({
	users: '&id, username, email, lastVisitedList'
});

db.version(3).stores({
	projects: '&id, name, creator',
	docs: '&id, title, createdBy, project',
	doc_blocks: '&id, type, attrs, order, doc, parent, project',
	projects_users: '&id, user, project, access',
	docs_users: '&id, user, doc, access'
});

db.version(4).stores({
	doc_blocks: '&id, type, attrs, doc, parent, [project+path]'
});

db.version(5).stores({
	doc_blocks: '&id, type, attrs, doc, parent, project, path'
});

db.version(6).stores({
	doc_blocks: '&id, attrs, doc, parent, [type+project], path'
});

db.version(7).stores({
	doc_attachments: '&id, file, doc, createdBy'
});

db.version(8).stores({
	dock_blocks: null
});

export enum RecordAccess {
	Admin = 'admin',
	Editor = 'editor',
	Viewer = 'viewer'
}

export interface DocsInstance extends DocsResponse {
	cache_ydoc: string;
}

export interface DocAttachmentsInstance extends DocAttachmentsResponse {
	cache_file: string;
}

export interface CollectionInstances {
	DocsInstance: DocsInstance;
	DocAttachmentsInstance: DocAttachmentsInstance;
}

export function storable<T>(data: T, name: string) {
	const store = writable(data);
	const { subscribe, set, update } = store;
	const isBrowser = typeof window !== 'undefined';

	if (isBrowser) {
		if (localStorage.getItem(name)) {
			set(JSON.parse(localStorage.getItem(name) ?? ''));
		} else {
			localStorage.setItem(name, JSON.stringify(data));
		}
	}

	return {
		subscribe,
		set: (n: T) => {
			set(n);
			localStorage.setItem(name, JSON.stringify(n));
		},
		update: (cb: (value: T) => T) => {
			const result = update(cb);
			localStorage.setItem(name, JSON.stringify(result));
			return result;
		}
	};
}

export const userStore = storable(null, 'auth');
export const currentProject = storable(null, 'current-project');
