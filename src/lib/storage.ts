import Dexie from 'dexie';
import PocketBase from 'pocketbase';
import { get, writable } from 'svelte/store';

export const db = new Dexie('todo-db');
export const pb = new PocketBase(import.meta.env.VITE_SERVER_URL);

db.version(1).stores({
	lists: '&id, name, description',
	tasks: '&id, list, title, body, completed, createdBy',
	lists_users: '&id, user, list, access',
	events: '++id, eventType, modelType, payload'
});

db.version(2).stores({
	users: '&id, username, email, lastVisitedList',
})

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

