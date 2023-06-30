<script lang="ts">
	export let items;
	export let command;

	export function onKeyDown(props) {
		console.log(props);
		switch (props.event.code) {
			case 'ArrowDown':
				selectedIndex = (selectedIndex + 1) % items.length;
				return true;
			case 'ArrowUp':
				selectedIndex = (selectedIndex + items.length - 1) % items.length;
				return true;

			case 'Enter':
				command(items[selectedIndex]);
				return true;
		}
	}

	console.log($$restProps, { items });

	let selectedIndex = 0;
</script>

<div class="container">
	{#each items as item, i (i)}
		<button
			on:click={() => command(item)}
			class="option ghost"
			class:selected={i === selectedIndex}
		>
			{item.title}
		</button>
	{/each}
</div>

<style lang="scss">
	.container {
		background-color: var(--surface-4);
		color: var(--text-1);
		display: flex;
		flex-direction: column;
		min-width: 15ch;

		button {
			color: var(--text-2);

			&.selected {
				background-color: var(--surface-5);
				color: var(--text-1);
			}
		}
	}
</style>
