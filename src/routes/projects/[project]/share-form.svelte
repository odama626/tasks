<script lang="ts">
	import { db } from "$lib/storage";
	import { liveQuery } from "dexie";

	export let projectId: string;
	$: permissions = liveQuery(() => db.projects_users.where({ project: projectId }).toArray());
</script>

{#if $permissions}
{#each $permissions as permission (permission.id)}
	<div>
		{permission.user}
		{permission.access}
	</div>
{/each}
{/if}