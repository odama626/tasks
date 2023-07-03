<script lang="ts">
	import { currentProject, db } from '$lib/storage.js';
	import { createId } from '$lib/utils.js';
	import Dexie, { liveQuery } from 'dexie';
	import { set } from 'lodash-es';
	import Editor from '$lib/editor.svelte';
	import Portal from 'svelte-portal';
	import EmptyDocs from '$lib/icons/emptyDocs.svelte';

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
		console.log('items', { taskItems });
		const parentTasksByParentId = {};
		const content = await Promise.all(
			taskItems.map(async (taskItem, i) => {
				console.log(taskItem);
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

				console.log({ taskContent });

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

				console.log({ parentTasksByParentId, parent: taskItem.parent });

				Object.assign(task, {
					parent: taskItem.parent,
					...taskItem.properties,
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
		console.log({ doc: taskDoc });
	}

	// $: console.log(tasks);

	$: console.log({ $taskDoc });
</script>

<Portal target=".header-context-portal">
	<a class="button ghost accent" href="/projects/{data.projectId}/docs/new">Create Doc</a>
</Portal>

<h2>Tasks</h2>
{#if $taskDoc}
	<Editor content={$taskDoc} editable={false} />
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
