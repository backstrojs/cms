<script lang="ts">
	let { collection, children = undefined } = $props();
</script>

<div class="p-4 flex items-center justify-between mb-4">
	<h2 class="capitalize flex items-center gap-2 text-2xl font-normal">
		{#if collection.icon}
			<collection.icon stroke-width={1.5} class="opacity-50" />
		{/if}
		{collection.name}
	</h2>
	{@render children?.()}
</div>
