<script lang="ts">
	import './styles.scss';

	import SlashCommand from '$lib/editor/extensions/slash';
	import TaskItem from '$lib/editor/extensions/taskItem';
	import { Editor, type JSONContent } from '@tiptap/core';
	import BubbleMenu from '@tiptap/extension-bubble-menu';
	import Collaboration from '@tiptap/extension-collaboration';
	import FloatingMenu from '@tiptap/extension-floating-menu';
	import Highlight from '@tiptap/extension-highlight';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import TaskList from '@tiptap/extension-task-list';
	import Typography from '@tiptap/extension-typography';
	import StarterKit from '@tiptap/starter-kit';
	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { Markdown } from 'tiptap-markdown';
	import * as Y from 'yjs';
	import CollaborationCursor from './editor/extensions/CollaborationCursor';
	import { getCommands } from './editor/extensions/commands';
	import { Id } from './editor/extensions/id';
	import { ImageExtension } from './editor/extensions/image';
	import { userStore } from './storage';
	import file from './editor/extensions/file';

	let element: HTMLDivElement;
	export let editor: Editor = null;
	export let editable: boolean = true;
	export let autofocus: boolean = false;
	export let isOverview: boolean = false;
	export let ydoc = new Y.Doc();
	export let editorProps = {};
	export let provider;
	export let metadata = {};

	let currentAction;

	let floatingMenuRef: HTMLDivElement;
	let bubbleMenuRef: HTMLDivElement;

	const dispatch = createEventDispatcher();

	export let content: JSONContent;

	$: {
		if (editor && content) {
			editor.commands.setContent(content);
		}
	}

	// TODO use collaboration plugin and yjs to sync data
	// Store docs as T.Doc, store tasks from docs only to be able to reference them outside of the doc
	// Checking or unchecking a task will require loading doc, modifying content and then resaving the doc
	// https://discuss.yjs.dev/t/appropriate-way-to-load-initial-data-fallback-to-current-yjs-doc-data/1189/10

	// https://github.com/ueberdosis/tiptap/blob/main/packages/extension-collaboration/src/collaboration.ts
	// https://tiptap.dev/guide/collaborative-editing

	onMount(() => {
		const style = getComputedStyle(document.documentElement);
		const userRecord = get(userStore)?.record;

		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({ commands: false, history: false }),
				TaskItem.configure({ nested: true, isOverview, dispatch }),
				Collaboration.configure({ document: ydoc, field: 'doc' }),
				provider &&
					CollaborationCursor.configure({
						provider,
						user: {
							name: userRecord?.name,
							user: userRecord,
							color: style.getPropertyValue('--text-3'),
							backgroundColor: style.getPropertyValue('--surface-4')
						}
					}),
				Placeholder.configure({
					placeholder: 'Write something...'
				}),
				Link,
				file,
				Id,
				TaskList,
				SlashCommand(metadata),
				Markdown,
				ImageExtension,
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
			editorProps,
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

	const prepareMenuItem = (callback) => (editor) => callback(editor.chain().focus(), metadata);
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
		<button class="outline small" on:click={() => (currentAction = command.command(editor))}>
			{#if command.component}
				<svelte:component this={command.component} />
			{:else}
				{command.title}
			{/if}
		</button>
	{/each}
</div>

{#await currentAction}
	<!-- <div class="loading-spinner">
	<div class="spinner">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			style="margin: auto; display: block; shape-rendering: auto;"
			width="200px"
			height="200px"
			viewBox="0 0 100 100"
			preserveAspectRatio="xMidYMid"
		>
			<path d="M10 50A40 40 0 0 0 90 50A40 42 0 0 1 10 50" fill="var(--text-4)" stroke="none">
				<animateTransform
					attributeName="transform"
					type="rotate"
					dur="1s"
					repeatCount="indefinite"
					keyTimes="0;1"
					values="0 50 51;360 50 51"
				/>
			</path>
		</svg
		>
	</div>
</div> -->
{/await}
<div bind:this={bubbleMenuRef} class="bubble-menu">
	{#each bubbleMenuCommands as command, i (command.title)}
		<button
			class="ghost"
			data-title={command.title.toLowerCase()}
			on:click={() => (currentAction = command.command(editor))}
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
	.loading-spinner {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(5px);
	}
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
			margin: var(--block-spacing) 0;
		}
		:global(li > span > p) {
			margin: 0;
		}

		:global(img) {
			max-width: 100%;
			max-height: 60dvh;
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

	/* Give a remote user a caret */
	:global(.collaboration-cursor__caret) {
		border-left: 1px solid #0d0d0d;
		border-right: 1px solid #0d0d0d;
		margin-left: -1px;
		margin-right: -1px;
		pointer-events: none;
		position: relative;
		word-break: normal;
	}

	/* Render the username above the caret */
	:global(.collaboration-cursor__label) {
		border-radius: 3px 3px 3px 0;
		background-color: var(--surface-accent-3);
		color: var(--text-3);
		font-size: 12px;
		font-style: normal;
		font-weight: 600;
		left: -1px;
		line-height: normal;
		padding: 0.1rem 0.3rem;
		position: absolute;
		top: -1.4em;
		user-select: none;
		white-space: nowrap;
	}
</style>
