<script lang="ts">
	import { db } from '$lib/storage';
	import { EventType, events } from '$lib/modelEvent';
	import { collectFormData } from '$lib/utils';
	import type { TasksRecord } from '$lib/db.types';
	import { onMount } from 'svelte';
	import Field from '../../lib/field.svelte';

	export let task: TasksRecord;
	let isEditing = false;

	async function updateTask(id: string, payload: Partial<TasksRecord>) {
		const { ...rest } = task;
		events.add({
			eventType: EventType.Update,
			recordId: id,
			modelType: 'tasks',
			payload: { ...task, ...payload }
		});
	}

	async function toggleCompleted(e) {
		e.preventDefault();
		e.stopPropagation();
		const { id, ...rest } = task;
		const completed = task.completed ? null : new Date().toISOString();
		updateTask(task.id, { completed });
	}

	async function handleKeypress(e) {
		switch (e.code) {
			case 'Space':
				return toggleCompleted(e);
			case 'Enter':
				return (isEditing = true);
		}
	}
</script>

<div data-completed={!!task.completed}>
	<article on:keypress={handleKeypress} on:click={() => (isEditing = true)}>
		<input
			on:change={(e) => updateTask(task.id, { completed: !!e.target.checked })}
			type="checkbox"
			value={task.completed}
			name="completed"
		/>
		<svg
			on:keypress={handleKeypress}
			on:click={toggleCompleted}
			class="icon button checkbox"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
		>
			<path
				class="checked"
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
			<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>

		<detail>
			{task.name}
		</detail>
		<aside>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="icon-button"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
				/>
			</svg>
		</aside>
	</article>
	{#if task.body}
		<article>
			<div class="checkbox-spacer" />
			<small>
				{task.body}
			</small>
		</article>
	{/if}
</div>
{#if isEditing}
	<div
		class="modal-shade"
		on:click={(e) => {
			if (e.target === e.currentTarget) isEditing = false;
		}}
		on:keyup={(e) => {
			if (e.code === 'Escape') isEditing = false;
		}}
	>
		<div class="modal">
			<form
				on:submit|preventDefault={collectFormData(async (payload) => {
					await updateTask(task.id, payload);
					isEditing = false;
				})}
			>
				Edit Task
				<Field autofocus label="Name" name="name" value={task.name} />
				<Field type="rich" label="Body" name="body" value={task.body} />
				<button>Update</button>
			</form>
		</div>
	</div>
{/if}

<style lang="scss">
	article {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--block-spacing);

		small {
			color: var(--text-3);
		}
	}

	detail {
		flex-grow: 1;
	}

	aside {
		visibility: hidden;
	}

	article:hover {
		aside {
			visibility: visible;
		}

		.checkbox {
			.checked {
				color: var(--text-6);
				visibility: visible;
			}
		}
	}

	.checkbox {
		.checked {
			visibility: hidden;
			color: var(--text-4);
		}
	}

	[data-completed='true'] article .checkbox .checked {
		visibility: visible;
		color: var(--text-4);
	}

	.checkbox-spacer {
		width: 24px;
	}
</style>
