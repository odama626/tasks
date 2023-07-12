<script lang="ts">
	import { goto } from '$app/navigation';
	import { Collections } from '$lib/db.types.js';
	import EditorComponent from '$lib/editor.svelte';
	import { events, EventType } from '$lib/modelEvent.js';
	import { db, RecordAccess, userStore } from '$lib/storage.js';
	import { createId, notify } from '$lib/utils.js';
	import type { Editor } from '@tiptap/core';
	import { get } from 'svelte/store';
	import { set } from 'lodash-es';
	import Portal from 'svelte-portal';
	import ChevronLeft from '$lib/icons/chevron-left.svelte';

	export let data;
	let editor: Editor;
	let saving = false;

	interface Block {
		type: string;
		properties: unknown;
		content?: Block[];
	}

	interface ProcessBlockOptions {
		path: string;
		parent?: string;
		doc: string;
		project: string;
		usedIds: Set<string>;
	}

	async function processBlock(block: Block, options: ProcessBlockOptions): Promise<string[]> {
		const { path, parent, doc, project, usedIds } = options;
		const isNew = !(block.attrs?.id && !usedIds.has(block.attrs?.id));
		const id = isNew ? createId() : block.attrs.id;
		const eventType = isNew ? EventType.Add : EventType.Update;
		set(block, 'attrs.id', id);
		set(block, 'attrs.project', options.project);
		set(block, 'attrs.doc', options.doc);
		usedIds.add(id);
		let ids: string[] = [];

		const { content: _, ...properties } = block;

		if (!block.type) throw block;

		const payload = {
			id,
			type: block.type,
			properties,
			path,
			doc,
			parent,
			project,
			file: properties?.attrs?.file
		};

		delete properties?.attrs?.file;

		await events.add({
			eventType,
			recordId: id,
			modelType: Collections.DocBlocks,
			payload
		});

		if (block.content) {
			ids = await Promise.all(
				block.content.map((innerBlock, index) =>
					processBlock(innerBlock, { ...options, parent: id, path: `${path}.${index}` })
				)
			);
		}
		ids.unshift(id);
		return ids;
	}

	function getText(content): string {
		if (content.type === 'text' && content.text) return content.text;
		if (content.content) return getText(content.content[0]);
	}
	async function onSave() {
		if (saving) return;
		saving = true;
		const content = editor.getJSON();
		const isNew = data.docId === 'new';
		const id = isNew ? createId() : data.docId;

		const title = getText(content);

		const record = {
			eventType: isNew ? EventType.Add : EventType.Update,
			modelType: Collections.Docs,
			recordId: id,
			payload: {
				title,
				createdBy: get(userStore).record.id,
				project: data.projectId,
				id
			}
		};

		await events.add(record);

		if (isNew) {
			const docsUsersId = createId();
			await events.add({
				eventType: EventType.Add,
				modelType: Collections.DocsUsers,
				recordId: docsUsersId,
				payload: {
					id: docsUsersId,
					user: get(userStore).record.id,
					doc: id,
					access: RecordAccess.Admin
				}
			});
		}

		const usedIds = new Set();

		const blockIds = await Promise.all(
			content.content.map((block, index) =>
				processBlock(block, { path: `${index}`, doc: id, project: data.projectId, usedIds })
			)
		);

		const ids = blockIds.flat(Infinity).reduce((result, next) => {
			result[next] = true;
			return result;
		}, {});

		const staleRecords = (await db.doc_blocks.where({ doc: data.docId }).toArray())
			.filter((block) => !ids[block.id])
			.map((block) => block.id);

		// db.doc_blocks.where({ id: staleRecords }).delete();

		await Promise.all(
			staleRecords.map((recordId) =>
				events.add({
					eventType: EventType.Delete,
					modelType: Collections.DocBlocks,
					recordId
				})
			)
		);

		notify({ text: `Saved "${title}"` });

		// TODO text nodes can't have attributes

		// TODO if there is a tiptap plugin that generates ids, most of them should match so we can collect the ids and diff them with the current records
		// to know what to delete vs what to update or add, verify that the ids don't change in update

		saving = false;
		if (data.docId === 'new')
			goto(`/projects/${data.projectId}/docs/${id}`, { replaceState: true });
	}

	let content = {
		type: 'doc',
		content: [
			{
				type: 'heading',
				attrs: {
					level: 1
				},
				content: [
					{
						type: 'text',
						text: 'Untitled Document'
					}
				]
			},
			{
				type: 'paragraph'
			}
		]
	};
</script>

<Portal target=".sub-header-slot">
	<div class="subheader">
		<a href="/projects/{data.projectId}" class="button icon ghost">
			<ChevronLeft class="button" />
		</a>
		<div>{data?.doc?.title}</div>
	</div>
</Portal>

<div class="document">
	<Portal target=".header-context-portal">
		<button disabled={saving} class="ghost" on:click={onSave}>Save</button>
	</Portal>
	<EditorComponent bind:editor content={data.content ?? content} editable={true} />
</div>

<style lang="scss">
	.document {
		height: 100%;
		:global(.editor) {
			height: 100%;
		}
	}

	.subheader {
		> :first-child {
			margin-left: -0.75rem;
		}
		display: flex;
		flex-direction: row;
		justify-content: start;
		align-items: center;
	}
</style>
