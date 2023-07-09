<script lang="ts">
	import { currentProject, db } from '$lib/storage.js';
	import { createId } from '$lib/utils.js';
	import Dexie, { liveQuery } from 'dexie';
	import { set } from 'lodash-es';
	import Editor from '$lib/editor.svelte';
	import Portal from 'svelte-portal';
	import EmptyDocs from '$lib/icons/emptyDocs.svelte';
	import { EventType, events } from '$lib/modelEvent.js';
	import { Collections } from '$lib/db.types.js';

	export let data;
	let randomId = createId();

	$: currentProject.set(data.projectId);

	$: docs = liveQuery(() => db.docs.where({ project: data.projectId }).toArray());

	$: taskDoc = liveQuery(async () => {
		const taskItems = await db.doc_blocks
			.where({ project: data.projectId, type: 'taskItem' })
			.toArray();
		return await Dexie.waitFor(() => getTasksFromTaskItems(taskItems));
	});

	// const taskItems = liveQuery(() =>
	// 	db.doc_blocks.where({ project: data.projectId, type: 'taskItem' }).toArray()
	// );

	// let tasks = [];
	// let taskDoc;

	async function getTasksFromTaskItems(taskItems) {
		const parentTasksByParentId = {};
		const content = await Promise.all(
			taskItems.map(async (taskItem, i) => {
				const taskContent = await db.doc_blocks
					.where('path')
					.startsWith(taskItem.path)
					.and(
						(item) =>
							item.project === data.projectId &&
							item.doc === taskItem.doc &&
							item.id !== taskItem.id
					)
					.toArray();

				const content = [];

				const ignorePaths = [];
				let task = {};

				taskContent
					.sort((a, b) => a.path.length - b.path.length)
					.forEach((block) => {
						const path = block.path.slice(taskItem.path.length + 1);
						const { properties, type, id, parent } = block;
						if (type === 'taskList') {
							parentTasksByParentId[id] = task;
						}
						set(content, path.split('.').join('.content.'), properties);
					});

				Object.assign(task, {
					parent: taskItem.parent,
					...taskItem.properties,
					attrs: {
						...taskItem.properties.attrs,
						doc: taskItem.doc,
						project: taskItem.project
					},
					doc: taskItem.doc,
					project: taskItem.project,
					content
				});

				return task;
			})
		);

		return {
			type: 'doc',
			content: [
				{
					type: 'taskList',
					content: content.filter((item) => !parentTasksByParentId[item.parent])
				}
			]
		};
	}

	async function updateTaskItem(event) {
		const { options, attrs, checked } = event.detail;
		const existingTask = await db.doc_blocks.get(attrs.id);
		existingTask.properties.attrs.checked = checked;
		await events.add({
			eventType: EventType.Update,
			modelType: Collections.DocBlocks,
			recordId: attrs.id,
			payload: { properties: existingTask.properties }
		});
	}

	// $: console.log(tasks);
</script>

<Portal target=".header-context-portal">
	<a class="button ghost accent" href="/projects/{data.projectId}/docs/new">Create Doc</a>
</Portal>

<h2>Tasks</h2>
{#if $taskDoc}
	<Editor
		isOverview={true}
		on:taskItemUpdate={updateTaskItem}
		content={$taskDoc}
		editable={false}
	/>
{/if}

<br />
<h2>Docs</h2>
<div class="docs">
	{#if $docs}
		{#each $docs as doc (doc.id)}
			<a class="button" href="/projects/{data.projectId}/docs/{doc.id}"> <div>{doc.title}</div></a>
		{:else}
			<EmptyDocs />
		{/each}
	{:else}
		<EmptyDocs />
	{/if}
</div>

<style lang="scss">
	br {
		line-height: calc(var(--block-spacing) * 4);
	}
	h2 {
		color: var(--text-2);
	}

	.docs {
		display: flex;
		flex-direction: column;
		gap: var(--block-spacing);
	}
</style>
