import { Extension } from '@tiptap/core';
// import { Plugin, PluginKey } from '@tiptap/pm/state';

type Node = any;

// function walkContent(path: number[], it: number, content: Node[], step) {
// 	return content.reduce(
// 		(args, node, index) => {
// 			if (args.done) return args;
// 			return walkNode(args.path, args.it, node, index, step);
// 		},
// 		{ path, it }
// 	);
// }

// function walkNode(path: number[], it: number, node: Node, index: number, step) {
// 	console.log({ path, it, node, index, step });
// 	if (node.content.size + it < step.from) return { path, it: it + node.content.size };
// 	console.log(node.content.content);
// 	if (node.content.content.length)
// 		return walkContent([...path, index], it, node.content.content, step);

// 	console.log({ it, path, node });
// 	return {
// 		node,
// 		path: [...path, index],
// 		done
// 	};
// }

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

	onChange({ editor, transaction, state, nextState }) {
		const { doc, steps } = transaction;
		const step = steps[0];
		console.log(editor, transaction);
		// const state = editor.view.state;
		// const nextState = editor.view.state.apply(transaction);

		console.log(state === nextState);
		// const result = walkContent([], 0, doc.content.content, step);

		// console.log({ result });

		// doc.content.content.reduce(
		// 	({ path, it }, node, i) => {
		// 		return walkNode(path, it, node, index, step);
		// 	},
		// 	{ path: [], it: 0 }
		// );

		// console.log('update', args);
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
