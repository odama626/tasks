<script lang="ts">
	import type { ZodIssue, ZodError } from 'zod';

	export let label: string;

	export let zodError: ZodError | undefined = undefined;
	let error: ZodIssue | undefined;
	export let name: string | undefined;
	export let description: string | undefined = undefined;
	export let type: string = undefined;

	$: invalid = !!error || undefined;

	$: {
		error = zodError?.issues?.find((issue) => issue.path.includes(name));
	}

	let dirty: boolean = false;
</script>

<label aria-invalid={invalid}>
	{#if label}<div>{label}</div>{/if}
	{#if type === 'rich'}
		<textarea rows="5" {name} aria-invalid={invalid} {...$$restProps} />
	{:else}
		<input {type} {name} aria-invalid={invalid} on:keydown={() => (dirty = true)} {...$$restProps} />
	{/if}
	{#if error}<small>{error.message}</small>{/if}
	{#if description}<small>{description}</small>{/if}
</label>
