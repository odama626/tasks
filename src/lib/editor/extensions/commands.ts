import { type ChainedCommands } from '@tiptap/core';
import H1 from '$lib/icons/H1.svelte';
import H2 from '$lib/icons/H2.svelte';
import Quote from '$lib/icons/Quote.svelte';
import OrderedList from '$lib/icons/Numbered List.svelte';
import Highlight from '$lib/icons/Highlight.svelte';
import List from '$lib/icons/List.svelte';
import TaskList from '$lib/icons/Task List.svelte';
import Upload from '$lib/icons/upload.svelte';
import { insertImage } from '$lib/insertImage';
type Prepare = (callback: (chain: ChainedCommands, metadata: Metadata) => unknown) => unknown;

export interface Metadata {
	docId: string;
	userId: string;
}

export const getCommands = (prepare: Prepare) => [
	{
		title: 'H1',
		type: 'inline',
		component: H1,
		command: prepare((chain) => chain.setNode('heading', { level: 1 }).run())
	},
	{
		title: 'H2',
		type: 'inline',
		component: H2,
		command: prepare((chain) => chain.setNode('heading', { level: 2 }).run())
	},
	{
		title: 'Bold',
		type: 'bubble',
		command: prepare((chain) => chain.toggleMark('bold').run())
	},
	{
		title: 'Italic',
		type: 'bubble',
		command: prepare((chain) => chain.toggleMark('italic').run())
	},
	{
		title: 'Quote',
		type: 'inline',
		component: Quote,
		command: prepare((chain) => chain.setBlockquote().run())
	},
	{
		title: 'Ordered List',
		type: 'inline',
		component: OrderedList,
		command: prepare((chain) => chain.toggleOrderedList().run())
	},
	// {
	// 	title: 'List',
	// 	type: 'inline',
	// 	component: List,
	// 	command: prepare((chain) => chain.toggleBulletList().run())
	// },
	{
		title: 'Task list',
		type: 'inline',
		component: TaskList,
		command: prepare((chain) => chain.toggleTaskList().run())
	},
	{
		title: 'Highlight',
		type: 'bubble',
		component: Highlight,
		command: prepare((chain) => chain.toggleHighlight().run())
	},
	{
		title: 'Add file',
		type: 'inline',
		component: Upload,
		command: prepare(async (chain, metadata) => {
			const picker = document.createElement('input');
			picker.type = 'file';
			picker.multiple = true;

			let pickFiles = new Promise<File[]>((resolve) => {
				picker.addEventListener('change', () => {
					resolve(Array.from(picker.files ?? []));
				});
			});
			picker.click();

			const files = await pickFiles;

			return new Promise<void>((resolve) =>
				chain
					.focus()
					.command((props) => {
						async function go() {
							let offset = 0;
							for await (const [i, file] of files.entries()) {
								if (file.type.startsWith('image/')) {
									const { selection } = props.state;
									const position = selection.$anchor.pos;
									offset += await insertImage(file, metadata, props.view, position + i + offset);
								}
							}
							resolve();
						}
						go();
						return true;
					})
					.run()
			);
		})
	}
];
