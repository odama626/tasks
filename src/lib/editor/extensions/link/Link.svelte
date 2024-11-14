<svelte:options customElement="custom-link" />

<script lang="ts">
	import ExternalLink from '$lib/icons/external-link.svelte';
	import { db } from '$lib/storage';

	export let href;
	let metadata;

	async function getMetadata(href: string) {
		console.log({ href });
		try {
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
			const payload = await fetch(`/api/urlmeta?url=${href}`).then((r) => r.json());
			db.link_metadata.add(href, payload);
			sessionStorage.setItem(href, JSON.stringify(payload));
			metadata = payload;
		} catch (e) {
			console.error(e);
		}
	}

	$: href, getMetadata(href);
	getMetadata(href);
</script>

<div class="a container">
	<slot />
	{#if metadata?.title || metadata?.description}
		<a {...$$props}>
			<div
				contenteditable="false"
				class="preview"
				class:hascontent={metadata?.title || metadata?.description}
			>
				<div class="content">
					<div>{metadata.title ?? ''}</div>
					<div class="a url">
						{#if metadata.favicon}<img class="favicon" src={metadata.favicon} />{/if}
					</div>
				</div>
				{#if metadata.imageUrl}<img class="large" src={metadata.imageUrl} /> {/if}
			</div>
		</a>
	{/if}
</div>

<style lang="scss">
	a,
	.a {
		color: var(--text-3);
		text-decoration: none;
		overflow-wrap: break-word;
		word-break: break-all;
		gap: var(--block-spacing);

		&[href*="//"]
		{
			// box-shadow: 0px 1px 0px var(--text-3);
			line-height: 1.4;
		}
		&:hover {
			cursor: pointer;
		}
	}

	.url {
		display: flex;
	}

	.container {
		width: 100%;
		> a {
			width: 100%;
		}
	}

	img.favicon {
		width: 20px;
		height: 20px;
	}

	img.large {
		object-fit: contain;
		height: 100%;
	}

	.preview {
		all: unset;
		width: 100%;
		--padding: calc(2 * var(--block-spacing));
		display: inline-block;
		color: var(--text-1);
		text-decoration: none;
		display: flex;
		flex-direction: row;
		align-items: center;
		overflow: hidden;
		gap: var(--block-spacing);

		height: 6rem;
		margin-top: 1rem;
		border: 1px solid;
		border-radius: 4px;

		&:not(.hascontent) {
			display: inline-flex;
			align-items: center;
		}
	}

	@media only screen and (max-width: 480px) {
		.preview {
			flex-direction: column;
			height: auto;

			.content {
				flex-direction: column;
			}
		}

		img.large {
			width: 100%;
			height: auto;
		}
	}

	.preview.hascontent > :not(img) {
		padding: var(--padding);
		box-sizing: border-box;
	}

	.content {
		align-self: flex-start;
		word-break: break-word;
		height: 100%;
		text-overflow: ellipsis;
		padding: 0 calc(2 * var(--block-spacing));
		display: flex;
		justify-content: space-between;
		flex-direction: column;
		flex: 2 1 auto;

		flex-grow: 1;
	}

	.description {
		flex-shrink: 1;
	}
</style>
