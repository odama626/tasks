import TiptapLink from '@tiptap/extension-link';
import LinkElement from './Link.svelte';
import { mergeAttributes } from '@tiptap/core';

export const Link = TiptapLink.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			meta: {
				default: null
			}
		};
	},

	renderHTML({ HTMLAttributes }) {
		if (HTMLAttributes.href?.startsWith('javascript:')) {
			// strip out the href
			return [
				'custom-link',
				mergeAttributes(this.options.HTMLAttributes, { ...HTMLAttributes, href: '' }),
				0
			];
		}
		return ['custom-link', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	}
});
