<script lang="ts">
	import type { Editor } from '@tiptap/core';

	export let project: string;
	export let doc: string;
	export let id: string;
	export let editor: Editor;
	export let options;
	export let getPos;

	export let checked: boolean;
</script>

<div class="flex-container">
	{#if project && doc && id}
		<a href="/projects/{project}/docs/{doc}#{id}">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="icon button"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
				/>
			</svg>
		</a>
	{/if}
</div>

<style lang="scss">
	.flex-container {
		display: flex;
		justify-content: flex-end;
}
</style>
