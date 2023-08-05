import type {
	Collections,
	CollectionRecords,
	DocsResponse,
	DocAttachmentsResponse,
	CollectionResponses
} from './db.types';
import {
	db,
	pb,
	type DocAttachmentsInstance,
	type DocsInstance,
	type CollectionInstances
} from './storage';
import { DateTime } from 'luxon';
import { NotificationType, attachRecordToError, notify, prepareRecordFormData } from './utils';

export enum EventType {
	Add = 'add',
	Update = 'update',
	Delete = 'delete'
}

type ValueOf<T> = T[keyof T];

interface BaseModelEvent {
	eventType: EventType;
	modelType: Collections;
}

interface ModelCreateEvent<T> extends BaseModelEvent {
	eventType: EventType.Add;
	payload: T;
}

interface ModelUpdateEvent<T> extends BaseModelEvent {
	eventType: EventType.Update;
	payload: Partial<T>;
	recordId: string;
}

interface ModelDeleteEvent<T> extends BaseModelEvent {
	eventType: EventType.Delete;
	recordId: string;
	payload?: Partial<T>;
}

export type ModelEvent<T> = ModelCreateEvent<T> | ModelUpdateEvent<T> | ModelDeleteEvent<T>;

interface SyncTable {
	table: ValueOf<Collections>;
	/**
	 *	 a list of columns to precache as files
	 */
	cacheFileFields?: string[];
	/**
	 *		a pocketbase token
	 *		required if cachine file fields
	 */
	token?: string;
	/**
	 *		 invalidate cache for each table when receiving an update
	 *		 subscription updates also force a refetch
	 */
	invalidateCache?: ValueOf<Collections>[];
}

const getSyncTables = ({ token }): SyncTable[] => [
	{ table: 'projects_users', invalidateCache: ['docs', 'users', 'projects'] },
	{ table: 'docs_users', invalidateCache: ['docs', 'users'] },
	{ table: 'users', cacheFileFields: ['avatar'], token },
	{ table: 'tasks' },
	{ table: 'projects' },
	{ table: 'docs', cacheFileFields: ['ydoc'], token },
	{ table: 'doc_attachments', cacheFileFields: ['file'], token }
];

export class ModelEvents {
	public online: boolean = navigator.onLine;
	private processing: boolean = false;
	private queue: Promise<any> = Promise.resolve();

	constructor() {
		window.addEventListener('online', () => {
			this.online = true;
			this.startSync();
		});
		window.addEventListener('offline', () => (this.online = false));
	}

	private async add(event: ModelEvent<any>) {
		try {
			db.events.add(event);
			if (event.eventType === 'update') {
				await db[event.modelType][event.eventType](event.recordId, event.payload);
			} else if (event.eventType === 'delete') {
				await db[event.modelType][event.eventType](event.recordId);
			} else {
				await db[event.modelType][event.eventType](event.payload);
			}

			if (this.online) {
				if (!this.processing) this.processing = true;
				this.queue = this.queue.then(() => Promise.resolve()).then(() => this.step());
				// TODO send event to pb
			}
		} catch (e) {
			console.error('Something went wrong');
			console.error(e);
		}
	}

	async create<T>(modelType: BaseModelEvent['modelType'], payload: ModelCreateEvent<T>['payload']) {
		return this.add({
			modelType,
			eventType: EventType.Add,
			payload
		});
	}

	async update<T>(
		modelType: BaseModelEvent['modelType'],
		recordId: ModelUpdateEvent<T>['recordId'],
		payload: ModelUpdateEvent<T>['payload']
	) {
		return this.add({
			eventType: EventType.Update,
			modelType,
			recordId,
			payload
		});
	}

	async delete<T>(
		modelType: BaseModelEvent['modelType'],
		recordId: ModelDeleteEvent<T>['recordId'],
		payload?: Partial<T>
	) {
		return this.add({
			eventType: EventType.Delete,
			modelType: modelType,
			recordId,
			payload
		});
	}

