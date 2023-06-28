<script lang="ts">
	import './styles.scss';

	import StarterKit from '@tiptap/starter-kit';
	import { Editor, type JSONContent } from '@tiptap/core';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '$lib/editor/extensions/taskItem';
	import SlashCommand from '$lib/editor/extensions/slash';
	import Link from '@tiptap/extension-link';
	import { onMount } from 'svelte';
	import { Id } from './editor/extensions/id';

	let element;
	export let editor;


	export let content: JSONContent;

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure({ commands: false }),
				TaskItem.configure({ nested: true }),
				Link,
				Id,
				TaskList,
				SlashCommand
			],
			content,
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;
			}
		});
	});
</script>

<div class="editor" bind:this={element} />
 <button on:click={() => console.log(editor.getJSON())}>Export</button>

<style lang="scss">
	.editor {
		> :global(div) {
			min-height: 10rem;
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
