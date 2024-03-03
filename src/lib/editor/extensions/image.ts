import TipTapImageExtension from '@tiptap/extension-image';
import { Plugin } from 'prosemirror-state';

export const ImageExtension = TipTapImageExtension.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			docAttachment: {
				default: undefined
			}
		};
	},
	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handleDOMEvents: {
						drop(view, event) {
							const hasFiles =
								event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length;

							if (!hasFiles) {
								return;
							}

							const images = Array.from(event.dataTransfer.files).filter((file) =>
								/image/i.test(file.type)
							);

							if (images.length === 0) {
								return;
							}

							event.preventDefault();

							const { schema } = view.state;
							const coordinates = view.posAtCoords({
								left: event.clientX,
								top: event.clientY
							});

							images.forEach((image) => {
								const reader = new FileReader();

								reader.onload = (readerEvent) => {
									const node = schema.nodes.image.create({
										src: readerEvent.target.result
									});
									const transaction = view.state.tr.insert(coordinates.pos, node);
									view.dispatch(transaction);
								};
								reader.readAsDataURL(image);
							});
						},
						paste(view, event) {
							const hasFiles =
								event.clipboardData &&
								event.clipboardData.files &&
								event.clipboardData.files.length;

							if (!hasFiles) {
								return;
							}

							const images = Array.from(event.clipboardData.files).filter((file) =>
								/image/i.test(file.type)
							);

							if (images.length === 0) {
								return;
							}

							event.preventDefault();

							const { schema } = view.state;

							images.forEach((image) => {
								const reader = new FileReader();

								reader.onload = (readerEvent) => {
									const node = schema.nodes.image.create({
										src: readerEvent.target.result
									});
									const transaction = view.state.tr.replaceSelectionWith(node);
									view.dispatch(transaction);
								};
								reader.readAsDataURL(image);
							});
						}
					}
				}
			})
		];
	}
});
