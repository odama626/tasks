<script lang="ts">
	import { autoUpdate, computePosition } from '@floating-ui/dom';
	import { onMount } from 'svelte';

	let targetRef: HTMLElement;
	let contentRef: HTMLElement;

	async function updatePos() {
		const { x, y } = await computePosition(targetRef, contentRef, { placement: 'bottom' });
		Object.assign(contentRef.style, {
			left: `${x}px`,
			top: `${y + 5}px`
		});
	}

	onMount(() => {
		updatePos();
		const cleanup = autoUpdate(targetRef, contentRef, updatePos);
		return () => cleanup();
	});
</script>

<div class="container">
	<div bind:this={targetRef} tabindex="-1" class="target">
		<slot name="content" />
	</div>
	<div bind:this={contentRef} class="content">
		<slot name="tooltip" />
	</div>
</div>

<style lang="scss">
	.container {
		position: relative;
	}

	.target {
	}

	.target:hover,
	.target:focus {
		+ .content {
			visibility: visible;
		}
	}

	.content {
		position: absolute;
		pointer-events: none;
		visibility: hidden;
		background-color: var(--surface-7);
		color: var(--text-9);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		z-index: 1;

		&:before {
			content: '';
			z-index: -1;
			position: absolute;
			--size: 16px;
			border-radius: 4px;
			width: var(--size);
			height: var(--size);
			transform: translate(-50%, -50%) rotate(45deg);
			left: 50%;
			background-color: inherit;
		}
	}
</style>
