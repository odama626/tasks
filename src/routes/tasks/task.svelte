<script lang="ts">
	import { db } from '$lib/storage';
	import { EventType, events } from '$lib/modelEvent';
	import { NotificationType, collectFormData, notify } from '$lib/utils';
	import type { TasksRecord } from '$lib/db.types';
	import { onMount } from 'svelte';
	import Field from '../../lib/field.svelte';

	export let task: TasksRecord;
	let isEditing = false;

	async function updateTask(id: string, payload: Partial<TasksRecord>) {
		events.add({
			eventType: EventType.Update,
			recordId: id,
			modelType: 'tasks',
			payload
		});
	}

	async function deleteTask(task: TasksRecord) {
		events.add({
			eventType: EventType.Delete,
			recordId: task.id,
			modelType: 'tasks'
		});
		notify({
			text: `Deleted task`,
			detail: task.name,
			type: 'error'
		});
	}

	async function toggleCompleted(e) {
		e.preventDefault();
		e.stopPropagation();
		const completed = task.completed ? null : new Date().toISOString();
		if (completed) {
			notify({ text: 'Completed Task', detail: task.name, type: NotificationType.Accent })
		}
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
				<div class="flex-align">
					<button style="flex-grow: 1">Update</button>
					<button class="ghost icon error" on:click={() => deleteTask(task)} type="button">
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
								d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
							/>
						</svg>
					</button>
				</div>
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
