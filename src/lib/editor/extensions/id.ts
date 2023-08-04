import { createId } from '$lib/utils';
import { Extension } from '@tiptap/core';

export const Id = Extension.create({
	priority: 1000,
	addOptions() {
		return {
			types: [
				'paragraph',
				'blockquote',
				'bulletList',
				'codeBlock',
				'doc',
				'hardBreak',
				'heading',
				'horizontalRule',
				'listItem',
				'orderedList',
				// 'text',
				'taskItem',
				'taskList'
			]
		};
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					id: {
						default: undefined,
						keepOnSplit: false,
						parseHTML: (element) => {
							return element.id ?? createId();
						},
						renderHTML: (attributes) => {
							return { id: attributes.id ?? createId() };
						}
					}
				}
			}
		];
	}
});
