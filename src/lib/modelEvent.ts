import type { CollectionRecords, Collections } from './db.types';
import { db, pb } from './storage';
import { DateTime } from 'luxon';

export enum EventType {
	Add = 'add',
	Update = 'update',
	Delete = 'delete'
}

export enum PbEventType {
	Create = 'create',
	Update = 'update',
	Delete = 'delete'
}

interface ModelEvent {
	eventType: EventType;
	modelType: Collections;
}

interface ModelCreateEvent<T> extends ModelEvent {
	eventType: EventType.Add;
	payload: T;
}

interface ModelUpdateEvent<T> extends ModelEvent {
	eventType: EventType.Update;
	payload: Partial<T>;
	recordId: string;
}

interface ModelDeleteEvent extends ModelEvent {
	eventType: EventType.Delete;
	recordId: string;
}

export type ModelEvent<T> = ModelCreateEvent<T> | ModelUpdateEvent<T> | ModelDeleteEvent;

export class ModelEvents {
	private online: boolean = navigator.onLine;
	private processing: boolean = false;
	private queue: Promise<any> = Promise.resolve();

	constructor() {
		window.addEventListener('online', () => {
			this.online = true;
			this.queue = this.queue.then(() => this.step());
		});
		window.addEventListener('offline', () => (this.online = false));
	}

	async add(event: ModelEvent<any>) {
		db.events.add(event);
		if (event.eventType === 'update') {
			await db[event.modelType][event.eventType](event.recordId, event.payload);
		} else if (event.eventType === 'delete') {
			await db[event.modelType][event.eventType](event.recordId);
		} else {
			await db[event.modelType][event.eventType](event.payload);
		}

		console.log(pb.authStore);

		if (this.online) {
			if (!this.processing)
				this.queue = this.queue.then(() => Promise.resolve()).then(() => this.step());
			// TODO send event to pb
		}
	}

	private async syncTable(table: string) {
		const lastSync = localStorage.getItem(`last-sync:${table}`);
		const currentSync = DateTime.now();

		const options = { filter: lastSync ? `updated >= "${lastSync}"` : '' };
		const records = await pb.collection(table).getFullList(options);
		console.log({ records });

		await db[table].bulkPut(records);
		pb.collection(table).subscribe('*', (data) => {
			if (data.action === 'delete') {
				db[table].delete(data.record.id);
			} else {
				db[table].put(data.record);
			}
		});
		localStorage.setItem(
			`last-sync:${table}`,
			currentSync.setZone('utc').toFormat('yyyy-MM-dd HH:mm:s.u')
		);
	}

	async startSync() {
		await this.step();

		await this.syncTable('users');
		await this.syncTable('lists_users');
		await this.syncTable('lists');
		await this.syncTable('tasks');
	}

	private async step() {
		const records = await db.events.offset(0).limit(50).toArray();
		for await (let record of records) {
			if (!this.online) return;
			switch (record.eventType) {
				case EventType.Add:
					await pb.collection(record.modelType).create(record.payload, { $autoCancel: false });
					break;
				case EventType.Update:
					await pb
						.collection(record.modelType)
						.update(record.recordId, record.payload, { $autoCancel: false });
					break;
				case EventType.Delete:
					await pb.collection(record.modelType).delete(record.recordId, { $autoCancel: false });
					break;
				default:
					throw new Error('Unexpected error occured during sync');
			}
			await db.events.where({ id: record.id }).delete();
		}
		if (records.length) return (this.queue = this.step());
		this.processing = false;
	}
}

export const events = new ModelEvents();