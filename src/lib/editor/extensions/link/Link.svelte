<svelte:options customElement="custom-link" />

<script lang="ts">
	import ExternalLink from '$lib/icons/external-link.svelte';
	import { db } from '$lib/storage';

	export let href;
	let metadata;

	async function getMetadata(href: string) {
		let storage = sessionStorage.getItem(href);
		if (storage) {
			metadata = JSON.parse(storage);
			return;
		}
		let result = await db.link_metadata.get(href);
		if (result) {
			metadata = result;
			sessionStorage.setItem(href, JSON.stringify(result));
			return;
		}
		const payload = await fetch(`/api/urlmeta?url=${href}`, { cache: 'force-cache' }).then((r) =>
			r.json()
		);
		db.link_metadata.add(href, payload);
		sessionStorage.setItem(href, JSON.stringify(payload));
		metadata = payload;
	}
	$: href, getMetadata(href);
</script>

<span class="a">
	<slot />
	<a {...$$props}>
		<div contenteditable="false" class="preview" class:hascontent={!!metadata}>
			{#if metadata}
				{@const title = metadata.title ?? metadata.description}
				{#if title}
					{#if metadata.imageUrl}<img src={metadata.imageUrl} /> {/if}
					<div class="content">
						{title ?? ''}
					</div>
				{/if}
			{/if}
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
		--padding: calc(2 * var(--block-spacing));
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
			// padding: calc(2 * var(--block-spacing));
			border: 1px solid;
			border-radius: 4px;
		}

		&:not(.hascontent) {
			display: inline-flex;
			align-items: center;
		}
	}

	.preview.hascontent > :not(img) {
		padding: 0 var(--padding);
	}

	.preview.hascontent > :global(:last-child) {
		margin-right: var(--padding);
	}

	.content {
		align-self: center;
		word-break: break-word;
		text-overflow: ellipsis;
		padding: 0 calc(2 * var(--block-spacing));
		flex-grow: 1;
	}
</style>