	private async syncTable({ table, cacheFileFields = [], token, invalidateCache = [] }: SyncTable) {
		if (!this.online) return;

		const lastSync = localStorage.getItem(`last-sync:${table}`);
		const currentSync = DateTime.now();

		const options = { filter: lastSync ? `updated >= "${lastSync}"` : '' };
		const records = await pb.collection(table).getFullList(options, { $autoCancel: false });
		const results = records.reduce(
			(results, next) => {
				if (next.deleted) {
					results.deleted.push(next.id);
				} else {
					results.updates.push(next);
				}
				return results;
			},
			{ deleted: [], updates: [] }
		);

		if (records.length && invalidateCache.length) {
			invalidateCache.forEach((table) => localStorage.removeItem(`last-sync:${table}`));
		}

		if (cacheFileFields.length) {
			results.updates = await Promise.all(
				results.updates.map(async (update) => this.cacheFields(update, cacheFileFields, token))
			);
		}

		await db[table].bulkPut(results.updates);
		await db[table].bulkDelete(results.deleted);

		localStorage.setItem(
			`last-sync:${table}`,
			currentSync.setZone('utc').toFormat('yyyy-MM-dd HH:mm:s.u')
		);

		pb.collection(table).subscribe('*', async (data) => {
			if (data.action === 'delete' || data.record.deleted === true) {
				db[table].delete(data.record.id);
			} else {
				const record = await this.cacheFields(data.record, cacheFileFields, token);
				db[table].put(record);
			}
			if (invalidateCache.length) {
				const syncTables = getSyncTables({ token });
				for (const syncTable of syncTables) {
					if (invalidateCache.includes(syncTable.table)) {
						localStorage.removeItem(`last-sync:${syncTable.table}`);
						await this.syncTable(syncTable);
					}
				}
			}
		});

		return results.updates;
	}

	private async cacheFields<
		T extends ValueOf<CollectionResponses>,
		R extends ValueOf<CollectionInstances>
	>(record: T, fields: string[], token: string): Promise<R> {
		for (const field of fields) {
			const url = pb.files.getUrl(record, record[field], { token });
			await fetch(url);
			record[`cache_${field}`] = url;
		}
		return record as unknown as R;
	}

	async logout() {
		console.log('logout');
		localStorage.clear();
		db.delete();
		pb.authStore.clear();
		location.reload();
	}

	async startSync() {
		if (!this.online) return;
		await this.step();

		const token = await pb.files.getToken();
		const syncTables = getSyncTables({ token });
		for (const syncTable of syncTables) {
			await this.syncTable(syncTable);
		}

		// Order matters when using invalidateCache!

		// await this.cacheYdocs(docs as DocsInstance[], token);
		// await this.cacheAttachments(attachments as DocAttachmentsInstance[], token);
	}

	private async step(): Promise<void> {
		try {
			const records = await db.events.offset(0).limit(50).toArray();
			for await (let record of records) {
				if (!this.online) return;
				switch (record.eventType) {
					case EventType.Add: {
						await pb
							.collection(record.modelType)
							.create(prepareRecordFormData(record.payload), { $autoCancel: false })
							.catch(attachRecordToError('Failed to create Record', record));
						break;
					}
					case EventType.Update: {
						await pb
							.collection(record.modelType)
							.update(record.recordId, prepareRecordFormData(record.payload), {
								$autoCancel: false
							})
							.catch(attachRecordToError('Failed to update record', record));
						break;
					}
					case EventType.Delete:
						await pb
							.collection(record.modelType)
							.update(
								record.recordId,
								{ ...(record.payload ?? {}), deleted: true },
								{ $autoCancel: false }
							)
							.catch(attachRecordToError('Failed to delete record', record));
						break;
					default:
						throw new Error('Unexpected error occured during sync');
				}
				await db.events.where({ id: record.id }).delete();
			}
			if (records.length) return (this.queue = this.step());
			this.processing = false;
		} catch (e) {
			this.processing = false;
			console.error(e);
			notify({
				text: 'Failed to sync',
				detail: e.message,
				type: NotificationType.Error,
				timeout: 5000
			});
		}
	}
}

export const events = new ModelEvents();
