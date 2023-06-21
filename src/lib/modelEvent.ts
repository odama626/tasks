import type { CollectionRecords } from './db.types';
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

interface ModelCreateEvent<T> {
	eventType: EventType.Add;
	modelType: string;
	payload: T;
}

interface ModelUpdateEvent<T> {
	eventType: EventType.Update;
	modelType: string;
	payload: Partial<T>;
	recordId: string;
}

interface ModelDeleteEvent {
	eventType: EventType.Delete;
	modelType: keyof CollectionRecords;
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
		} else {
			await db[event.modelType][event.eventType](event.payload);
		}

		if (this.online) {
			if (!this.processing)
				this.queue = this.queue.then(() => Promise.resolve()).then(() => this.step());
			// TODO send event to pb
		}
	}

	private async syncTable(table: string, options) {
		const records = await pb.collection(table).getFullList(options);
		console.log({ records });
		await db[table].bulkPut(records);
	}

	async startSync() {
		await this.step();
		const lastSync = localStorage.getItem('last-sync');
		const currentSync = DateTime.now();

		const options = {
			filter: lastSync ? `updated >= "${lastSync}"` : ''
		};
		// await this.syncTable('users');
		await this.syncTable('lists_users', options);
		await this.syncTable('lists', options);
		await this.syncTable('tasks', options);
		localStorage.setItem('last-sync', currentSync.setZone('utc').toFormat("yyyy-MM-dd HH:mm:s.u"));
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
						.update(record.recordId, record.payload);
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
