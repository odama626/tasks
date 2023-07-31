<script lang="ts">
	import { goto } from '$app/navigation';
	import Checkbox from '$lib/checkbox.svelte';
	import ContextMenu from '$lib/context-menu.svelte';
	import {
		Collections,
		type DocAttachmentsRecord,
		type DocAttachmentsResponse
	} from '$lib/db.types.js';
	import EditorComponent from '$lib/editor.svelte';
	import ChevronLeft from '$lib/icons/chevron-left.svelte';
	import { events, EventType } from '$lib/modelEvent.js';
	import type { Editor } from '@tiptap/core';
	import Portal from 'svelte-portal';
	import { WebrtcProvider } from 'y-webrtc';
	import { IndexeddbPersistence } from 'y-indexeddb';
	import { saveDocument } from './saveDocument';
	import * as Y from 'yjs';
	import { db, pb, userStore } from '$lib/storage';
	import { onMount } from 'svelte';
	import { createId } from '$lib/utils';
	import { get } from 'svelte/store';

	$: {
		if (data.docId === 'new') {
			const id = createId();
			events.create(Collections.Docs, {
				title: 'Untitled Document',
				createdBy: get(userStore).record.id,
				project: data.projectId,
				id
			});
			goto(`/projects/${data.projectId}/docs/${id}`, { replaceState: true });
		}
	}

	export let data;
	let editor: Editor;
	let saving = false;
	let title = data?.doc?.title ?? 'Untitled Document';
	let ydoc = new Y.Doc();
	let hasCollaborators = false;

	async function rehydrateImages() {
		const token = await pb.files.getToken();

		const fragment = ydoc.getXmlFragment('doc');

		for (const image of fragment.createTreeWalker((yxml) => yxml.nodeName === 'image')) {
			if (!image.getAttribute('src').startsWith('blob')) continue;

			const attachmentId = image.getAttribute('docAttachment');
			const attachment = attachments.find(
				(attachment: DocAttachmentsResponse) => attachment.id === attachmentId
			);
			const src = pb.files.getUrl(attachment, attachment.file, { token });
			image.setAttribute('src', src);
		}
	}

	if (data.ydoc) {
		console.log(data.doc);
		try {
			Y.applyUpdate(ydoc, data.ydoc);
			rehydrateImages();
		} catch (e) {
			console.error(e);
		}
	}

	let provider = new WebrtcProvider(window.location.href, ydoc, {
		signaling: ['wss://signals.tasks.lilbyte.dev']
	});
	// let offlineProvider = new IndexeddbPersistence(window.location.href, ydoc);

	onMount(() => {
		provider.awareness.on('change', (change) => {
			console.log({ change });
			hasCollaborators = provider.awareness.getStates().size !== 1;
		});
		return () => {
			provider.destroy();
			// offlineProvider.destroy();
			// if (!hasCollaborators) onSave();
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
		const body = Y.encodeStateAsUpdateV2(ydoc);
		console.log(body);
		const id = await saveDocument(title, data.docId, ydoc, data.projectId, editor.getJSON());

		if (data.docId === 'new')
			goto(`/projects/${data.projectId}/docs/${id}`, { replaceState: true });
		saving = false;
	}

	async function insertImage(file: File, view, event, slice, moved) {
		const image = new Image();
		image.src = URL.createObjectURL(file);

		await new Promise((resolve) => (image.onload = resolve));

		const attachmentId = createId();
		events.create(Collections.DocAttachments, {
			id: attachmentId,
			createdBy: get(userStore).record.id,
			file,
			doc: data.docId
		});

		const { schema } = view.state;
		const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
		console.log(file.type);
		const node = schema.nodes.image.create({
			src: image.src,
			docAttachment: attachmentId
		}); // creates the image element
		pb.collection('doc_attachments').subscribe(attachmentId, async (data) => {
			const token = await pb.files.getToken();
			const src = pb.getFileUrl(data.record, data.record.file, { token });
			const newNode = schema.nodes.image.create({ src, docAttachment: attachmentId });
			const image = new Image();
			image.src = src;

			await new Promise((resolve) => (image.onload = resolve));
			const transaction = view.state.tr.setNodeAttribute(coordinates.pos, 'src', src);
			view.dispatch(transaction);
			pb.collection('doc_attachments').unsubscribe(attachmentId);
		});
		const transaction = view.state.tr.insert(coordinates.pos, node); // places it in the correct position
		return view.dispatch(transaction);
	}

	function handleDrop(view, event, slice, moved) {
		if (!moved && event.dataTransfer?.items?.length > 0) {
			const items = Array.from(event.dataTransfer.items);
			// if dropping external files
			// handle the image upload
			items.map(async (item) => {
				console.log({ item });
				if (item.kind === 'file' && item.type.startsWith('image/')) {
					const file = item.getAsFile();
					await insertImage(file, view, event, slice, moved);
				}
				if (item.kind === 'string' && item.type === 'text/uri-list') {
					const text = await new Promise((resolve) => item.getAsString(resolve));
					console.log({ text });
					const blob = await fetch(text).then((r) => r.blob());
					if (blob.type.startsWith('image/')) {
						const { schema } = view.state;
						await insertImage(
							new File([blob], createId(), { type: blob.type }),
							view,
							event,
							slice,
							moved
						);
					}
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
		<input class="ghost title" bind:value={title} />
	</div>
</Portal>

<div class="document">
	<Portal target=".header-context-portal">
		<div class="header-portal-items">
			<button disabled={saving} class="ghost" on:click={onSave}>Save</button>
			<ContextMenu>
				<div slot="items">
					<div class="menu-item">
						<Checkbox
							label="Exclude from project overview"
							checked={data.doc.excludeFromOverview}
							on:change={(e) => {
								events.add({
									modelType: Collections.Docs,
									eventType: EventType.Update,
									recordId: data.doc.id,
									payload: { excludeFromOverview: e.target.checked }
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
		bind:editor
		{ydoc}
		{provider}
		editorProps={{ handleDrop }}
		content={data?.ydoc ? undefined : data.content}
		editable={true}
	/>
</div>

<style lang="scss">
	.document {
		height: 100%;
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
