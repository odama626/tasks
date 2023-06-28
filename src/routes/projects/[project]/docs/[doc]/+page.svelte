<script lang="ts">
	import { goto } from '$app/navigation';
	import { Collections } from '$lib/db.types.js';
	import EditorComponent from '$lib/editor.svelte';
	import { events, EventType } from '$lib/modelEvent.js';
	import { db, userStore } from '$lib/storage.js';
	import { createId } from '$lib/utils.js';
	import type { Editor } from '@tiptap/core';
	import { get } from 'svelte/store';
	import { set } from 'lodash-es';

	export let data;
	let editor: Editor;

	console.log({ data });

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
	}

	async function processBlock(block: Block, options: ProcessBlockOptions): string[] {
		const { path, parent, doc, project } = options;
		console.log(block.id);
		const id = block.attrs?.id ?? createId();
		const eventType = block.attrs?.id ? EventType.Update : EventType.Add;
		set(block, 'attrs.id', id);
		let ids: string[] = [];

		const { content: _, ...properties } = block;

		if (!block.type) throw block

		const payload = {
			id,
			type: block.type,
			properties,
			path,
			doc,
			parent,
			project
		};
		await events.add({
			eventType,
			recordId: id,
			modelType: Collections.DocBlocks,
			payload
		});
		if (block.content) {
			ids = await Promise.all(
				block.content.map((innerBlock, index) =>
					processBlock(innerBlock, { ...options, parent: id, path: `${path}.content.${index}` })
				)
			);
		}
		ids.unshift(id);
		return ids;
	}

	function getText(content) {
		if (content.text) return content.text;
		if (content.content) return getText(content.content[0]);
	}

	async function onSave() {
		const doc = editor.getJSON();
		const id = data.docId === 'new' ? createId() : data.docId;

		console.log(JSON.stringify({ doc }, null, 2));

		const title = getText(doc);

		console.log({ title });

		const record = {
			eventType: data.docId === 'new' ? EventType.Add : EventType.Update,
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

		const blockIds = await Promise.all(
			doc.content.map((block, index) =>
				processBlock(block, { path: `${index}`, doc: id, project: data.projectId })
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

		staleRecords.forEach((recordId) =>
			events.add({
				eventType: EventType.Delete,
				modelType: Collections.DocBlocks,
				recordId
			})
		);

		console.log({ staleRecords });

		console.log({ record });

		console.log({ blockIds });

		// TODO text nodes can't have attributes

		// TODO if there is a tiptap plugin that generates ids, most of them should match so we can collect the ids and diff them with the current records
		// to know what to delete vs what to update or add, verify that the ids don't change in update

		if (data.docId === 'new') goto(`/projects/${data.projectId}/docs/${id}`);
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

	$: console.log({ content });
</script>

<EditorComponent bind:editor content={data.doc ?? content} />
<button on:click={onSave}>Save</button>
