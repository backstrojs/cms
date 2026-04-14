<script lang="ts">
	const { value, item } = $props();
</script>

<div class="flex items-center gap-4">
	<img src={item.url} alt={value} class="size-36 object-cover rounded-md" />

	<div class="space-y-2">
		<div>
			{value}
		</div>
		<div class="opacity-50 text-sm">
			{Math.round(item.size / 1024)}KB - {item.type}
		</div>
		<div class="text-sm">
			{item.driver}
		</div>
	</div>
</div>
