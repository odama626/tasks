import { Node, mergeAttributes } from '@tiptap/core';
import Component from './file.svelte';

declare module '@tiptap/core' {}

export default Node.create({
	name: 'file',
	draggable: true,

	group: 'block',

	addAttributes() {
		return {
			url: {
				default: undefined
			},
			docAttachment: {
				default: undefined
			}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'file'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['file', HTMLAttributes];
	},

	addNodeView() {
		return ({ node, HTMLAttributes, getPos, editor }) => {
			const dom = document.createElement('span');

			const element = new Component({
				target: dom,
				props: {
					editor,
					getPos,
					attrs: node.attrs,
					dispatch: this.options.dispatch,
					...node.attrs
				}
			});

			Object.entries(HTMLAttributes).forEach(([key, value]) => {
				dom.setAttribute(key, value);
			});

			return {
				dom
			};
		};
	}
});
