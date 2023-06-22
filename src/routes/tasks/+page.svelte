<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db, userStore } from '$lib/storage';
	import { EventType, events } from '$lib/modelEvent';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import TaskItem from './task.svelte';
	import { type TasksRecord, type ListsRecord, Collections } from '$lib/db.types';
	import { ListsUsersAccessOptions } from '$lib/db.types';
	import { createId } from '$lib/utils';
	import CreateTaskForm from './createTaskForm.svelte';
	import CreateListForm from './createListForm.svelte';
	import { Shortcuts } from 'shortcuts';
	import { commands } from '$lib/commands';
	import type { Command } from '$lib/commands';
	import { onMount, tick } from 'svelte';
	import { get } from 'svelte/store';

	export let data;
	const { auth } = data;

	events.startSync();

	// TODO Make the mobile menu a draggable sheet https://github.com/ivteplo/bottom-sheet/blob/main/main.js

	const commandProcessor = (command: Command) => (event: KeyboardEvent) => {
		const elementType = document.activeElement?.localName;
		if (elementType && ['input', 'textarea'].includes(elementType)) return;
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

	let lists = liveQuery(() => db.lists.toArray());
	let selectedList: ListsRecord;
	let isHeaderOpen: boolean = false;
	let isCreating: string | undefined = undefined;

	db.users.get(auth.record.id).then(async user => {
		selectedList = await db.lists.get(user.lastVisitedList);
	})

	$: selectedListId = selectedList?.id;
	$: tasks = liveQuery(() =>
		db.tasks.where({ list: selectedListId }).toArray((items) =>
			items.sort((a, b) => {
				if (!!a.completed !== !!b.completed) {
					return !!a.completed - !!b.completed;
				}
				if (!!a.completed && !!b.completed) {
					return new Date(a.completed) < new Date(b.completed) ? 1 : -1;
				}
				return new Date(a.created) < new Date(b.created) ? -1 : 1;
			})
		)
	);

	lists.subscribe((lists) => {
		selectedList = selectedList ?? lists[0];
	});

	async function createList(event) {
		const data = new FormData(event.target);
		const list: ListsRecord = {
			...Object.fromEntries(data.entries()),
			id: createId()
		};

		if (!list.name?.length) return;

		await events.add({ eventType: EventType.Add, modelType: 'lists', payload: list });
		await events.add({
			eventType: EventType.Add,
			modelType: 'lists_users',
			payload: {
				id: createId(),
				user: auth.record.id,
				list: list.id,
				access: ListsUsersAccessOptions.admin
			}
		});

		event.target.reset();
		isCreating = undefined;
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
			<button class="ghost icon">
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
		</article>
	</nav>
	<div class="page">
		<nav class:open={isHeaderOpen} class="sidebar">
			{#if $lists}
				<ul>
					{#each $lists as list (list.id)}
						<li in:slide data-selected={list.id === selectedList?.id}>
							<button
								on:click={() => {
									selectedList = list;
									events.add({
										eventType: EventType.Update,
										modelType: Collections.Users,
										recordId: get(userStore).record.id,
										payload: { lastVisitedList: selectedList.id }
									});
								}}
							>
								{list.name}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<button class="ghost accent" on:click={() => (isCreating = 'list')}>Create new List</button>
		</nav>
		<article>
			<ul>
				{#if $tasks}
					{#each $tasks as task (task.id)}
						<li class="task" animate:flip>
							<TaskItem {task} />
						</li>
					{/each}
				{/if}
				{#if selectedList}
					<li class="inline-create-task">
						<button class="ghost accent" on:click={() => (isCreating = 'task')}>
							Create a new task
						</button>
					</li>
				{:else}
					<li>Create a list to get started</li>
				{/if}
			</ul>
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
						{#if isCreating === 'task'}
							<CreateTaskForm list={selectedList} on:submitted={() => (isCreating = null)} />
						{/if}
						{#if isCreating === 'list'}
							<CreateListForm on:submitted={() => (isCreating = null)} />
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
		ul {
			flex-direction: column;

			li {
				display: flex;
				justify-content: stretch;

				button {
					background-color: transparent;
				}

				&[data-selected='true'],
				&:hover {
					--background-color: var(--surface-4);

					button {
						background-color: var(--background-color);
					}
				}
			}

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
			z-index: 1;
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			background-color: var(--surface-2);
		}
	}
</style>
