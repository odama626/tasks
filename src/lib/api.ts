import wretch from 'wretch';
import { userStore, type ModelCreateEvent, type ModelUpdateEvent } from './storage';
import { get } from 'svelte/store';

const api = wretch(import.meta.env.VITE_SERVER_URL);

function getUserId(user) {
	return `${import.meta.env.VITE_SERVER_URL}/ap/users/${user.username}`;
}

export function createActivity<T>(record: { id: string } & ModelCreateEvent<T>) {
	const user = get(userStore);
	console.log({ user });
	api.post('/');
}

export function updateActivity<T>(record: { id: string } & ModelUpdateEvent<T>) {
	const user = get(userStore)?.record;
	console.log({ user, record });

	api.url(`/ap/users/${user.username}/outbox`).post({
		'@context': ['https://www.w3.org/ns/activitystreams'],
		type: 'Update',
		actor: getUserId(user),
    object: {
      id: record.recordId,
      ...record.payload,
    }
	});
}
