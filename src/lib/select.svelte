<script lang="ts">
</script>

<div class="select">
	<select {...$$restProps}>
		<slot />
	</select>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
		class="icon"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
	</svg>
</div>

<style lang="scss">
	.select {
		position: relative;
		--border-color: var(--surface-4);
		&:hover,
		&:focus-within {
			--border-color: var(--surface-5);
		}
		select {
			appearance: none;
			width: 100%;
			height: 100%;
			padding-right: 40px;
		}
		.icon {
			position: absolute;
			right: 0;
			top: 0;
			bottom: 0;
			margin: auto;
			padding: 8px;
			stroke-width: 2px;
			color: var(--border-color);
		}
	}
</style>
