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

Test
<pre>
{JSON.stringify(data, null, 2)}
</pre>

<div class="modal-shade">
	<div class="modal">
		<form method="POST" action="?/accept">
			<input type="hidden" name="inviteId" value={data.inviteId} />
			<input type="hidden" name="hash" value={data.hash} />
			<p style="text-align: center;">
				You were invited by {data?.createdBy?.name || data?.createdBy?.username}<br />
				to join the {isProject ? 'project' : 'document'} "{recordName}"
			</p>
			<button>Accept</button>
		</form>
	</div>
</div>

<style lang="scss">
</style>
