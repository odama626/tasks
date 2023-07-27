<script lang="ts">
	import { goto } from '$app/navigation';
	import Checkbox from '$lib/checkbox.svelte';
	import ContextMenu from '$lib/context-menu.svelte';
	import { Collections } from '$lib/db.types.js';
	import EditorComponent from '$lib/editor.svelte';
	import ChevronLeft from '$lib/icons/chevron-left.svelte';
	import { events, EventType } from '$lib/modelEvent.js';
	import type { Editor } from '@tiptap/core';
	import Portal from 'svelte-portal';
	import { WebrtcProvider } from 'y-webrtc';
	import { saveDocument } from './saveDocument';
	import * as Y from 'yjs';
	import { pb } from '$lib/storage';

	export let data;
	let editor: Editor;
	let saving = false;
	let title = data?.doc?.title ?? 'Untitled Document';
	let ydoc = new Y.Doc();
	if (data.ydoc) {
		console.log(data.doc);
		try {
			Y.applyUpdate(ydoc, data.ydoc);
			for (const image of ydoc
				.getXmlFragment('doc')
				.createTreeWalker((yxml) => yxml.nodeName === 'image')) {
				console.log(image.toDOM());
				const id = image.getAttribute('id').replace(/([A-Z])/g, (_, m) => '_' + m.toLowerCase());
				const attachment = data.doc.attachments.find((a) => a.startsWith(id));
				pb.files.getToken().then((token) => {
					const src = pb.files.getUrl(data.doc, attachment, { token });
					console.log({ attachment, src });
					image.setAttribute('src', src);
				});
				console.log(id);
			}
		} catch (e) {
			console.error(e);
		}
	}
	let provider = new WebrtcProvider(window.location.href, ydoc);

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
