<script lang="ts">
	import './styles.scss';

	import { Editor, type JSONContent } from '@tiptap/core';
	import { createEventDispatcher, onMount } from 'svelte';
	import StarterKit from '@tiptap/starter-kit';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '$lib/editor/extensions/taskItem';
	import SlashCommand from '$lib/editor/extensions/slash';
	import Link from '@tiptap/extension-link';
	import { Id } from './editor/extensions/id';

	let element: HTMLDivElement;
	export let editor: Editor = null;
	export let editable: boolean = true;
	export let autofocus: boolean = false;
	export let isOverview: boolean = false;

	const dispatch = createEventDispatcher();

	export let content: JSONContent;

	$: {
		if (editor) {
			editor.commands.setContent(content);
		}
	}

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({ commands: false }),
				TaskItem.configure({ nested: true, isOverview, dispatch }),
				Link,
				Id,
				TaskList,
				SlashCommand
			],
			content,
			editable,
			autofocus,
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				// editor = editor;
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
		box-sizing: border-box;
		> :global(div) {
			outline: none;
			height: 100%;
		}
		max-width: 80ch;
		margin: auto;
		padding: 1ch;
		// border: solid 2px var(--surface-4);
		// background-color: var(--surface-2);
		border-radius: 4px;
	}
</style>
