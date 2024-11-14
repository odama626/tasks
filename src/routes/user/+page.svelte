<script lang="ts">
	import Field from '$lib/field.svelte';
	import { pb, userStore } from '$lib/storage';
	import { collectFormData, convertPbErrorToZod } from '$lib/utils';
	import { get } from 'svelte/store';
	import { ZodError, z } from 'zod';
	import Profile from './profile.svelte';
	import { handleRedirect } from './utils';
	import { encode, ExtensionCodec } from '@msgpack/msgpack';
	import { bytesToBase64 } from 'byte-base64';
	import { register as handleRegister, login as handleLogin } from '$lib/api';

	let registerErrors: ZodError;
	let loginErrors: ZodError;
	let isRegistering = false;
	let isLoggedIn = !!get(userStore)?.record;

	const registrationSchema = z
		.object({
			name: z.string().trim().min(2),
			username: z.string().trim().toLowerCase().min(2),
			email: z.string().email().trim().toLowerCase(),
			password: z.string().min(8),
			passwordConfirm: z.string()
		})
		.refine((data) => data.password === data.passwordConfirm, {
			message: `Passwords don't match`,
			path: ['confirm']
		});

	const loginSchema = z.object({
		username: z.string().trim().toLowerCase().min(2),
		password: z.string()
	});

	const register = collectFormData(async (data, event) => {
		const result = registrationSchema.safeParse(data);
		if (!result.success) return (registerErrors = result.error);

		const account = await handleRegister(data);

		userStore.update((user) => ({ ...user, account }));

		const payload = await pb.collection('users').create(data).catch(convertPbErrorToZod);
		if (payload.error) return (registerErrors = payload.error);

		const auth = await pb
			.collection('users')
			.authWithPassword(result.data.username, result.data.password);
		userStore.set(auth);
		event.target.reset();
		handleRedirect();
	});

	const login = collectFormData(async (data, event) => {
		const result = loginSchema.safeParse(data);
		if (!result.success) return (loginErrors = result.error);

		await handleLogin(result.data.username, result.data.password);

		const auth = await pb
			.collection('users')
			.authWithPassword(result.data.username, result.data.password)
			.catch(convertPbErrorToZod);
		if (auth.error) return (loginErrors = auth.error);
		userStore.set(auth);
		event.target.reset();
		handleRedirect();
	});
</script>

{#if isLoggedIn}
	<div class="modal-shade">
		<div class="modal">
			<div class="modal-content">
				<Profile />
			</div>
		</div>
	</div>
{:else}
	<div class="modal-shade">
		<div class="modal">
			<div class="toggle">
				<button class:ghost={!isRegistering} on:click={() => (isRegistering = !isRegistering)}>
					Login
				</button>
				<button class:ghost={isRegistering} on:click={() => (isRegistering = !isRegistering)}>
					Register
				</button>
			</div>
			<div class="modal-content">
				{#if isRegistering}
					<form on:submit|preventDefault={register}>
						<Field autocomplete="name" label="Name" name="name" zodError={registerErrors} />
						<Field
							autocomplete="username"
							label="Username"
							name="username"
							zodError={registerErrors}
						/>
						<Field autocomplete="email" label="Email" name="email" zodError={registerErrors} />
						<Field
							autocomplete="new-password"
							type="password"
							label="Password"
							name="password"
							zodError={registerErrors}
						/>
						<Field
							autocomplete="new-password"
							type="password"
							label="Confirm"
							name="passwordConfirm"
							zodError={registerErrors}
						/>
						<button>Register</button>
					</form>
				{:else}
					<form on:submit|preventDefault={login}>
						<Field
							autocomplete="username"
							label="Username"
							name="username"
							zodError={loginErrors}
						/>
						<Field
							autocomplete="current-password"
							label="Password"
							name="password"
							type="password"
							zodError={loginErrors}
						/>
						<button>Login</button>
						{#if loginErrors?.overalMessage}<small class="error">{loginErrors.overalMessage}</small
							>{/if}
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal {
		padding: 0;
	}

	.modal-content {
		padding: 2rem;
		min-width: 270px;
	}

	.toggle {
		display: flex;
		justify-content: stretch;

		> button {
			font-size: 1.25rem;
			text-align: center;
			padding: 0.5rem;
			flex-grow: 1;
		}
	}
</style>
