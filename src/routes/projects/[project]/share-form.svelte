<script lang="ts">
	import { db } from '$lib/storage';
	import {
		Listbox,
		ListboxButton,
		ListboxLabel,
		ListboxOption,
		ListboxOptions
	} from '@rgossiaux/svelte-headlessui';
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
				<Listbox>
					<ListboxButton>{permission.access}</ListboxButton>
					<ListboxOptions>
						{#each options as option}
							<ListboxOption value={option}>{option}</ListboxOption>
						{/each}
					</ListboxOptions>
				</Listbox>
			</div>
		{/each}
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
