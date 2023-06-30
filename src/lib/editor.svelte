<script lang="ts">
	import './styles.scss';

	import { Editor, type JSONContent } from '@tiptap/core';
	import { createEventDispatcher, onMount } from 'svelte';

	import extensions from './editor/extensions/extensions';

	let element: HTMLDivElement;
	export let editor: Editor = null;
	export let editable: boolean = true;
	export let autofocus: boolean = false;

	const dispatch = createEventDispatcher();

	export let content: JSONContent;

	onMount(() => {
		editor = new Editor({
			element,
			extensions,
			content,
			editable,
			autofocus,
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;
			}
		});
		editor.on('destroy', () => dispatch('destroy', { editor }));
		editor.on('update', () => dispatch('update', { editor }));

		return () => {
			editor.destroy();
		};
	});
</script>

<div class="editor" bind:this={element} />

<style lang="scss">
	.editor {
		> :global(div) {
			outline: none;
		}
		max-width: 80ch;
		margin: auto;
		padding: 1ch;
		// border: solid 2px var(--surface-4);
		// background-color: var(--surface-2);
		border-radius: 4px;
	}
</style>
