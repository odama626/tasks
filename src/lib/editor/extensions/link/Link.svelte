<svelte:options customElement="custom-link" />

<script lang="ts">
	import ExternalLink from '$lib/icons/external-link.svelte';
	export let href;

	const metadataPromise = fetch(`/api/urlmeta?url=${href}`).then((r) => r.json());

	let hascontent;
	metadataPromise.then((data) => {
		hascontent = data.title || data.description;
	});
</script>

<span class="a">
	<slot />
	<a {...$$props}>
		<div contenteditable="false" class="preview" class:hascontent>
			{#await metadataPromise then metadata}
				{@const title = metadata.title ?? metadata.description}
				{#if title}
					{#if metadata.image.url}<img src={metadata.image.url} /> {/if}
					<div class="content">
						{title ?? ''}
					</div>
				{/if}
			{/await}
			<ExternalLink />
		</div>
	</a>
</span>

<style lang="scss">
	a,
	.a {
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
		display: inline-block;
		all: unset;
		color: var(--text-1);
		text-decoration: none;
		display: flex;
		flex-direction: row;
		align-items: center;
		overflow: hidden;
		gap: var(--block-spacing);

		&.hascontent {
			height: 6rem;
			margin-top: 1rem;
			padding: calc(2 * var(--block-spacing));
			border: 1px solid;
			border-radius: 4px;
		}

		&:not(.hascontent) {
			display: inline-flex;
			align-items: center;
		}
	}

	.content {
		align-self: center;
		word-break: break-word;
		text-overflow: ellipsis;
		flex-grow: 1;
	}
</style>
