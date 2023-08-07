<script lang="ts">
	import { onMount } from 'svelte';

	export let data;

	console.log({ data });

	const isProject = !!data?.project;
	const recordName = data?.project?.name || data?.doc?.title;

	onMount(() => {
		console.log({ data });
	});
</script>

<div class="modal-shade">
	<div class="modal form">
		<p style="text-align: center;">
			You were invited by {data?.createdBy?.name || data?.createdBy?.username}<br />
			to join the {isProject ? 'project' : 'document'} "{recordName}"
		</p>
		<a class="button ghost" href="/invite/accept?id={data.inviteId}&hash={data.hash}"
			>Accept Invite</a
		>
	</div>
</div>

<style lang="scss">
</style>
