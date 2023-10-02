<script lang="ts">
	import { Collections } from '$lib/db.types';
	import Field from '$lib/field.svelte';
	import { events } from '$lib/modelEvent';
	import { pb, userStore } from '$lib/storage';
	import { collectFormData } from '$lib/utils';
	import { get } from 'svelte/store';
	import { ZodError, z } from 'zod';
	import Color from 'colorjs.io';
	import Upload from '$lib/icons/upload.svelte';

	let zodError: ZodError;
	let image;
	let user = get(userStore)?.record;

	const colorRange = Color.range('oklch(67% .31, 0)', 'oklch(67% .31 360)', {
		steps: 360,
		space: 'oklch',
		outputSpace: 'srgb',
		hue: 'longer'
	});

	const gradientStops = Array(360)
		.fill(0)
		.map((_, i) => colorRange(i / 360));
	console.log({ gradientStops });

	async function fetchImage() {
		const token = await pb.files.getToken();
		image = pb.getFileUrl(user, user?.avatar, { token });
	}
	fetchImage();

	function getColorFromHue(hue: number) {
		return new Color(`oklch(72%, .25, ${hue})`).to('srgb').toString();
	}

	function onColorChange(palette: string, event: InputEvent) {
		if (!event.target?.value) return;
		const root = document.querySelector(':root');
		event.target.style.setProperty('--value', getColorFromHue(event.target.value));
		root?.style.setProperty(`--hue-${palette}`, event.target.value);
	}

	const schema = z.object({
		name: z.string().nonempty(`name is required`)
	});

	const updateUser = collectFormData(async (data, event) => {
		const result = schema.safeParse(data);
		if (!result.success) return (zodError = result.error);
		const payload = {
			...user,
			...result.data
		};

		await events.update(Collections.Users, user.id, payload);
	});

	async function updateImage(e) {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'image/*';

		fileInput.click();
    const target = e.currentTarget;

		const file = await new Promise<File>((resolve) =>
			fileInput.addEventListener('change', (e) => resolve(e.target.files[0]))
		);
    console.log(e.currentTarget)
		const input = target.querySelector('input[name="avatar"]');
		input.value = file;
		const image = target.querySelector('img');
		image.src = URL.createObjectURL(file);

		console.log({ file });
	}
</script>

<form on:submit|preventDefault={updateUser} style="--stops:{gradientStops}">
	<div class="row even">
		<div class="profile-image" on:click={updateImage}>
			<img class="avatar" src={image} />
			<div class="profile-image-mask">
				<Upload />
			</div>
			<input type="hidden" name="avatar" />
		</div>
		<div><Field label="Name" value={user.name} name="name" {zodError} /></div>
	</div>
	<fieldset>
		<legend>Color Theme</legend>
		<div class="row even">
			<div style="--value: {getColorFromHue(user?.primaryColor || 295)}">
				<Field
					on:input={(e) => onColorChange('primary', e)}
					label="Primary"
					min={0}
					max={360}
					type="range"
					class="color"
					name="primaryColor"
					defaultValue={295}
					value={user.primaryColor}
					{zodError}
				/>
			</div>
			<div style="--value: {getColorFromHue(user?.accentColor || 174)}">
				<Field
					on:input={(e) => onColorChange('accent', e)}
					min={0}
					max={360}
					class="color"
					label="Secondary"
					type="range"
					defaultValue={174}
					name="accentColor"
					value={user.accentColor}
					{zodError}
				/>
			</div>
		</div>
	</fieldset>
	<div class="row" style="justify-content: end; flex-direction: row;">
		<button class="accent ghost">Go Back</button>
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
        opacity:  100%;
      }
		}
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
