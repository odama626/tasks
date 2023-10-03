import { Node, mergeAttributes } from '@tiptap/core';
import Component from './file.svelte';

declare module '@tiptap/core' {}

export default Node.create({
	name: 'file',

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
				tag: 'div[data-type="file"]'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'file' }), 0];
	},

	addNodeView() {
		return ({ node, HTMLAttributes, getPos, editor }) => {
			const dom = document.createElement('div');
			dom.innerHTML = 'blahhhh';
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

			// Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
			// 	dom.setAttribute(key, value)
			// })

			// Object.entries(HTMLAttributes).forEach(([key, value]) => {
			// 	dom.setAttribute(key, value);
			// })

			return {
				dom,
			};
		};
	}
});
