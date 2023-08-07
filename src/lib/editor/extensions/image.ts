import TipTapImageExtension from '@tiptap/extension-image';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		image: {
			/**
			 * Add an image
			 */
			uploadImage: (options: { file: File }) => ReturnType;
		};
	}
}

export const ImageExtension = TipTapImageExtension.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			docAttachment: {
				default: undefined
			}
		};
	},
	addCommands() {
		return {
			...this.parent?.(),
			uploadImage:
				({ file }) =>
				async ({ state, dispatch, commands }) => {
					const image = new Image();
					image.src = URL.createObjectURL(file);
					await new Promise((resolve) => (image.onload = resolve));
					console.log({ state });
					console.log(image.src);
					// commands.insertContent({ type: this.name, attrs: { src: image.src } });
					const node = this.type.create({ src: image.src });
					const transaction = state.tr.replaceSelectionWith(node);
					console.log({ transaction });
					state.applyTransaction(transaction);
					dispatch(transaction);

					return true;
				}
		};
	}
});
