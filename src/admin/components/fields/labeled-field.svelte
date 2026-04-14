<script lang="ts">
	import { Asterisk } from '@lucide/svelte';
	import Label from './label.svelte';

	const { id, label = undefined, required = false, children, class: className = '' } = $props();
</script>

<div class={`flex flex-col gap-2 ${className}`}>
	<div class="flex items-center gap-1">
		<Label id={id}>
			{label ?? id}
		</Label>
		{#if required}
			<div class="flex-1">
				<Asterisk class="opacity-40" size={14} />
			</div>
		{/if}
	</div>
	{@render children()}
</div>
