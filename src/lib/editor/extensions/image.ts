import TipTapImageExtension from '@tiptap/extension-image';

export const ImageExtension = TipTapImageExtension.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			docAttachment: {
				default: undefined
			}
		};
	}
});
