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
						default: null,
						parseHTML: (element) => {
							return element.dataset.id;
						},
						renderHTML: (attributes) => {
							return { 'data-id': attributes.id };
						}
					}
				}
			}
		];
	}
});
