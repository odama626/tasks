import { DateTime } from 'luxon';
import * as Y from 'yjs';
import type { CollectionResponses } from './db.types';
import {
	EventType,
	db,
	pb,
	type BaseModelEvent,
	type CollectionInstances,
	type ModelCreateEvent,
	type ModelDeleteEvent,
	type ModelEvent,
	type ModelUpdateEvent,
	type ValueOf
} from './storage';
import {
	NotificationType,
	attachRecordToError,
	getYdoc,
	notify,
	prepareLocalPayload,
	prepareRecordFormData,
	rehydrateAttachments
} from './utils';

interface SyncTable<T extends keyof CollectionResponses, R> {
	table: T;
	/**
	 *	 a list of columns to precache as files
	 */
	cacheFileFields?: (keyof CollectionResponses[T])[];
	/**
	 *		a pocketbase token
	 *		required if cachine file fields
	 */
	token?: string;
	/**
	 *		 invalidate cache for each table when receiving an update
	 *		 subscription updates also force a refetch
	 */
	invalidateCache?: ValueOf<R>[];
	/**
	 *	Merge fields, uses ydoc merge algorithm
	 */
	mergeFields?: (keyof CollectionResponses[T])[];
}

const getSyncTablesByTable = ({
	token
}: {
	token: string;
}): Record<string, SyncTable<unknown, unknown>> => ({
	projects_users: {
		table: 'projects_users',
		invalidateCache: ['docs', 'users', 'projects'],
		token
	},
	docs_users: { table: 'docs_users', invalidateCache: ['docs', 'users'], token },
	users: { table: 'users', cacheFileFields: ['avatar'], token },
	projects: { table: 'projects' },
	docs: { table: 'docs', cacheFileFields: ['ydoc'], mergeFields: ['ydoc'], token },
	doc_attachments: { table: 'doc_attachments', cacheFileFields: ['file'], token },
	invites: { table: 'invites' }
});

async function processLocalEvent(event: ModelEvent<any>) {
	const payload = prepareLocalPayload(event.payload);
	if (event.eventType === 'update') {
		await db[event.modelType][event.eventType](event.recordId, payload);
	} else if (event.eventType === 'delete') {
		await db[event.modelType][event.eventType](event.recordId);
	} else {
		await db[event.modelType][event.eventType](payload);
	}
}

export class ModelEvents {
	public online: boolean = navigator.onLine;
	private processing = false;
	private syncing = false;
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
			await processLocalEvent(event);

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

	private async syncTable<
		T extends keyof CollectionResponses,
		R extends keyof CollectionInstances
	>({ table, cacheFileFields = [], token, invalidateCache = [] }: SyncTable<T, R>) {
		if (!this.online) return;

		const lastSync = localStorage.getItem(`last-sync:${table}`);
		const currentSync = DateTime.now();

		const options = { filter: lastSync ? `updated >= "${lastSync}"` : '' };
		const records = await pb
			.collection(table as string)
			.getFullList(undefined, { ...options, $autoCancel: false });
		const results = records.reduce<{ deleted: string[]; updates: CollectionResponses[T][] }>(
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

		if (cacheFileFields.length && token) {
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
				const syncTables = getSyncTablesByTable({ token });
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
	>(record: T, fields: (keyof T)[], token: string): Promise<R> {
		for (const field of fields) {
			const value = record[field];
			if (typeof value !== 'string') continue;
			if (!value.length) continue;
			const url = pb.files.getUrl(record, value, { token });
			await fetch(url);
			record[`cache_${String(field)}`] = url;
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

	async replayLocal(
		syncTableById: Record<string, SyncTable<unknown, unknown>>,
		offset = 0
	): Promise<void> {
		const limit = 50;
		try {
			const records = await db.events.offset(offset).limit(limit).toArray();
			console.log('replay local', records);
			for await (const record of records) {
				if (record.eventType === EventType.Add) continue;
				const { mergeFields } = syncTableById[record.modelType];
				if (mergeFields?.length) {
					let updated = false;
					for await (const field of mergeFields) {
						const file = record[field] as File;
						if (!file || !(file instanceof File)) return;
						const updatedYdoc = await getYdoc(record, field);
						const oldRecord = await db[record.modelType].get(record.recordId);
						const currentYDoc = await getYdoc(oldRecord, field);
						Y.applyUpdate(updatedYdoc, Y.encodeStateAsUpdate(currentYDoc));
						// TODO: need to rehydrate images after uploads have been done
						// await rehydrateAttachments(updatedYdoc, record.id);
						record[field] = new File([Y.encodeStateAsUpdate(updatedYdoc)], file.name, {
							type: file.type
						});
						updated = true;
						console.log({ field, record });
					}
					if (updated) {
						db.events.update(record.id, record);
					}
				}
				await processLocalEvent(record);
			}
			if (records.length === 50) return this.replayLocal(syncTableById, offset + limit);
		} catch (e) {
			console.error(e, { offset });
			notify({
				text: `Failed to replay local changes during sync`,
				detail: e.message,
				type: NotificationType.Error,
				timeout: 5000
			});
		}
	}

	async startSync() {
		if (!this.online) return;
		if (this.syncing) return;

		try {
			await pb.collection('users').authRefresh();
		} catch (e) {
			this.syncing = false;
			// TODO: store previous login credentials and wipe local data on login if it doesn't match
			localStorage.removeItem('auth');
			pb.authStore.clear();
			return location.reload();
		}

		try {
			const token = await pb.files.getToken();
			const syncTablesByTable = getSyncTablesByTable({ token });
			for (const syncTable of Object.values(syncTablesByTable)) {
				await this.syncTable(syncTable);
			}

			// replay all local changes before syncing
			await this.replayLocal(syncTablesByTable);

			console.log('done replaying');

			await this.step();
		} catch (e) {
			console.error(e);
			notify({
				text: 'Failed to sync',
				detail: e.message,
				type: NotificationType.Error,
				timeout: 5000
			});
		} finally {
			this.syncing = false;
		}
	}

	private async step(): Promise<void> {
		try {
			const records = await db.events.offset(0).limit(50).toArray();
			for await (const record of records) {
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
		} catch (e) {
			console.error(e);
			notify({
				text: 'Failed to sync',
				detail: e.message,
				type: NotificationType.Error,
				timeout: 5000
			});
		} finally {
			this.processing = false;
		}
	}
}

export const events = new ModelEvents();
