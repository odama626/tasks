<script lang="ts">
	import Task from '../tasks/task.svelte';
	import Field from '$lib/field.svelte';
	import { collectFormData, convertPbErrorToZod } from '$lib/utils';
	import { z, ZodError } from 'zod';
	import { pb, userStore } from '$lib/storage';
	import { goto } from '$app/navigation';

	let registerErrors: ZodError;
	let loginErrors: ZodError;
	let isRegistering = false;

	function handleRedirect() {
		const redirect = localStorage.getItem('login-redirect') ?? '/';
		localStorage.removeItem('login-redirect');
		goto(redirect);
	}

	const registrationSchema = z
		.object({
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
					<Field label="Username" name="username" zodError={registerErrors} />
					<Field label="Email" name="email" zodError={registerErrors} />
					<Field type="password" label="Password" name="password" zodError={registerErrors} />
					<Field type="password" label="Confirm" name="passwordConfirm" zodError={registerErrors} />
					<button>Register</button>
				</form>
			{:else}
				<form on:submit|preventDefault={login}>
					<Field label="Username" name="username" zodError={loginErrors} />
					<Field label="Password" name="password" type="password" zodError={loginErrors} />
					<button>Login</button>
					{#if loginErrors?.overalMessage}<small class="error">{loginErrors.overalMessage}</small
						>{/if}
				</form>
			{/if}
		</div>
	</div>
</div>

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
