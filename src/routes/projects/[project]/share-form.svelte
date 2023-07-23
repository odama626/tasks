<script lang="ts">
	import Select from '$lib/select.svelte';
	import { db } from '$lib/storage';
	import { ListboxOption } from '@rgossiaux/svelte-headlessui';
	import { liveQuery } from 'dexie';

	export let projectId: string;
	$: permissions = liveQuery(() => db.projects_users.where({ project: projectId }).toArray());
	$: users = liveQuery(() => db.users.toCollection().toArray());

	let options = ['admin', 'editor', 'viewer'];
</script>

{#if $permissions}
	<div class="permissions" on:click={(e) => e.stopPropagation()}>
		{#each $permissions as permission (permission.id)}
			{@const user = $users.find((user) => user.id === permission.user)}
			<div class="name">
				{user?.name || user?.username}
			</div>
			<div class="access">
				<Select value={permission.access}>
					<div slot="button">{permission.access}</div>
					<div slot="options">
						{#each options as option}
							<ListboxOption value={option}>{option}</ListboxOption>
						{/each}
					</div>
				</Select>
			</div>
		{/each}
		<p>Add</p>
		<p />
		<input />
		<Select>
			<div slot="button">viewer</div>
			<div slot="options">
				{#each options as option}
					<ListboxOption value={option}>{option}</ListboxOption>
				{/each}
			</div>
		</Select>
	</div>
{/if}

<style lang="scss">
	.permissions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--block-spacing);
	}

	.name,
	.access {
		align-self: center;
	}
</style>
