<script lang="ts">
	import type { TasksRecord, ListsRecord } from '$lib/db.types';
	import { createId, collectFormData } from '$lib/utils';
	import { EventType, events } from '$lib/modelEvent';
	import { get } from 'svelte/store';
	import { userStore } from '$lib/storage';
	import { z } from 'zod';
	import { createEventDispatcher } from 'svelte';
	import Field from '../../lib/field.svelte';

	const dispatch = createEventDispatcher();
	export let list: ListsRecord;
	let zodError;

	const schema = z.object({
		name: z.string().nonempty(`name is required`),
		body: z.string()
	});

	const createTask = collectFormData(async (data, event) => {
		const result = schema.safeParse(data);
		if (!result.success) return (zodError = result.error);
		const payload = {
			...result.data,
			id: createId(),
			created: new Date().toISOString(),
			list: list.id,
			createdBy: get(userStore).record.id
		};
		await events.add({ eventType: EventType.Add, modelType: 'tasks', payload });
		event.target.reset();
		dispatch('submitted');
	});
</script>

<form on:submit|preventDefault={createTask}>
	Create Task
	<Field name="name" autofocus label="Name" {zodError} />
	<Field name="body" type="rich" label="Body" {zodError} />
	<button>Create</button>
</form>
