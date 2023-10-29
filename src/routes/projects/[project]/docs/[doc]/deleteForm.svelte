<script lang="ts">
	import type { DocsResponse } from '$lib/db.types';
	import { createEventDispatcher } from 'svelte';
	import { deleteDocument } from './deleteDocument';
	import { goto } from '$app/navigation';

	const dispatch = createEventDispatcher();

	export let document: DocsResponse;

	function onDeleteDocument() {
		deleteDocument(document);
		let newUrl = location.href.split('/');
		newUrl.pop();
    newUrl.pop();
		goto(newUrl.join('/'));
	}
</script>

<form class="error" on:submit|preventDefault>
	<h2 class="flex">
		<!-- <ExclamationTriangle /> -->
		<span>Are you sure you want to delete "{document.title}"? </span>
	</h2>
	<p>This item will be deleted immediately. You can't undo this action.</p>
	<div class="modal-buttons">
		<button on:click={() => dispatch('close')} class="ghost">Cancel</button>
		<button on:click={onDeleteDocument}> Delete </button>
	</div>
</form>

<style lang="scss">
	.flex {
		display: flex;
		align-items: center;
		gap: var(--block-spacing);
	}
</style>
