import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

export default CollaborationCursor.extend({
	addOptions() {
		return {
			...this.parent?.(),
			user: {
				name: null,
				color: null,
				backgroundColor: null
			},
			render: (user) => {
				const cursor = document.createElement('span');

				cursor.classList.add('collaboration-cursor__caret');
				cursor.setAttribute('style', `border-color: ${user.color}`);

				const label = document.createElement('div');

				label.classList.add('collaboration-cursor__label');
				label.setAttribute(
					'style',
					`background-color: ${user.backgroundColor}; color: ${user.color}`
				);
				label.insertBefore(document.createTextNode(user.name), null);
				cursor.insertBefore(label, null);

				return cursor;
			}
		};
	}
});
