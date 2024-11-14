<script lang="ts">
	import { Collections } from '$lib/db.types';
	import Field from '$lib/field.svelte';
	import { events } from '$lib/modelEvent';
	import Select from '$lib/select.svelte';
	import { RecordAccess, db, userStore } from '$lib/storage';
	import { collectFormData, copyInviteToClipboard, createId, withKeys } from '$lib/utils';
	import { liveQuery } from 'dexie';
	import { nanoid } from 'nanoid';
	import { get } from 'svelte/store';
	import type { ZodError } from 'zod';

	export let projectId: string;
	$: permissions = liveQuery(() => db.projects_users.where({ project: projectId }).toArray());
	$: invites = liveQuery(() => db.invites.where({ project: projectId }).toArray());
	$: users = liveQuery(() => db.users.toCollection().toArray());
	let error: ZodError;

	const createInvite = collectFormData(async (data, event) => {
		let user = await db.users
			.where('username')
			.equalsIgnoreCase(data.user)
			.or('email')
			.equalsIgnoreCase(data.user)
			.first();

		if (!user) {
			error = 'Could not find user, maybe try sharing a link';
			return;
		}

		console.log({ user });
		const record = await db.projects_users.where({ project: projectId, user: user.id }).first();
		if (record) {
			error = 'user already invited';
			return;
		}
		error = undefined;

		events.create(Collections.ProjectsUsers, {
			id: createId(),
			user: user.id,
			project: projectId,
			access: data.access
		});
	});

	async function createInviteLink() {
		const id = createId();
		const invite = {
			id,
			createdBy: get(userStore).record.id,
			project: projectId,
			access: RecordAccess.Viewer,
			secret: nanoid()
		};
		events.create(Collections.Invites, invite);
		copyInviteToClipboard(invite);
	}

	let options = ['admin', 'editor', 'viewer'];
	let allowedOptions = [];
	let currentUserPermission = {};

	const currentUser = get(userStore).record;
	db.projects_users.where({ project: projectId, user: currentUser.id }).first((permission) => {
		currentUserPermission = permission;
		allowedOptions = options.slice(options.indexOf(currentUserPermission.access)).reverse();
	});
</script>

<div
	class="form"
	on:click={(e) => e.stopPropagation()}
	on:keypress={withKeys(['Enter', 'Space'], (e) => {})}
>
	<p>Invite</p>
	<form on:submit|preventDefault={createInvite}>
		<div class="input-group" class:error>
			<input name="user" placeholder="username or email" />
			<Select name="access">
				{#each allowedOptions as option}
					<option value={option}>{option}</option>
				{/each}
			</Select>
		</div>
		<button class="outline">Invite</button>
	</form>
	{#if error}
		<small class="error">{error}</small>
	{/if}
	<div class="divider horizontal" />
	{#if $permissions}
		<div class="permissions">
			{#each $permissions as permission (permission.id)}
				{@const user = $users.find((user) => user.id === permission.user)}
				<div class="name">
					{user?.name || user?.username}
				</div>
				<Select
					disabled={currentUserPermission.id === permission.id}
					on:change={(e) =>
						events.update(Collections.ProjectsUsers, permission.id, { access: e.target.value, project: permission.project })}
					class="ghost"
					name="access"
					value={permission.access}
				>
					{#each allowedOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</Select>
			{/each}
			{#if $invites}
				<div class="divider horizontal" style="grid-column: 1/3;" />
				{#each $invites as invite (invite.id)}
					<div class="name invite">
						{invite.id}
						<button class="icon ghost small" on:click={() => copyInviteToClipboard(invite)}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="icon"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
								/>
							</svg>
						</button>
					</div>
					<Select class="ghost" name="access" value={invite.access}>
						{#each allowedOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</Select>
				{/each}
			{/if}
		</div>
	{/if}
	<button on:click={createInviteLink} class="ghost" style="text-align: right">
		Create Invite Link
	</button>
</div>

<style lang="scss">
	.permissions {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--block-spacing);
	}
	.form {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--block-spacing);
	}

	button.outline {
		text-align: center;
	}

	form {
		display: flex;
		flex-direction: row;

		@media only screen and (max-width: 480px) {
			flex-direction: column;

			.input-group {
				flex-direction: column;
				display: contents;
			}
		}
	}

	.name.invite {
		display: flex;
		justify-content: space-between;
	}

	.name,
	.access {
		align-self: center;
	}
</style>
