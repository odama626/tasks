<script lang="ts">
	import { goto } from '$app/navigation';
	import Checkbox from '$lib/checkbox.svelte';
	import ContextMenu from '$lib/context-menu.svelte';
	import { Collections } from '$lib/db.types.js';
	import EditorComponent from '$lib/editor.svelte';
	import ChevronLeft from '$lib/icons/chevron-left.svelte';
	import { insertFile, insertImage } from '$lib/insertAttachment';
	import { events } from '$lib/modelEvent.js';
	import { pb, userStore } from '$lib/storage';
	import Tooltip from '$lib/tooltip.svelte';
	import { createId, getDocProvider } from '$lib/utils';
	import type { Editor } from '@tiptap/core';
	import { onMount } from 'svelte';
	import Portal from 'svelte-portal';
	import { get } from 'svelte/store';
	import type { WebrtcProvider } from 'y-webrtc';
	import { createDocument, saveDocument } from './saveDocument';

	$: {
		if (data.docId === 'new') {
			createDocument(data.projectId).then((id) =>
				goto(`/projects/${data.projectId}/docs/${id}`, { replaceState: true })
			);
		}
	}

	export let data;
	let editor: Editor;
	let saving = false;
	let ydoc = data.ydoc;
	let title = data?.doc?.title ?? 'Untitled Document';
	let collaborators = [];

	let metadata = {
		docId: data.docId,
		userId: get(userStore).record.id
	};

	if (data.ydoc) {
		try {
			if (!ydoc.getText('title').toString().length) {
				ydoc.getText('title').insert(0, title);
			}
		} catch (e) {
			console.error(e);
		}
	}

	let provider: WebrtcProvider;
	if (events.online) {
		provider = getDocProvider(data.doc, ydoc);
	}

	onMount(() => {
		ydoc.getText('title').observe((event) => {
			const value = event.target.toString();
			title = value;
		});
		provider?.awareness.on('change', (change) => {
			collaborators = Array.from(provider.awareness.getStates().entries()).map(([id, entry]) => ({
				user: entry.user,
				id
			}));
		});
		return () => {
			provider?.destroy();
		};
	});

	async function exportMarkdown(markdown: string) {
		const a = document.createElement('a');
		const file = new File([markdown], title + '.md', { type: 'text/markdown' });
		const url = URL.createObjectURL(file);
		a.setAttribute('href', url);
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 500);
	}

	async function onSave() {
		if (saving) return;
		saving = true;
		const id = await saveDocument(data.docId, ydoc);

		saving = false;
	}

	function handleDrop(view, event, slice, moved) {
		if (!moved && event.dataTransfer?.items?.length > 0) {
			const items = Array.from(event.dataTransfer.items);
			// if dropping external files
			// handle the image upload

			const pos = view.posAtCoords({ left: event.clientX, top: event.clientY }).pos;

			items.map(async (item) => {
				try {
					if (item.kind === 'file' && item.type.startsWith('image/')) {
						const file = item.getAsFile();
						if (file.type.startsWith('image/')) {
							await insertImage(file, metadata, view, pos);
						} else {
							await insertFile(file, metadata, view, pos);
						}
					}
					if (item.kind === 'string' && item.type === 'text/uri-list') {
						const text = await new Promise((resolve) => item.getAsString(resolve));
						const blob = await fetch(text).then((r) => r.blob());
						if (blob.type.startsWith('image/')) {
							const { schema } = view.state;
							await insertImage(
								new File([blob], createId(), { type: blob.type }),
								metadata,
								view,
								pos
							);
						}
					}
				} catch (e) {
					console.error(e);
				}
			});

			return true; // handled
		}
		return false; // not handled use default behaviour
	}
</script>

<Portal target=".sub-header-slot">
	<div class="subheader">
		<a href="/projects/{data.projectId}" class="button icon ghost">
			<ChevronLeft class="button" />
		</a>
		<input
			class="ghost title"
			value={title}
			on:input={(e) => {
				const text = ydoc.getText('title');
				const value = e.target.value;
				text.delete(0, text.toString().length);
				text.insert(0, value);
			}}
		/>
	</div>
</Portal>

<div class="document">
	<Portal target=".header-context-portal">
		<div class="header-portal-items">
			<div class="collaborators">
				{#each collaborators as collaborator}
					{@const user = collaborator?.user?.user}
					{@const image = data.token && pb.getFileUrl(user, user?.avatar, { token: data.token })}
					<Tooltip>
						<div slot="content" class="profile-image" style="--profile-image-size: 40px;">
							<img src={image} />
						</div>
						<div slot="tooltip" style="white-space: nowrap;">
							{collaborator.user.name}
						</div>
					</Tooltip>
				{/each}
			</div>
			<button disabled={saving} class="ghost" on:click={onSave}>Save</button>
			<ContextMenu>
				<div slot="items">
					<div class="menu-item">
						<Checkbox
							label="Exclude from project overview"
							checked={data.doc.excludeFromOverview}
							on:change={(e) => {
								events.update(Collections.Docs, data.doc.id, {
									excludeFromOverviw: e.target.checked
								});
							}}
						/>
					</div>
					<div class="menu-item">
						<button on:click={() => exportMarkdown(editor.storage.markdown.getMarkdown())}>
							Export as markdown
						</button>
					</div>
				</div>
			</ContextMenu>
		</div>
	</Portal>
	<EditorComponent
		{metadata}
		bind:editor
		{ydoc}
		{provider}
		editorProps={{ handleDrop }}
		editable={true}
	/>
</div>

<style lang="scss">
	.collaborators {
		display: flex;
		gap: var(--block-spacing);
		padding: 0 var(--block-spacing);
	}

	.document {
		:global(.editor) {
			height: 100%;
		}
	}

	.title {
		font-size: 2rem;
		padding-bottom: 0;
		margin-bottom: 1rem;
		width: 100%;
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
