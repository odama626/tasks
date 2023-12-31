<script lang="ts">
	import { db, userStore } from '$lib/storage';
	import { getStyle } from '$lib/theme';
	import { notificationStore, notify, withKeys } from '$lib/utils';
	import { liveQuery } from 'dexie';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import { navigating } from '$app/stores';
	import { afterNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';

	$: user = liveQuery(() => db.users.get($userStore?.record?.id));
	$: style = getStyle($user);

	onMount(() => {
		const route = localStorage.getItem('current-route');
		if (route && window.location.pathname === '/') {
			localStorage.removeItem('current-route');
			goto(route);
		}
	});

	afterNavigate((navigation) => {
		if (navigation.to.url.pathname === '/') return;
		localStorage.setItem('current-route', navigation.to?.url.href);
	});
</script>

<svelte:head>
	{@html style}
</svelte:head>

<slot />
<div class="tray">
	{#each $notificationStore as notification (notification.id)}
		<div
			in:fly
			animate:flip
			out:fade={{ duration: 200 }}
			on:keypress={withKeys(['Enter', 'Space'], () => notify.dismiss(notification.id))}
			class="notification {notification.type}"
			on:click={() => notify.dismiss(notification.id)}
		>
			<div class="content">
				{#if notification.text}<div>{notification.text}</div>{/if}
				{#if notification.detail}<small>{notification.detail}</small>{/if}
			</div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="icon"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</div>
	{/each}
</div>

<style lang="scss">
	.tray {
		z-index: 100;
		position: fixed;
		bottom: 0;
		pointer-events: none;
		display: flex;
		flex-direction: column-reverse;
		gap: var(--block-spacing);
		margin: var(--block-spacing);
		width: 25ch;
	}

	.notification {
		pointer-events: initial;
		background-color: var(--surface-4);
		padding: 1ch;
		display: flex;
		align-items: center;
		gap: 1ch;
		justify-content: space-between;
		border-radius: 4px;
		cursor: pointer;

		svg {
			color: var(--surface-5);
		}
	}

	@media only screen and (max-width: 480px) {
		.tray {
			right: 0;
			left: 0;
			bottom: 60px;
			margin: auto;
		}
	}
</style>
