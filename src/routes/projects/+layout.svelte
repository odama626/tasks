<script lang="ts">
	import { liveQuery } from 'dexie';
	import { currentProject, db, pb, userStore } from '$lib/storage';
	import { EventType, events } from '$lib/modelEvent';
	import { slide } from 'svelte/transition';
	import { Collections } from '$lib/db.types';
	import { createId, withKeys } from '$lib/utils';
	import { Shortcuts } from 'shortcuts';
	import { commands } from '$lib/commands';
	import type { Command } from '$lib/commands';
	import { onMount, tick } from 'svelte';
	import CreateProjectForm from './createProjectForm.svelte';
	import '$lib/styles.scss';
	import { clickOutside } from '$lib/clickOutside';

	export let data;
	const { auth } = data;

	events.startSync();

	// TODO Make the mobile menu a draggable sheet https://github.com/ivteplo/bottom-sheet/blob/main/main.js

	const commandProcessor = (command: Command) => (event: KeyboardEvent) => {
		const elementType = document.activeElement?.localName;
		if (
			(elementType && ['input', 'textarea'].includes(elementType)) ||
			document.activeElement?.contentEditable
		)
			return;
		switch (command.action) {
			case 'task:create':
				isCreating = 'task';
				break;
			case 'list:create':
				isCreating = 'list';
				break;
			default:
				console.error('unrecognized shortcut', { command, event });
		}
		event.preventDefault();
	};

	onMount(() => {
		const shortcuts = new Shortcuts();

		commands.forEach((command) => {
			shortcuts.add({ shortcut: command.shortcut, handler: commandProcessor(command) });
		});
	});

	let projects = liveQuery(() => db.projects.toArray());
	let isHeaderOpen: boolean = false;
	let isContextMenuOpen = false;
	let isCreating: string | undefined = undefined;

	async function logout() {
		localStorage.clear();
		db.delete();
		pb.authStore.clear();
		location.reload();
	}
</script>

<div class="document">
	<nav class="header">
		<ul>
			<li>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="icon"
					on:click={() => (isHeaderOpen = !isHeaderOpen)}
					id="header-button"
					on:keypress={withKeys(['Enter', 'Space'], () => (isHeaderOpen = !isHeaderOpen))}
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			</li>
			<li>Header</li>
		</ul>
		<article style="display: flex; justify-content: flex-end;">
			<div class="header-context-portal" />
			<div
				class="context-container select"
				use:clickOutside={() => {
					isContextMenuOpen = false;
				}}
			>
				<button
					aria-expanded={isContextMenuOpen}
					class="ghost icon"
					on:click={() => (isContextMenuOpen = !isContextMenuOpen)}
				>
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
				</button>
				{#if isContextMenuOpen}
					<ul class="context-menu">
						<li><button on:click={logout}>Logout</button></li>
					</ul>
				{/if}
			</div>
		</article>
	</nav>
	<div class="page">
		<nav
			class:open={isHeaderOpen}
			on:click={(e) => {
				if (['A', 'BUTTON'].includes(e.target.tagName)) isHeaderOpen = false;
			}}
			use:clickOutside={(e) => {
				if (!isHeaderOpen || e.target.id === 'header-button') return;
				isHeaderOpen = false;
			}}
			class="sidebar"
		>
			<ul>
				<li><button>Home</button></li>
			</ul>
			<br />
			<h1>Projects</h1>
			{#if $projects}
				<ul>
					{#each $projects as project (project.id)}
						<li in:slide data-selected={project.id === $currentProject}>
							<a class="list-item button" href="/projects/{project.id}">
								{project.name}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
			<button class="ghost accent" on:click={() => (isCreating = Collections.Projects)}>
				Create new Project
			</button>
		</nav>
		<article>
			<slot>
				<ul>
					<li>Create a new Project to get started</li>
				</ul>
			</slot>
			{#if isCreating}
				<div
					on:click={(e) => {
						if (e.target === e.currentTarget) isCreating = undefined;
					}}
					on:keyup={(e) => {
						if (e.code === 'Escape') isCreating = undefined;
					}}
					class="modal-shade"
				>
					<div class="modal">
						{#if isCreating === Collections.Projects}
							<CreateProjectForm on:submitted={() => (isCreating = null)} />
						{/if}
					</div>
				</div>
			{/if}
		</article>
	</div>
</div>

<style lang="scss">
	.document {
		display: flex;
		flex-direction: column;
		height: 100dvh;
	}

	.context-container {
		position: relative;
		display: flex;
	}

	.context-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin: 0;
	}

	.inline-create-task {
		display: flex;
		flex-direction: row;
		gap: var(--block-spacing);
	}

	.header {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 5rem;
		padding: 1ch;
		ul {
			align-items: center;
		}
	}

	.page {
		flex-grow: 1;
		overflow: auto;
		display: grid;
		gap: 5rem;
		padding: 0 1ch;
		grid-template-columns: 200px 1fr;
		grid-template-areas: 'sidebar content';
	}

	:root {
		--element-spacing: 0.25rem;
	}

	nav.sidebar {
		grid-area: 'sidebar';
		background-color: var(--surface-2);

		h1 {
			padding: 0.75rem 1rem;
			margin: 0;
			font-size: 1.25rem;
		}
		ul {
			flex-direction: column;

			li {
				display: flex;
				justify-content: stretch;

				.list-item {
					background-color: transparent;
				}

				&[data-selected='true'],
				&:hover {
					--background-color: var(--surface-4);

					.list-item {
						background-color: var(--background-color);
					}
				}
			}

			.button,
			button {
				width: 100%;
			}
		}
	}

	article {
		grid-area: 'content';
		width: 100%;
		max-width: 80ch;
		margin: 0 auto;
		ul {
			padding: 0;
			display: flex;
			gap: 1rem;
			flex-direction: column;
			li {
				list-style-type: none;
				label {
					display: flex;
					gap: 0.5rem;
				}
			}
		}
	}

	@media only screen and (max-width: 480px) {
		.page {
			grid-template-columns: 1fr;
			grid-template-areas: 'content';
		}

		nav.sidebar {
			z-index: 10;
			position: fixed;
			bottom: -85%;
			left: 0;
			right: 0;
			margin: auto;
			width: calc(100% - 2ch);
			height: 85%;
			transition: bottom ease-in-out 250ms;

			&.open {
				bottom: 0%;
			}
		}

		.document {
			flex-direction: column-reverse;
		}
		.header {
			gap: 0;
			z-index: 11;
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			background-color: var(--surface-2);
		}

		.context-menu {
			top: auto;
			bottom: 100%;
		}
	}
</style>
