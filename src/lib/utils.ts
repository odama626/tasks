import type { ZodError } from 'zod';
import { nanoid } from 'nanoid';
import { writable } from 'svelte/store';

export const collectFormData = (callback) => (e) => {
	const data = new FormData(e.target);
	return callback(Object.fromEntries(data.entries()), e);
};

export function convertPbErrorToZod(result) {
	if (result.response.code !== 400) throw result;
	const { data } = result.response;
	return {
		success: false,
		error: {
			issues: Object.entries(data).map(([name, error]) => {
				return {
					path: [name],
					...error
				};
			})
		}
	};
}

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
