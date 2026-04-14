<script lang="ts">
	import { Label as BaseLabel } from '../ui/label';

	const { id, children, class: className = '' } = $props();
</script>

<BaseLabel for={id} class={`text-sm text-muted-foreground font-normal me-auto ${className}`}>
	{#if children}
		{@render children()}
	{:else}
		{id}
	{/if}
</BaseLabel>
