<svelte:options customElement="custom-link" />

<script lang="ts">
	export let href;

	const metadataPromise = fetch(`/api/urlmeta?url=${href}`).then((r) => r.json());
</script>

<a {...$$props}>
	<slot />
	{#await metadataPromise then metadata}
		{@const title = metadata.title ?? metadata.description}
		{#if title}
			<div class="preview">
				{#if metadata.image.url}<img src={metadata.image.url} /> {/if}
				<div class="content">
					{title ?? ''}
				</div>
			</div>
		{/if}
	{/await}
</a>

<style lang="scss">
	a {
		color: var(--text-3);
		text-decoration: none;
		overflow-wrap: break-word;
		word-break: break-all;

		&[href*="//"]
		{
			box-shadow: 0px 1px 0px var(--text-3);
			line-height: 1.4;
		}
		&:hover {
			cursor: pointer;
		}
	}

	img {
		object-fit: cover;
		height: 100%;
	}

	.preview {
		all: unset;
		color: var(--text-1);
		text-decoration: none;
		margin-top: 1rem;
		border: 1px solid;
		border-radius: 4px;
		display: flex;
		flex-direction: row;
		height: 6rem;
		// gap: calc(var(--block-spacing) * 2);
		overflow: hidden;
	}

	.content {
		padding: calc(2 * var(--block-spacing));
		align-self: center;
		word-break: break-word;
		text-overflow: ellipsis;
	}
</style>
