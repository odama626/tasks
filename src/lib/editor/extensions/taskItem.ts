import TaskItem from '@tiptap/extension-task-item';
import TaskItemElement from './taskItem.svelte';
import TaskItemOverviewElement from './taskItemOverview.svelte';

export default TaskItem.extend({
	addOptions() {
		return {
			...this.parent?.(),
			isOverview: false,
			dispatch: () => {}
		};
	},

	addAttributes() {
		return {
			...this.parent?.(),
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
			const element = new TaskItemElement({
				target: listItem,
				props: {
					editor,
					options: this.options,
					getPos,
					attrs: node.attrs,
					dispatch: this.options.dispatch,
					...node.attrs
				}
			});

			const content = document.createElement('span');
			content.style = 'align-self: center;';
			listItem.append(content);

			const overview =
				this.options.isOverview &&
				new TaskItemOverviewElement({
					target: listItem,
					props: {
						editor,
						options: this.options,
						getPos,
						...node.attrs
					}
				});

			Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
				listItem.setAttribute(key, value);
			});

			listItem.dataset.checked = node.attrs.checked;
			listItem.id = node.attrs.id;

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
						dispatch: this.options.dispatch,
						attrs: node.attrs,
						...updatedNode.attrs
					});

					if (overview) {
						overview.$set({
							editor,
							options: this.options,
							getPos,
							...updatedNode.attrs
						});
					}

					return true;
				}
			};
		};
	}
});
