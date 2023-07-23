<script lang="ts">
	import { events } from '$lib/modelEvent';
	import Select from '$lib/select.svelte';
	import { db } from '$lib/storage';
	import { collectFormData, withKeys } from '$lib/utils';
	import { ListboxOption } from '@rgossiaux/svelte-headlessui';
	import { liveQuery } from 'dexie';

	export let projectId: string;
	$: permissions = liveQuery(() => db.projects_users.where({ project: projectId }).toArray());
	$: users = liveQuery(() => db.users.toCollection().toArray());

	let options = ['admin', 'editor', 'viewer'];

	const createInvite = collectFormData(async (data, event) => {
		console.log({ data });
	});
</script>

<div
	class="form"
	on:click={(e) => e.stopPropagation()}
	on:keypress={withKeys(['Enter', 'Space'], (e) => {})}
>
	<p>Invite</p>
	<form on:submit|preventDefault={createInvite}>
		<div class="input-group">
			<input name="user" placeholder="username or email" />
			<Select>
				{#each options as option}
					<option value={option}>{option}</option>
				{/each}
			</Select>
		</div>
		<button class="outline">Invite</button>
	</form>
	<div class="divider horizontal" />
	{#if $permissions}
		<div class="permissions">
			{#each $permissions as permission (permission.id)}
				{@const user = $users.find((user) => user.id === permission.user)}
				<div class="name">
					{user?.name || user?.username}
				</div>
				<Select class="ghost" name="access" value={permission.access}>
					{#each options as option}
						<option value={option}>{option}</option>
					{/each}
				</Select>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.permissions {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--block-spacing);
	}
	.form {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--block-spacing);
	}

	button.outline {
		text-align: center;
	}

	form {
		display: flex;
		flex-direction: row;

		@media only screen and (max-width: 480px) {
			flex-direction: column;

			.input-group {
				flex-direction: column;
				display: contents;
			}
		}
	}

	.name,
	.access {
		align-self: center;
	}
</style>
