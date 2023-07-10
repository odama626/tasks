import { type ChainedCommands } from '@tiptap/core';
import H1 from '$lib/icons/H1.svelte';
import H2 from '$lib/icons/H2.svelte';
import Quote from '$lib/icons/Quote.svelte';
import OrderedList from '$lib/icons/Numbered List.svelte';
import Highlight from '$lib/icons/Highlight.svelte';
import List from '$lib/icons/List.svelte';
import TaskList from '$lib/icons/Task List.svelte';
type Prepare = (chain: ChainedCommands) => unknown;

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
	{
		title: 'List',
		type: 'inline',
		component: List,
		command: prepare((chain) => chain.toggleBulletList().run())
	},
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
	}
];
