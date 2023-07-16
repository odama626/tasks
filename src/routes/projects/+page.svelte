<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentProject, db } from '$lib/storage';
	import { liveQuery } from 'dexie';

	$: projects = liveQuery(() => db.projects.toCollection().toArray())

	$: console.log($projects)
</script>

{#if $projects}
{#each $projects as project (project.id)}
	<a href='/projects/{project.id}'>
		{project.name}
	</a>
	{/each}
	{/if}