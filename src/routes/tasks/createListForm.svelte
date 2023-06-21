<script lang="ts">
	import type { TasksRecord, ListsRecord } from '$lib/db.types';
	import { createId, collectFormData } from '$lib/utils';
	import { EventType, events } from '$lib/modelEvent';
	import { get } from 'svelte/store';
	import { ListsUsersAccessOptions } from '$lib/db.types';
	import { userStore } from '$lib/storage';
	import { z } from 'zod';
	import { createEventDispatcher } from 'svelte';
	import Field from '../../lib/field.svelte';

	const dispatch = createEventDispatcher();
	let zodError;

	const schema = z.object({
		name: z.string().nonempty(`name is required`),
		description: z.string()
	});

	const createTask = collectFormData(async (data, event) => {
		const result = schema.safeParse(data);
		if (!result.success) return (zodError = result.error);
		const payload = {
			...result.data,
			id: createId()
		};

		
		await events.add({ eventType: EventType.Add, modelType: 'lists', payload });
		await events.add({
			eventType: EventType.Add,
			modelType: 'lists_users',
			payload: {
				id: createId(),
				user: get(userStore).record.id,
				list: payload.id,
				access: ListsUsersAccessOptions.admin
			}
		});
		event.target.reset();
		dispatch('submitted');
	});
</script>

<form on:submit|preventDefault={createTask}>
	Create List
	<Field autofocus name="name" label="Name" {zodError} />
	<Field name="description" type="rich" label="Description" {zodError} />
	<button>Create</button>
</form>
