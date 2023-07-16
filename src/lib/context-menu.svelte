<script lang="ts">
	import { Popover, PopoverButton, PopoverPanel } from '@rgossiaux/svelte-headlessui';
	import { createPopperActions } from 'svelte-popperjs';
	import { events } from './modelEvent';

	const [popperRef, popperContent] = createPopperActions();
	export let open;

	const popperOptions = {
		placement: 'bottom-end',
		strategy: 'fixed'
	};
</script>

<Popover bind:open class="popper">
	<PopoverButton class="ghost icon" use={[popperRef]}>
		<slot name="button">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="icon button"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
				/>
			</svg>
		</slot>
	</PopoverButton>
	<PopoverPanel use={[[popperContent, popperOptions]]} class="panel">
		<ul class="menu">
			<slot name="items" />
			<div class="divider" />
			<li class="menu-item">
				<button on:click={events.logout}>Logout</button>
			</li>
		</ul>
	</PopoverPanel>
</Popover>

<style lang="scss">
	:global(.popper) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	ul.menu {
		min-width: 7rem;
		display: flex;
		flex-direction: column;
		align-items: stretch !important;
		background-color: var(--surface-3);

		:global(.menu-item > *) {
			box-sizing: border-box;
			padding: 1rem;
			width: 100%;
		}
	}
</style>
