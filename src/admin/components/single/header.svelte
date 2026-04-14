<script lang="ts">
	import BaseHeader from "../header.svelte";
	import { Copy } from '@lucide/svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
	import { copyToClipboard } from '../../../format';
	import { Badge } from "../ui/badge";

	let { collection, item } = $props();
	let copied = $state(false);

	const copy = () => {
		copied = true;
		copyToClipboard(item.id);
		setTimeout(() => (copied = false), 3000);
	};
</script>

<BaseHeader {collection}>
	{#if item}
		<div>
			<Tooltip disableCloseOnTriggerClick>
				<TooltipTrigger>
					<Badge
						variant="secondary"
						size="md"
						class="font-normal text-black/50 cursor-pointer gap-2"
						onclick={copy}
					>
						<Copy class="size-6" /> ID: {item.id}
					</Badge>
				</TooltipTrigger>
				<TooltipContent side="left">
					{copied === true ? 'Copied!' : 'Copy ID'}
				</TooltipContent>
			</Tooltip>
		</div>
	{/if}
</BaseHeader>
