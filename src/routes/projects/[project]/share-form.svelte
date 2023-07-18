<script lang="ts">
	import { db } from '$lib/storage';
	import { liveQuery } from 'dexie';

	export let projectId: string;
	$: permissions = liveQuery(() => db.projects_users.where({ project: projectId }).toArray());
	$: users = liveQuery(() => db.users.toCollection().toArray());
</script>

{#if $permissions}
	{#each $permissions as permission (permission.id)}
		{@const user = $users.find((user) => user.id === permission.user)}
		<div>
			{user?.name || user?.username}
			{permission.access}
		</div>
	{/each}
{/if}
