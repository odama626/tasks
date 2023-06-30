<script lang="ts">
	import { currentProject, db } from '$lib/storage.js';
	import { createId } from '$lib/utils.js';
	import { liveQuery } from 'dexie';
	import { onMount } from 'svelte';
	import { set } from 'lodash-es';
	import { generateHTML } from '@tiptap/core';
	import extensions from '$lib/editor/extensions/extensions.js';
	import Editor from '$lib/editor.svelte';
	import TaskItem from '$lib/editor/extensions/taskItem.svelte';
	import Portal from 'svelte-portal';

	export let data;
	let randomId = createId();

	$: currentProject.set(data.projectId);

	$: docs = liveQuery(() => db.docs.where({ project: data.projectId }).toArray());
	const taskItems = liveQuery(() =>
		db.doc_blocks.where({ project: data.projectId, type: 'taskItem' }).toArray()
	);

	let tasks = [];
	let taskDoc;

	// taskItems && taskItems.forEach((taskItems) => {
	// 	console.log(taskItems);
	// });

	taskItems.subscribe(async (taskItems) => {
		const parentTasksByParentId = {};
		const content = await Promise.all(taskItems.map(async (taskItem, i) => {
			console.log(taskItem);
			const taskContent = await db.doc_blocks
				.where('path')
				.startsWith(taskItem.path)
				.and(
					(item) => 
						item.project === data.projectId && item.doc === taskItem.doc && item.id !== taskItem.id
				)
				.toArray();

			const content = [];

			console.log({ taskContent })

			const ignorePaths = [];
			let task = {}


			taskContent
				.sort((a, b) => a.path.length - b.path.length)
				.forEach((block) => {
					const path = block.path.slice(taskItem.path.length + 1);
					const { properties, type, id, parent } = block; 
					if (type === 'taskList') {
						parentTasksByParentId[id] = task;
					}
					
					// if (parentTasksByParentId[block.parent]) {
					// 	console.log('set parent')
					// 	properties.content = [{ type: 'paragraph', content: [{ type: 'text', text: `A child task`}]}]
					// }
					console.log({ path });
					set(content, path.split('.').join('.content.'), properties);
				})

			console.log({ parentTasksByParentId, parent: taskItem.parent})

			Object.assign(task, {
				parent: taskItem.parent,
				...taskItem.properties,
				content
			})

			return task

			// const doc= {
			// 	type: 'doc',
			// 	content: [
			// 		{
			// 			...taskItem.properties,
			// 			content
			// 		}
			// 	]
			// };

			// tasks[i] = {
			// 	id: taskItem.id,
			// 	record: taskItem,
			// 	json: doc,
			// 	markup: generateHTML(doc, extensions)
			// };
			// console.log({ taskContent, content });
			// tasks = tasks;
		}));

		// content.filter(item => {
		// 		const parent = parentTasksByParentId[item.parent]
		// 	if (parent) {
		// 		console.log('has parent', item, parent)
		// 		item.content.push({ type: 'paragraph', content: [{ type: 'text', text: `Subtask of`}, ... parent.content]})
		// 	}
		// })

		taskDoc = {
			type: 'doc',
			content: [{
				type: 'taskList',
				content: content.filter(item => !parentTasksByParentId[item.parent])}]
		}
		console.log({ doc: taskDoc})
	});

	// $: tasks = liveQuery(async () => {
	// 	const tasks = db.doc_blocks.where({ project: data.projectId, type: 'taskItem' }).toArray();
	// 	return Promise.all(tasks.map(async task => {
	// 		await db.doc_blocks.where({ project: data.projectId, parent: task.id }).toArray()
	// 		return task
	// 	}))
	// });

	$: console.log(tasks);
</script>

<Portal target='.header-context-portal'>
	<a class='button ghost accent' href="/projects/{data.projectId}/docs/new">Create Doc</a>
</Portal>

<h2>Tasks</h2>
{#if taskDoc}
	<Editor content={taskDoc} editable={false} />
{/if}

<br />
<h2>Docs</h2>
<div class='docs'>
{#if $docs}
	{#each $docs as doc (doc.id)}
		<a class='button' href="/projects/{data.projectId}/docs/{doc.id}"> <div>{doc.title}</div></a>
	{/each}
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
		flex-direction:column;
		gap: var(--block-spacing);
	}
	
</style>
