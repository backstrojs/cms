<script lang="ts">
	import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem } from './select';
	import { Input } from './input';

	let { name = undefined, value = $bindable(), options = [], placeholder = 'Select value', multiple = false, open = $bindable(false) } = $props();

	let search = $state('');

	let filteredOptions = $derived.by(() => {
		if (!search) return options;
		return options.filter((opt) => opt.text?.toLowerCase().includes(search.toLowerCase()));
	});
</script>

<Select type={multiple ? 'multiple' : 'single'} bind:value {name} bind:open>
	<SelectTrigger class={`w-full text-sm ${value ? '' : 'text-black/50'}`}>
		{#if multiple}
			{placeholder}
		{:else}
			{value ? options.find(opt => opt.value === value)?.text : placeholder }
		{/if}
	</SelectTrigger>
	<SelectContent class="text-sm max-h-[80vh] max-w-screen">
		<SelectGroup class="max-w-screen">
			<Input placeholder="Search..." class="mb-2" bind:value={search} />
			{#each filteredOptions as item}
				<SelectItem value={item.value}>{item.text}</SelectItem>
			{/each}
		</SelectGroup>
	</SelectContent>
</Select>
