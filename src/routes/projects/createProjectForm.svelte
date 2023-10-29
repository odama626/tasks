<script lang="ts">
	import { Collections } from '$lib/db.types';
	import Field from '$lib/field.svelte';
	import { events } from '$lib/modelEvent';
	import { RecordAccess, userStore } from '$lib/storage';
	import { collectFormData, createId } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { z, type ZodError } from 'zod';

	const dispatch = createEventDispatcher();
	let zodError: ZodError;

	const schema = z.object({
		name: z.string().nonempty('name is required')
	});

	const createRecord = collectFormData(async (data, event) => {
		const result = schema.safeParse(data);
		const user = get(userStore).record;

		if (!result.success) return (zodError = result.error);
		const payload = {
			...result.data,
			createdBy: user.id,
			id: createId()
		};

		await events.create(Collections.Projects, payload);
		await events.create(Collections.ProjectsUsers, {
			id: createId(),
			user: user.id,
			project: payload.id,
			access: RecordAccess.Admin
		});

		event.target.reset();
		dispatch('submitted');
	});
</script>

<form on:submit|preventDefault={createRecord}>
	<p>Create Project</p>
	<Field autofocus name="name" label="Name" {zodError} />
	<button>Create</button>
</form>
