<script>
	import Field from "$lib/field.svelte";


  function deleteDocument() {
    
  }

</script>
<form on:submit|preventDefault={deleteDocument}> 
  <p>Are you sure you want to delete the document?</p>
  <Field autofocus name='confirmation' label='To delete type name of document' />
</form>