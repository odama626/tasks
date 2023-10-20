<script lang="ts">
	import { goto } from '$app/navigation';
	import ContextMenu from '$lib/context-menu.svelte';
	import { Collections } from '$lib/db.types.js';
	import Editor from '$lib/editor.svelte';
	import ChevronLeft from '$lib/icons/chevron-left.svelte';
	import DocumentPlus from '$lib/icons/document-plus.svelte';
	import EmptyDocs from '$lib/icons/emptyDocs.svelte';
	import { events } from '$lib/modelEvent.js';
	import { saveDocument } from '$lib/saveDocument';
	import { EventType, currentProject, db, type DocsInstance } from '$lib/storage.js';
	import {
		collectFormData,
		getDocProvider,
		getYdoc,
		rehydrateAttachments,
		serializeXmlToJson,
		type TiptapNode
	} from '$lib/utils.js';
	import { liveQuery, type Observable } from 'dexie';
	import { onDestroy } from 'svelte';
	import Portal from 'svelte-portal';
	import type { WebrtcProvider } from 'y-webrtc';
	import type * as Y from 'yjs';
	import ShareForm from './share-form.svelte';

	export let data;
	let expandedDocs = {};
	let isEditingName = false;
	let isShareMenuOpen = false;

	$: currentProject.set(data.projectId);

	currentProject.subscribe(() => {
		isEditingName = false;
	});

	let docs: Observable<DocsInstance[]>;

	$: project = liveQuery(() => db.projects.get(data.projectId));

	let tasks: TiptapNode<'taskItem'>[] = [];
	let links: TiptapNode<'text'>[] = [];
	let images: TiptapNode<'img'>[] = [];
	let ydocsByDocId: Record<string, Y.Doc> = {};
	let tasksByDocId = {};
	let providersByDocId: Map<string, WebrtcProvider> = new Map();

	function fetchDocs() {
		docs = liveQuery(() => db.docs.where({ project: data.projectId }).toArray());
		return docs;
	}

	onDestroy(() => {
		providersByDocId.forEach((value, key) => {
			value.destroy();
			providersByDocId.delete(key);
		});
	});

	function omitCheckedChildren(node) {
		return {
			...node,
			content: node.content
				?.filter((node) => node.type !== 'taskItem' || !node?.attrs?.checked)
				.map(omitCheckedChildren)
		};
	}

	async function fetchTasks() {
		if (!$docs) return;
		let newTasks: TiptapNode<'taskItem'>[] = [];
		let newTasksByDocId = {};
		let newLinks: TiptapNode<'text'>[] = [];
		let newImages = [];
		let docsToUnsubscribe = new Set(providersByDocId.keys());
		await Promise.all(
			$docs.map(async (doc) => {
				if (!ydocsByDocId[doc.id]) ydocsByDocId[doc.id] = await getYdoc(doc);
				const ydoc = ydocsByDocId[doc.id];
				const fragment = ydoc.getXmlFragment('doc');
				let children = new Set();
				let allTaskItems: Y.XmlElement[] = [];

				docsToUnsubscribe.delete(doc.id);
				if (!providersByDocId.has(doc.id)) {
					const provider = getDocProvider(doc, ydoc);
					providersByDocId.set(doc.id, provider);
					fragment.observeDeep((event) => {
						fetchTasks();
					});
				}

				for (const taskItem of fragment.createTreeWalker((yxml) => yxml.nodeName === 'taskItem')) {
					if (children.has(taskItem.getAttribute('id'))) continue;
					for (const childItem of taskItem.createTreeWalker(
						(yxml) => yxml.nodeName === 'taskItem'
					)) {
						children.add(childItem.getAttribute('id'));
					}
					allTaskItems.push(taskItem);
				}

				const taskItems = allTaskItems
					.filter((taskItem) => !children.has(taskItem.getAttribute('id')))
					.map(serializeXmlToJson<'taskItem'>);

				newTasksByDocId[doc.id] = taskItems;

				if (doc.excludeFromOverview) return;

				newTasks.push(...taskItems.filter((item) => !item.attrs?.checked).map(omitCheckedChildren));

				for (const linkItem of fragment.createTreeWalker((yxml) => !yxml.nodeType)) {
					const linkContent = serializeXmlToJson(linkItem);
					const linkContents = Array.isArray(linkContent) ? linkContent : [linkContent];
					newLinks.push(
						...linkContents.filter((link) => link.marks?.some((mark) => mark.type === 'link'))
					);
				}

				links = newLinks
					.sort((a, b) => a.text.localeCompare(b.text))
					.map((link) => ({ type: 'paragraph', content: [link] }));

				await rehydrateAttachments(ydoc, doc.id);

				for (const image of fragment.createTreeWalker((yxml) => yxml.nodeName === 'image')) {
					newImages.push(serializeXmlToJson(image));
				}

				images = newImages;
			})
		);

		docsToUnsubscribe.forEach((docId: string) => {
			const provider = providersByDocId.get(docId);
			provider?.destroy();
			providersByDocId.delete(docId);
		});

		tasks = newTasks;
		tasksByDocId = newTasksByDocId;
	}

	// Subscriptions
	fetchDocs();
	$: $docs, fetchTasks();
	$: data.projectId, fetchDocs();

	function onTaskItemUpdate(event) {
		const { doc, id } = event.detail?.attrs;
		const { checked } = event.detail;
		const ydoc = ydocsByDocId[doc];
		const taskItem = ydoc
			.getXmlFragment('doc')
			.createTreeWalker((yxml) => yxml.nodeName === 'taskItem' && yxml.getAttribute('id') === id)
			.next().value;
		taskItem.setAttribute('checked', checked);
		saveDocument(doc, ydoc);
	}
</script>

<Portal target=".sub-header-slot">
	<div class="subheader">
		<a href="/projects" class="button icon ghost">
			<ChevronLeft class="button" />
		</a>
		{#if isEditingName}
			<form
				on:submit|preventDefault={collectFormData((formData) => {
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

{#if tasks && docs && links}
	{#if tasks.length}
		<h2>Tasks</h2>
		<!-- TODO: wrap tasks in a tasklist to fix spacing -->
		<Editor
			on:taskItemUpdate={onTaskItemUpdate}
			isOverview={true}
			editable={false}
			content={{ type: 'doc', content: [{ type: 'taskList', content: tasks }] }}
		/>
		<br />
	{/if}

	<h2>Docs</h2>
	<div class="docs">
		{#if $docs}
			{#each $docs as doc (doc.id)}
				{@const tasks = tasksByDocId[doc.id]}
				{@const expanded = expandedDocs[doc.id]}
				<button
					on:click={(e) => {
						if (!tasks?.length) {
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
							class:empty={!tasks?.length}
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
				{#if expanded && tasks?.length}
					<div class="tasks-group">
						<Editor
							isOverview={true}
							on:taskItemUpdate={onTaskItemUpdate}
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
	{#if links.length}
		<h2>Links</h2>
		<Editor isOverview content={{ type: 'doc', content: links }} editable={false} />
	{/if}

	{#if images.length}
		<h2>Media</h2>
		<Editor isOverview content={{ type: 'doc', content: images }} editable={false} />
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
