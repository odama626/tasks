<script lang="ts">
	import './styles.scss';

	import { Editor, type JSONContent } from '@tiptap/core';
	import { createEventDispatcher, onMount } from 'svelte';
	import StarterKit from '@tiptap/starter-kit';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '$lib/editor/extensions/taskItem';
	import SlashCommand from '$lib/editor/extensions/slash';
	import FloatingMenu from '@tiptap/extension-floating-menu';
	import BubbleMenu from '@tiptap/extension-bubble-menu';
	import Link from '@tiptap/extension-link';
	import { Id } from './editor/extensions/id';
	import EllipsisVertical from './icons/ellipsis-vertical.svelte';
	import Typography from '@tiptap/extension-typography';
	import Highlight from '@tiptap/extension-highlight';
	import { getCommands } from './editor/extensions/commands';

	let element: HTMLDivElement;
	export let editor: Editor = null;
	export let editable: boolean = true;
	export let autofocus: boolean = false;
	export let isOverview: boolean = false;

	let floatingMenuRef: HTMLDivElement;
	let bubbleMenuRef: HTMLDivElement;

	const dispatch = createEventDispatcher();

	export let content: JSONContent;

	$: {
		if (editor) {
			editor.commands.setContent(content);
		}
	}

	// TODO use collaboration plugin and yjs to sync data
	// store data as blocks by providing a yjs document then convert it to json before save
	// https://github.com/ueberdosis/tiptap/blob/main/packages/extension-collaboration/src/collaboration.ts
	// https://tiptap.dev/guide/collaborative-editing

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({ commands: false }),
				TaskItem.configure({ nested: true, isOverview, dispatch }),
				Link,
				Id,
				TaskList,
				SlashCommand,
				Typography,
				Highlight.configure({ HTMLAttributes: { class: 'accent' } }),
				FloatingMenu.configure({
					element: floatingMenuRef
					// shouldShow: () => true
					// tippyOptions: {
					// 	placement: 'right-start'
					// }
				}),
				BubbleMenu.configure({
					element: bubbleMenuRef,
					tippyOptions: {
						placement: 'bottom'
					}
				})
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

	const prepareMenuItem = (callback) => (editor) => callback(editor.chain().focus());
	const floatingMenuCommands = getCommands(prepareMenuItem).filter(
		(command) => command.type === 'inline'
	);
	const bubbleMenuCommands = getCommands(prepareMenuItem).filter(
		(command) => command.type === 'bubble'
	);
</script>

<div class="editor" bind:this={element} />
<div bind:this={floatingMenuRef} class="floating-menu accent">
	{#each floatingMenuCommands as command (command.title)}
		<button class="outline small" on:click={() => command.command(editor)}>
			{#if command.component}
				<svelte:component this={command.component} />
			{:else}
				{command.title}
			{/if}
		</button>
	{/each}
</div>
<div bind:this={bubbleMenuRef} class="bubble-menu">
	{#each bubbleMenuCommands as command, i (command.title)}
		<button
			class="ghost"
			data-title={command.title.toLowerCase()}
			on:click={() => command.command(editor)}
		>
			{#if command.component}
				<svelte:component this={command.component} />
			{:else}
				{command.title}
			{/if}
		</button>
		{#if i < bubbleMenuCommands.length - 1}
			<div class="divider vertical" />
		{/if}
	{/each}
</div>

<style lang="scss">
	.editor {
		box-sizing: border-box;
		> :global(div) {
			outline: none;
			height: 100%;
		}
		max-width: 80ch;
		margin: auto;
		// padding: 1ch;
		// border: solid 2px var(--surface-4);
		// background-color: var(--surface-2);
		border-radius: 4px;

		:global(p) {
			padding: var(--block-spacing) 0;
		}
		:global(li > span > p) {
			padding: 0;
		}
	}

	.floating-menu {
		display: flex;
		flex-wrap: wrap;
		white-space: nowrap;
		// margin-left: 24px;
		gap: var(--block-spacing);
	}

	.bubble-menu {
		display: flex;
		flex-wrap: wrap;
		white-space: nowrap;
		background-color: var(--surface-2);
		border: 1px solid var(--surface-3);
		border-radius: 50px;
	}

	[data-title='bold'] {
		font-weight: bolder;
	}

	[data-title='italic'] {
		font-style: oblique;
	}
</style>
