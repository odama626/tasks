import TaskList from '@tiptap/extension-task-list';
import TaskListOverlay from './taskListOverlay.svelte';

export enum Priority {
	Normal = 'normal',
	High = 'high'
}

export default TaskList.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			// priority: {
			// 	default: Priority.Normal
			// }
		};
	},

	addNodeView() {
		return ({ node, HTMLAttributes, getPos, editor }) => {
			const dom = document.createElement('div');
      dom.style.position = 'relative';
			dom.dataset.type = this.name;

			for (const [attribute, value] of Object.entries(HTMLAttributes)) {
				dom.setAttribute(attribute, value);
			}

			// const overlay = new TaskListOverlay({
			// 	target: dom,
			// 	props: {
			// 		editor,
			// 		options: this.options,
			// 		getPos,
			// 		attrs: node.attrs,
			// 		dispatch: this.options.dispatch
			// 	}
			// });

			const contentDOM = document.createElement('ul');
			dom.appendChild(contentDOM);

			return {
				dom,
				contentDOM,
				update: (updatedNode) => {
					if (updatedNode.type !== this.type) return false;

					// overlay.$set({
					// 	editor,
					// 	options: this.options,
					// 	getPos,
					// 	attrs: updatedNode.attrs,
					// 	dispatch: this.options.dispatch
					// });

					return true;
				}
			};
		};
	}
});
