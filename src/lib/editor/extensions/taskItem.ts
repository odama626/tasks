import TaskItem from '@tiptap/extension-task-item';
import TaskItemElement from './taskItem.svelte';

export default TaskItem.extend({
	addOptions() {
		return {
			...this.parent?.(),
			isOverview: false
		};
	},

	addAttributes() {
		return {
			doc: {
				default: null
			},
			project: {
				default: null
			}
		};
	},
	addNodeView() {
		return ({ node, HTMLAttributes, getPos, editor }) => {
			const listItem = document.createElement('li');
			// const checkboxWrapper = document.createElement('label');
			// const checkboxStyler = document.createElement('span');
			// const checkbox = document.createElement('input');
			const element = new TaskItemElement({
				target: listItem,
				props: {
					editor,
					options: this.options,
					getPos,
					...node.attrs
				}
			});

			console.log(node.attrs);

			const content = document.createElement('span');

			console.log(this);

			console.log('rendered');

			// checkboxWrapper.contentEditable = 'false';
			// checkbox.type = 'checkbox';
			// checkbox.addEventListener('change', (event) => {
			// 	// if the editor isn’t editable and we don't have a handler for
			// 	// readonly checks we have to undo the latest change
			// 	if (!editor.isEditable && !this.options.onReadOnlyChecked) {
			// 		checkbox.checked = !checkbox.checked;

			// 		return;
			// 	}

			// 	const { checked } = event.target as any;

			// 	if (editor.isEditable && typeof getPos === 'function') {
			// 		editor
			// 			.chain()
			// 			.focus(undefined, { scrollIntoView: false })
			// 			.command(({ tr }) => {
			// 				const position = getPos();
			// 				const currentNode = tr.doc.nodeAt(position);

			// 				tr.setNodeMarkup(position, undefined, {
			// 					...currentNode?.attrs,
			// 					checked
			// 				});

			// 				return true;
			// 			})
			// 			.run();
			// 	}
			// 	if (!editor.isEditable && this.options.onReadOnlyChecked) {
			// 		// Reset state if onReadOnlyChecked returns false
			// 		if (!this.options.onReadOnlyChecked(node, checked)) {
			// 			checkbox.checked = !checkbox.checked;
			// 		}
			// 	}
			// });

			Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
				listItem.setAttribute(key, value);
			});

			listItem.dataset.checked = node.attrs.checked;
			listItem.id = node.attrs.id;
			// if (node.attrs.checked) {
			// 	checkbox.setAttribute('checked', 'checked');
			// }

			listItem.append(content);

			Object.entries(HTMLAttributes).forEach(([key, value]) => {
				listItem.setAttribute(key, value);
			});

			return {
				dom: listItem,
				contentDOM: content,
				update: (updatedNode) => {
					if (updatedNode.type !== this.type) {
						return false;
					}

					listItem.dataset.checked = updatedNode.attrs.checked;
					listItem.id = updatedNode.attrs.id;
					element.$set({
						editor,
						options: this.options,
						getPos,
						...updatedNode.attrs
					});

					return true;
				}
			};
		};
	}
});
