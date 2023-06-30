<script lang="ts">
	import { goto } from "$app/navigation";
	import { currentProject } from "$lib/storage";


$: {
  if ($currentProject) goto(`/projects/${$currentProject}`);
}

</script>