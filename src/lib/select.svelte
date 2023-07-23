<script lang="ts">
	import { Listbox, ListboxButton, ListboxOptions } from '@rgossiaux/svelte-headlessui';
	import { createPopperActions } from 'svelte-popperjs';
	import { computePosition, size } from '@floating-ui/dom';

	let containerRef;
	let contentRef;
	let open = false;

	function updatePosition() {
		console.log({ containerRef, contentRef });
		if (!containerRef || !contentRef) return;
		computePosition(containerRef, contentRef, {
			middleware: [
				size({
					apply({ availableWidth, availableHeight, elements }) {
						console.log({ elements });
						const parent = elements.reference.getBoundingClientRect();
						Object.assign(elements.floating.style, {
							width: `${parent.width}px`
						});
					}
				})
			]
		}).then(({ x, y }) => {
			Object.assign(contentRef.style, {
				left: `${x}px`,
				top: `${y}px`
			});
		});
	}
	$: open, updatePosition();
</script>

<div bind:this={containerRef} class="select">
	<Listbox bind:open>
		<ListboxButton style="width: 100%; box-sizing: border-box" on:click={() => (open = !open)}
			><slot name="button" /></ListboxButton
		>
		<div class="options" bind:this={contentRef}>
			<ListboxOptions>
				<slot name="options" />
			</ListboxOptions>
		</div>
	</Listbox>
</div>

<style lang="scss">
	.select .options {
		position: absolute;
		box-sizing: border-box;
		border: 2px solid var(--surface-1);
		border-radius: 4px;
		overflow: hidden;

		:global(> * > *) {
			display: flex;
			flex-direction: column;
			gap: var(--block-spacing);
			background-color: var(--surface-3);

			:global(> *) {
				padding: 0.75rem 1rem;
				&:hover {
					background-color: var(--surface-4);
					cursor: pointer;
				}
			}
		}
	}
	.select :global([aria-expanded='false'] + .options) {
		visibility: hidden;
	}
</style>
