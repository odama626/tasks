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
	import ImageExtension from '@tiptap/extension-image';
	import { Markdown } from 'tiptap-markdown';
	import Collaboration from '@tiptap/extension-collaboration';
	import Placeholder from '@tiptap/extension-placeholder';
	import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
	import { WebrtcProvider } from 'y-webrtc';
	import * as Y from 'yjs';
	import { userStore } from './storage';
	import { get } from 'svelte/store';

	let element: HTMLDivElement;
	export let editor: Editor = null;
	export let editable: boolean = true;
	export let autofocus: boolean = false;
	export let isOverview: boolean = false;

	let floatingMenuRef: HTMLDivElement;
	let bubbleMenuRef: HTMLDivElement;
	let provider;

	const dispatch = createEventDispatcher();

	const ydoc = new Y.Doc();

	onMount(() => {
		provider = new WebrtcProvider(window.location.href, ydoc);
		ydoc.getXmlFragment('body');

		return () => {
			provider.destroy();
		};
	});

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

	function handleDrop(view, event, slice, moved) {
		if (!moved && event.dataTransfer?.items?.length > 0) {
			const items = Array.from(event.dataTransfer.items);
			// if dropping external files
			// handle the image upload
			items.map(async (item) => {
				console.log({ item });
				if (item.kind === 'file' && item.type.startsWith('image/')) {
					const image = new Image();
					const file = item.getAsFile();
					console.log({ file, image });
					image.src = URL.createObjectURL(file);
					await new Promise((resolve) => (image.onload = resolve));
					console.log(image.src);
					const { schema } = view.state;
					const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
					const node = schema.nodes.image.create({ src: image.src, file }); // creates the image element
					const transaction = view.state.tr.insert(coordinates.pos, node); // places it in the correct position
					return view.dispatch(transaction);
				}
				if (item.kind === 'string' && item.type === 'text/uri-list') {
					const text = await new Promise((resolve) => item.getAsString(resolve));
					console.log({ text });
					const blob = await fetch(text).then((r) => r.blob());
					if (blob.type.startsWith('image/')) {
						const { schema } = view.state;
						const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
						const node = schema.nodes.image.create({ src: text, file: blob }); // creates the image element
						const transaction = view.state.tr.insert(coordinates.pos, node); // places it in the correct position
						return view.dispatch(transaction);
					}
				}
			});

			return true; // handled
		}
		return false; // not handled use default behaviour
	}

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({ commands: false, history: false }),
				TaskItem.configure({ nested: true, isOverview, dispatch }),
				Collaboration.configure({ fragment: ydoc.getXmlFragment('body') }),
				CollaborationCursor.configure({
					provider,
					user: {
						name: get(userStore).record?.name,
						color: getComputedStyle(document.documentElement).getPropertyValue('--surface-4')
					}
				}),
				Placeholder.configure({
					placeholder: 'Write something...'
				}),
				Link,
				Id,
				TaskList,
				SlashCommand,
				Markdown,
				ImageExtension.extend({
					addAttributes() {
						return {
							...this.parent?.(),
							file: {
								default: undefined
							},
							id: {
								default: undefined
							}
						};
					}
				}).configure({ allowBase64: true }),
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
			editorProps: {
				handleDrop
			},
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
