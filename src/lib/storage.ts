import Dexie from 'dexie';
import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import type {
	CollectionResponses,
	Collections,
	DocAttachmentsResponse,
	DocHierarchysResponse,
	DocsResponse,
	DocsUsersResponse,
	InvitesResponse,
	ProjectsResponse,
	ProjectsUsersResponse,
	UsersConnectionsResponse,
	UsersResponse
} from './db.types';
import { Cookie } from './utils';

export type Expand<T> = T extends (...args: infer A) => infer R
	? (...args: Expand<A>) => Expand<R>
	: T extends infer O
		? { [K in keyof O]: O[K] }
		: never;

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
	? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
	: T extends object
		? T extends infer O
			? { [K in keyof O]: ExpandRecursively<O[K]> }
			: never
		: T;

export enum EventType {
	Add = 'add',
	Update = 'update',
	Delete = 'delete'
}

export type ValueOf<T> = T[keyof T];

export interface BaseModelEvent {
	eventType: EventType;
	modelType: Collections;
}

export interface ModelCreateEvent<T> extends BaseModelEvent {
	eventType: EventType.Add;
	payload: T;
}

export interface ModelUpdateEvent<T> extends BaseModelEvent {
	eventType: EventType.Update;
	payload: Partial<T>;
	recordId: string;
}

export interface ModelDeleteEvent<T> extends BaseModelEvent {
	eventType: EventType.Delete;
	recordId: string;
	payload?: Partial<T>;
}

export interface LinkMetadata {
	id: string;
	href: string;
	title: string;
	description: string;
	imageUrl: string;
}

export type ModelEvent<T> = ModelCreateEvent<T> | ModelUpdateEvent<T> | ModelDeleteEvent<T>;

class Database extends Dexie {
	users!: Dexie.Table<UsersResponse, string>;
	projects!: Dexie.Table<ProjectsResponse, string>;
	docs!: Dexie.Table<DocsResponse, string>;
	doc_attachments!: Dexie.Table<DocAttachmentsResponse, string>;
	docs_users!: Dexie.Table<DocsUsersResponse, string>;
	projects_users!: Dexie.Table<ProjectsUsersResponse, string>;
	doc_hierarchys!: Dexie.Table<DocHierarchysResponse, string>;
	invites!: Dexie.Table<InvitesResponse, string>;
	users_connections!: Dexie.Table<UsersConnectionsResponse, string>;
	events!: Dexie.Table<{ id: string } & ModelEvent<ValueOf<CollectionResponses>>, string>;
	link_metadata!: Dexie.Table<LinkMetadata, string>;

	constructor() {
		super('todo-db');
	}
}

export const db = new Database();
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

db.version(9).stores({
	lists: null,
	lists_users: null
});
db.version(10).stores({
	users: '&id, username, email'
});

db.version(11).stores({
	invites: `&id, project, doc, invited_by, access`
});

db.version(12).stores({
	link_metadata: `&href`
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
		if (globalThis.localStorage.getItem(name)) {
			set(JSON.parse(globalThis.localStorage.getItem(name) ?? ''));
		} else {
			globalThis.localStorage.setItem(name, JSON.stringify(data));
		}
	}

	return {
		subscribe,
		set: (value: T) => {
			set(value);
			if (isBrowser) {
				const serializedValue = JSON.stringify(value);
				globalThis.localStorage.setItem(name, serializedValue);
				Cookie.set(name, value);
			}
		},
		update: (cb: (value: T) => T) => {
			const result = update(cb);
			if (isBrowser) {
				const value = JSON.stringify(result);
				globalThis.localStorage?.setItem(name, value);
				Cookie.set(name, value);
			}
			return result;
		}
	};
}

export const userStore = storable(null, 'auth');
export const currentProject = storable(null, 'current-project');
