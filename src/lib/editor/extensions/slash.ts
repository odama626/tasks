import tippy from 'tippy.js';
import CommandsList from './commandsList.svelte';
import { Extension, type ChainedCommands } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

type Prepare = (chain: ChainedCommands) => unknown;

export const getCommands = (prepare: Prepare) => [
	{
		title: 'H1',
		type: 'inline',
		command: prepare((chain) => chain.setNode('heading', { level: 1 }).run())
	},
	{
		title: 'H2',
		type: 'inline',
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
		command: prepare((chain) => chain.setBlockquote().run())
	},
	{
		title: 'Ordered List',
		type: 'inline',
		command: prepare((chain) => chain.toggleOrderedList().run())
	},
	{
		title: 'List',
		type: 'inline',
		command: prepare((chain) => chain.toggleBulletList().run())
	},
	{
		title: 'Task list',
		type: 'inline',
		command: prepare((chain) => chain.toggleTaskList().run())
	}
];

const suggestionCommands = getCommands(
	(callback) =>
		({ editor, range }) =>
			callback(editor.chain().focus().deleteRange(range))
);

const configuration = {
	suggestion: {
		items: ({ query }) => {
			return suggestionCommands
				.filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
				.slice(0, 10);
		},

		render: () => {
			let component;
			let popup;
			const element = document.createElement('div');

			return {
				onStart: (props) => {
					component = new CommandsList({ props, target: element });

					if (!props.clientRect) eturn;

					popup = tippy('body', {
						getReferenceClientRect: props.clientRect,
						appendTo: () => document.body,
						content: element,
						showOnCreate: true,
						interactive: true,
						trigger: 'manual',
						placement: 'bottom-start'
					});
				},

				onUpdate(props) {
					component.$set(props);

					if (!props.clientRect) {
						return;
					}

					popup[0].setProps({ getReferenceClientRect: props.clientRect });
				},

				onKeyDown(props) {
					if (props.event.key === 'Escape') {
						popup[0].hide();

						return true;
					}
					return component.onKeyDown(props);
				},

				onExit() {
					popup[0].destroy();
					component.$destroy();
				}
			};
		}
	}
};

export default new Extension({
	name: 'commands',
	addOptions() {
		return {
			suggestion: {
				char: '/',
				command: ({ editor, range, props }) => {
					props.command({ editor, range });
				}
			}
		};
	},
	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion
			})
		];
	}
}).configure(configuration);
