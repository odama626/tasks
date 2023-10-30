<script lang="ts">
	import EllipsisVertical from '$lib/icons/ellipsis-vertical.svelte';
	import Star from '$lib/icons/star.svelte';
	import { Priority } from './taskList';

	export let attrs;
	export let editor;
	export let getPos;
	export let options;
	export let dispatch;

	function togglePriority() {
		const priority = attrs.priority === Priority.Normal ? Priority.High : Priority.Normal;
		editor.chain().focus(getPos()).updateAttributes('taskList', { priority }).run();
	}
</script>

<div class="task-list-overlay-container" contenteditable="false">
	<button style='display: contents' class="ghost icon" on:click={togglePriority}>
		<Star class="button" solid={attrs.priority === Priority.High} /></button
	>
	<EllipsisVertical class="button" />
</div>

<style lang="scss">
	:global(.task-list-overlay-container + ul .task-list-overlay-container) {
		display: none;
	}

	.task-list-overlay-container {
		position: absolute;
		inset: 0;

		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		pointer-events: none;

		:global(> *) {
			pointer-events: initial;
		}
	}
</style>
