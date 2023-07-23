<script lang="ts">
	import { goto } from '$app/navigation';
	import ContextMenu from '$lib/context-menu.svelte';
	import { Collections } from '$lib/db.types.js';
	import Editor from '$lib/editor.svelte';
	import ChevronLeft from '$lib/icons/chevron-left.svelte';
	import DocumentPlus from '$lib/icons/document-plus.svelte';
	import EmptyDocs from '$lib/icons/emptyDocs.svelte';
	import { EventType, events } from '$lib/modelEvent.js';
	import { currentProject, db } from '$lib/storage.js';
	import { collectFormData } from '$lib/utils.js';
	import Dexie, { liveQuery } from 'dexie';
	import { groupBy, keyBy, set } from 'lodash-es';
	import Portal from 'svelte-portal';
	import ShareForm from './share-form.svelte';

	export let data;
	let expandedDocs = {};
	let isEditingName = false;
	let isShareMenuOpen = false;

	$: currentProject.set(data.projectId);

	currentProject.subscribe(() => {
		isEditingName = false;
	});

	$: docs = liveQuery(() => db.docs.where({ project: data.projectId }).toArray());

	$: project = liveQuery(() => db.projects.get(data.projectId));

	$: taskDoc = liveQuery(async () => {
		const taskItems = await db.doc_blocks
			.where({ project: data.projectId, type: 'taskItem' })
			.toArray();
		return await Dexie.waitFor(() => getTasksFromTaskItems(taskItems));
	});

	$: linkDocContent = liveQuery(async () => {
		const links = await db.doc_blocks.where({ project: data.projectId, type: 'text' }).toArray();
		return links
			.filter((link) => link.properties.marks?.some((mark) => mark.type === 'link'))
			.sort((a, b) => a.properties.text.localeCompare(b.properties.text))
			.map((link) => ({ type: 'paragraph', content: [link.properties] }));
	});

	async function getTasksFromTaskItems(taskItems) {
		const parentTasksByParentId = {};
		const docsById = keyBy(await db.docs.where({ project: data.projectId }).toArray(), 'id');
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

		const filteredContent = content.filter((item) => !parentTasksByParentId[item.parent]);
		const tasksByDocument = groupBy(content, 'doc');

		return {
			tasksByDocument,
			overviewTasks: filteredContent.filter((task) => {
				if (task?.attrs?.checked) return false;
				const doc = docsById[task.doc];
				if (doc.excludeFromOverview) return false;

				return true;
			})
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

<Portal target=".sub-header-slot">
	<div class="subheader">
		<a href="/projects" class="button icon ghost">
			<ChevronLeft class="button" />
		</a>
		{#if isEditingName}
			<form
				on:submit|preventDefault={collectFormData((formData) => {
					console.log(formData);
					events.add({
						modelType: Collections.Projects,
						eventType: EventType.Update,
						recordId: data.projectId,
						payload: formData
					});
					isEditingName = false;
				})}
				style="flex-direction: row"
			>
				<input class="ghost" style="width: 100%;" autofocus value={$project?.name} name="name" />
				<button>Update</button>
			</form>
		{:else}
			<button style="padding-left: 0;" on:click={() => (isEditingName = true)} class="ghost">
				<div>{$project?.name}</div>
			</button>
		{/if}
	</div>
</Portal>

<Portal target=".header-context-portal">
	<div class="header-portal-items">
		<a class="button ghost icon" href="/projects/{data.projectId}/docs/new"><DocumentPlus /></a>
		<ContextMenu>
			<div slot="items">
				<div class="menu-item">
					<button on:click={() => (isShareMenuOpen = !isShareMenuOpen)}>Share</button>
				</div>
			</div>
		</ContextMenu>
	</div>
</Portal>

{#if isShareMenuOpen}
	<div
		class="modal-shade"
		on:keyup={(e) => {
			if (e.code === 'Escape') isShareMenuOpen = false;
		}}
		on:click={() => (isShareMenuOpen = false)}
	>
		<div class="modal">
			<ShareForm projectId={data.projectId} />
		</div>
	</div>
{/if}

{#if $taskDoc && $docs && $linkDocContent}
	{#if $taskDoc?.overviewTasks?.length}
		<h2>Tasks</h2>
		<Editor
			isOverview={true}
			on:taskItemUpdate={updateTaskItem}
			content={{ type: 'doc', content: $taskDoc.overviewTasks }}
			editable={false}
		/>
		<br />
	{/if}

	<h2>Docs</h2>
	<div class="docs">
		{#if $docs}
			{#each $docs as doc (doc.id)}
				{@const tasks = $taskDoc.tasksByDocument[doc.id]}
				{@const expanded = expandedDocs[doc.id]}
				<button
					on:click={(e) => {
						if (!tasks) {
							return goto(`/projects/${data.projectId}/docs/${doc.id}`);
						}
						expandedDocs[doc.id] = !expanded;
						expandedDocs = expandedDocs;
					}}
					class="document"
				>
					<a href="/projects/{data.projectId}/docs/{doc.id}">
						<div class="title">{doc.title}</div>
					</a>
					<div class="actions">
						<svg
							class:empty={!tasks}
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="icon doc-expand"
							style={expanded && 'scale: 1 -1'}
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M19.5 8.25l-7.5 7.5-7.5-7.5"
							/>
						</svg>
					</div>
				</button>
				{#if expanded && tasks}
					<div class="tasks-group">
						<Editor
							isOverview={true}
							on:taskItemUpdate={updateTaskItem}
							content={{ type: 'doc', content: tasks }}
							editable={false}
						/>
					</div>
				{/if}
			{:else}
				<EmptyDocs />
			{/each}
		{:else}
			<EmptyDocs />
		{/if}
	</div>
	<br />
	{#if $linkDocContent?.length}
		<h2>Links</h2>
		<Editor isOverview content={{ type: 'doc', content: $linkDocContent }} editable={false} />
	{/if}
{:else}
	<div class="loading">
		<h2 />
		<p />
		<p />
		<p />
		<p />
		<h2 />
		<p />
		<p />
		<p />
	</div>
{/if}

<style lang="scss">
	.doc-expand {
		color: var(--text-3);
		&.empty {
			visibility: hidden;
			pointer-events: none;
		}
		padding: calc(var(--spacing));
	}
	.tasks-group {
		padding: 0 0.75rem;
	}

	br {
		line-height: calc(var(--block-spacing) * 4);
	}
	h2 {
		color: var(--text-2);
	}

	.document {
		display: flex;
		justify-content: space-between;
		align-items: center;
		.actions {
			--spacing: 8px;
			margin: calc(var(--spacing) * -1 - 4px);
			display: flex;
		}
	}

	.docs {
		display: flex;
		flex-direction: column;
		gap: var(--block-spacing);
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
