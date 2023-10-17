<script lang="ts">
	import type { Editor } from '@tiptap/core';

	export let editor: Editor;
	export let options;
	export let getPos;
	export let id;

	export let checked: boolean;
	export let doc: string;
	export let project: string;
	export let attrs;
	export let dispatch;

	export let contentRef;

	function onChange(event) {
		event.preventDefault();
		if (!editor.isEditable && !options.onReadOnlyChecked) {
			if (options.isOverview) {
				checked = !checked;
				dispatch('taskItemUpdate', { options, attrs, checked });
			}
			return;
		}
		if (editor.isEditable && typeof getPos == 'function') {
			const position = getPos();
			editor
				.chain()
				.focus(position, { scrollIntoView: false })
				.command(({ tr }) => {
				const currentNode = tr.doc.nodeAt(position);
					checked = !checked;
					tr.setNodeMarkup(position, undefined, { ...currentNode?.attrs, checked });
				})
				.run();

			dispatch('taskItemUpdate', { options, attrs, checked });
			return true;
		}
		if (!options.isEditable && options.onReadOnlyChecked) {
			if (options.onReadOnlyChecked(node, checked)) {
				checked = !checked;
			}
		}

		dispatch('taskItemUpdate', { options, attrs, checked });
	}
</script>

<label contenteditable="false" data-checked={checked}>
	<input value={checked} on:click={onChange} type="checkbox" />

	<svg
		class="icon button checkbox"
		width="14"
		height="14"
		viewBox="0 0 14 14"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M0.129898 3.21191C0.129898 1.96927 1.13726 0.961914 2.3799 0.961914H10.8799C12.1225 0.961914 13.1299 1.96927 13.1299 3.21191L13.1299 11.7119C13.1299 12.9546 12.1225 13.9619 10.8799 13.9619H2.3799C1.13726 13.9619 0.129898 12.9546 0.129898 11.7119V3.21191ZM1.63377 3.13523C1.67218 2.75704 1.99157 2.46191 2.3799 2.46191L10.8799 2.46191C11.2941 2.46191 11.6299 2.7977 11.6299 3.21191L11.6299 11.7119C11.6299 12.1261 11.2941 12.4619 10.8799 12.4619H2.3799C1.96568 12.4619 1.6299 12.1261 1.6299 11.7119V3.21191C1.6299 3.18603 1.63121 3.16044 1.63377 3.13523Z"
			fill="currentColor"
		/>
		<path
			class="checked"
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M9.79967 3.80681C10.0323 3.50153 10.4683 3.4426 10.7736 3.6752C11.0789 3.9078 11.1378 4.34384 10.9052 4.64912L6.15934 10.8781C6.03781 11.0376 5.85329 11.1368 5.65321 11.1503C5.45313 11.1637 5.25698 11.0901 5.11519 10.9483L2.44563 8.27876C2.17425 8.00737 2.17425 7.56737 2.44563 7.29598C2.71702 7.0246 3.15702 7.0246 3.42841 7.29598L5.5357 9.40328L9.79967 3.80681Z"
			fill="currentColor"
		/>
	</svg>
	<span bind:this={contentRef} />
</label>

<style lang="scss">
	.checkbox:hover {
	}
	.checkbox {
		.checked {
			visibility: hidden;
			color: var(--text-4);
		}
	}

	label {
		margin: 0;
	}

	[data-checked='true'] > .checkbox .checked,
	input:checked + .checkbox .checked {
		visibility: visible;
		color: var(--text-4);
	}
</style>
