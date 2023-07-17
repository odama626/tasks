<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentProject, db } from '$lib/storage';
	import { liveQuery } from 'dexie';

	$: projects = liveQuery(() => db.projects.toCollection().toArray());

	$: console.log($projects);
</script>

{#if $projects}
	<h2>Projects</h2>
	<div class="projects">
		{#each $projects as project (project.id)}
			<a class="button" href="/projects/{project.id}">
				{project.name}
			</a>
		{/each}
	</div>
{/if}

<style lang="scss">
	.projects {
		display: flex;
		flex-direction: column;
		gap: var(--block-spacing);
	}
</style>
