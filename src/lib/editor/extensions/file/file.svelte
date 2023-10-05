<script lang="ts">
	import Document from '$lib/icons/document.svelte';
	import { db } from '$lib/storage';
	import { liveQuery } from 'dexie';
	import filesize from 'file-size';

	export let getPos;
	export let options;
	export let attrs;

	$: file = liveQuery(() => db.doc_attachments.get(attrs?.docAttachment));
	$: console.log({ attrs, $file });

	let size;

	$: size = filesize($file?.size).human('jedec');
</script>

<a
	class="link"
	contenteditable={false}
	style="all: unset; cursor: pointer;"
	rel="noopener noreferrer"
	target="_blank"
	download={$file?.name}
	href={$file?.cache_file}
>
	<div class="container">
		<div style="color: var(--text-5);">
			<Document />
		</div>
		<div class="content">
			<div>{$file?.name}</div>
			<div style="font-weight: 300;">{size}</div>
		</div>
	</div>
</a>

<style lang="scss">
	.link {
		&:focus,
		&:active {
			outline: solid var(--surface-5);
		}
	}

	.container {
		padding: 0.5rem 0.75rem;
    padding-left: 0;
		color: var(--text-3);
		display: inline-flex;
		gap: var(--block-spacing);
	}

	.content {
		flex: 1 1 auto;
    display: flex;
		gap: var(--block-spacing);
	}
</style>
