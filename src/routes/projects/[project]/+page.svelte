<script lang="ts">
	import { currentProject, db } from '$lib/storage.js';
	import { createId } from '$lib/utils.js';
	import { liveQuery } from 'dexie';
	import { onMount } from 'svelte';

	export let data;
	let randomId = createId();

	$: currentProject.set(data.projectId);

	$: docs = liveQuery(() => db.docs.where({ project: data.projectId }).toArray());
</script>

Docs
<a href="/projects/{data.projectId}/docs/new">Create Doc</a>
{#if $docs}
	{#each $docs as doc (doc.id)}
		<a href="/projects/{data.projectId}/docs/{doc.id}"> <div>{doc.title}</div></a>
	{/each}
{/if}
