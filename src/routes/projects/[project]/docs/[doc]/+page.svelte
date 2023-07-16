<script lang="ts">
	import { goto } from '$app/navigation';
	import { Collections } from '$lib/db.types.js';
	import EditorComponent from '$lib/editor.svelte';
	import { events, EventType } from '$lib/modelEvent.js';
	import type { Editor } from '@tiptap/core';
	import Portal from 'svelte-portal';
	import ChevronLeft from '$lib/icons/chevron-left.svelte';
	import ContextMenu from '$lib/context-menu.svelte';
	import Checkbox from '$lib/checkbox.svelte';
	import { saveDocument } from './saveDocument';

	export let data;
	let editor: Editor;
	let saving = false;

	async function onSave() {
		if (saving) return;
		saving = true;
		const id = await saveDocument(data.docId, data.projectId, editor.getJSON());

		if (data.docId === 'new')
			goto(`/projects/${data.projectId}/docs/${id}`, { replaceState: true });
		saving = false;
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
		<div class="header-portal-items">
			<button disabled={saving} class="ghost" on:click={onSave}>Save</button>
			<ContextMenu>
				<div slot="items">
					<div class="menu-item">
						<Checkbox
							label="Exclude from project overview"
							checked={data.doc.excludeFromOverview}
							on:change={(e) => {
								console.log(e.target.checked);
								events.add({
									modelType: Collections.Docs,
									eventType: EventType.Update,
									recordId: data.doc.id,
									payload: { excludeFromOverview: e.target.checked }
								});
							}}
						/>
					</div>
				</div>
			</ContextMenu>
		</div>
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
