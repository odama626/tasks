<script lang="ts">
	import { db } from '$lib/storage';
	import { liveQuery } from 'dexie';
	import Portal from 'svelte-portal';
	import ContextMenu from '$lib/context-menu.svelte';

	$: projects = liveQuery(() => db.projects.toCollection().toArray());

	$: console.log($projects);
</script>

<Portal target=".header-context-portal">
	<div class="header-portal-items">
		<ContextMenu />
	</div>
</Portal>

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
