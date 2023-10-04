<script lang="ts">
	import { Collections } from '$lib/db.types';
	import Field from '$lib/field.svelte';
	import { events } from '$lib/modelEvent';
	import { db, pb, userStore } from '$lib/storage';
	import { collectFormData, getAttachmentUrl, withKeys } from '$lib/utils';
	import { get } from 'svelte/store';
	import { ZodError, z } from 'zod';
	import Color from 'colorjs.io';
	import Upload from '$lib/icons/upload.svelte';
	import User from '$lib/icons/user.svelte';
	import { liveQuery } from 'dexie';
	import { DEFAULT_ACCENT_HUE, DEFAULT_PRIMARY_HUE } from '$lib/theme';
	import { handleRedirect } from './utils';

	let zodError: ZodError;
	let image;

	$: user = liveQuery(() => db.users.get(get(userStore)?.record?.id));

	const colorRange = Color.range('oklch(67% .31, 0)', 'oklch(67% .31 360)', {
		steps: 360,
		space: 'oklch',
		outputSpace: 'srgb',
		hue: 'longer'
	});

	const gradientStops = Array(360)
		.fill(0)
		.map((_, i) => colorRange(i / 360));

	$: image = getAttachmentUrl($user, 'avatar');

	function getColorFromHue(hue: number) {
		return new Color(`oklch(72%, .25, ${hue})`).to('srgb').toString();
	}


	function goBack() {
		const root = document.querySelector(':root');	
		root?.style.setProperty(`--hue-primary`, $user?.primaryColor || DEFAULT_PRIMARY_HUE);
		root?.style.setProperty(`--hue-accent`, $user?.accentColor || DEFAULT_ACCENT_HUE)
		handleRedirect();
	}

	function onColorChange(palette: string, event: InputEvent) {
		if (!event.target?.value) return;
		const root = document.querySelector(':root');
		event.target.style.setProperty('--value', getColorFromHue(event.target.value));
		root?.style.setProperty(`--hue-${palette}`, event.target.value);
	}

	const schema = z.object({
		name: z.string().nonempty(`name is required`),
		avatar: z.any(),
		primaryColor: z.string(),
		accentColor: z.string()
	});

	const updateUser = collectFormData(async (data, event) => {
		const result = schema.safeParse(data);
		if (!result.success) return (zodError = result.error);
		const payload = {
			...$user,
			...result.data
		};

		await events.update(Collections.Users, $user.id, payload);
		handleRedirect();
	});

	async function updateImage(e) {
		const currentTarget = e.currentTarget;
		const fileInput = currentTarget.querySelector('input[name="avatar"]');

		fileInput.click();

		const file = await new Promise<File>((resolve) =>
			fileInput.addEventListener('change', (e) => resolve(e.target.files[0]))
		);
		image = URL.createObjectURL(file);
	}
</script>

<form on:submit|preventDefault={updateUser} style="--stops:{gradientStops}">
	<div class="row even">
		<div
			on:keypress={withKeys(['Enter', 'Space'], updateImage)}
			class="profile-image"
			on:click={updateImage}
		>
			{#if image}
				<img class="avatar" alt="change user profile" src={image} />
			{:else}
				<div class="profile-image-placeholder">
					<User />
				</div>
			{/if}
			<div class="profile-image-mask">
				<Upload />
			</div>
			<input value={null} type="file" accept="image/*" style="opacity: 0" name="avatar" />
		</div>
		<div><Field label="Name" value={$user?.name} name="name" {zodError} /></div>
	</div>
	<fieldset>
		<legend>Color Theme</legend>
		<div class="row even">
			<div style="--value: {getColorFromHue($user?.primaryColor || DEFAULT_PRIMARY_HUE)}">
				<Field
					on:input={(e) => onColorChange('primary', e)}
					label="Primary"
					min={0}
					max={360}
					type="range"
					class="color"
					name="primaryColor"
					value={$user?.primaryColor || DEFAULT_PRIMARY_HUE}
					{zodError}
				/>
			</div>
			<div style="--value: {getColorFromHue($user?.accentColor || DEFAULT_ACCENT_HUE)}">
				<Field
					on:input={(e) => onColorChange('accent', e)}
					min={0}
					max={360}
					class="color"
					label="Secondary"
					type="range"
					name="accentColor"
					value={$user?.accentColor || DEFAULT_ACCENT_HUE}
					{zodError}
				/>
			</div>
		</div>
	</fieldset>
	<div class="row" style="justify-content: end; flex-direction: row;">
		<button type="button" class="accent ghost" on:click={goBack}>Go Back</button>
		<button>Save Changes</button>
	</div>
</form>

<style lang="scss">
	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.row.even {
		> * {
			flex: 1 1 1px;
		}
	}

	.profile-image {
		position: relative;
		--svg-size: 25px;
		cursor: pointer;

		&:hover,
		&:active {
			.profile-image-mask {
				opacity: 100%;
			}
		}
	}

	.profile-image-placeholder {
		position: absolute;
		inset: 0;
		--svg-size: 50px;
		display: flex;
		justify-content: center;
		align-items: center;
		pointer-events: none;
		color: var(--surface-5);
	}

	.profile-image-mask {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		inset: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--surface-5);
		backdrop-filter: blur(5px);
		transition: opacity ease-in-out 250ms;
		will-change: opacity;
		background-color: color-mix(in oklch, var(--surface-1) 40%, transparent);
	}

	@media only screen and (max-width: 480px) {
		.row {
			flex-direction: column;

			.profile-image {
				align-self: center;
				--profile-image-size: 200px;
				--svg-size: 50px;
				flex-basis: var(--profile-image-size);
			}
			.profile-image-placeholder {
				--svg-size: 150px;
			}
		}
	}

	:global(input[type='range'].color) {
		&::-webkit-slider-runnable-track {
			background: linear-gradient(to right, var(--stops));
		}
		&::-moz-range-track {
			background: linear-gradient(to right, var(--stops));
		}

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			width: 18px;
			height: 18px;
			border-radius: 10px;
			background: var(--value);
		}

		&::-moz-range-thumb {
			background: var(--value);
		}
	}
</style>
