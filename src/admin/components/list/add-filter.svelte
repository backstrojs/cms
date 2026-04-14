<script lang="ts">
	import { Input } from '../ui/input';
	import { Button } from '../ui/button';
	import { NativeSelect, NativeSelectOption } from '../ui/native-select';

	const { collection, add } = $props();

	let fieldSlug = $state<string | undefined>(Object.keys(collection.fields)[0]);
	let field = $derived(fieldSlug && collection.fields[fieldSlug]);
	let value = $state();

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const form = event.currentTarget as HTMLFormElement;
		const condition = (new FormData(form).get('condition') as string) ?? 'equals';

		if (!fieldSlug || value === undefined || value === null || value === '') return;

		add({
			field: fieldSlug,
			condition,
			value
		});

		event.target!.reset();
	}
</script>

<form class="grid sm:grid-cols-3 lg:grid-cols-4 gap-4" onsubmit={handleSubmit}>
	<NativeSelect name="field" class="w-auto" bind:value={fieldSlug}>
		{#each Object.keys(collection.fields) as key}
			<NativeSelectOption value={key}>
				{collection.fields[key].name}
			</NativeSelectOption>
		{/each}
	</NativeSelect>
	<NativeSelect name="condition" class="w-auto">
		<NativeSelectOption value="equals">equals</NativeSelectOption>
		<NativeSelectOption value="neq">not equals</NativeSelectOption>
		{#if field && (field.enum || ['string', 'text', 'richtext', 'relation'].includes(field.type))}
			<NativeSelectOption value="contains" data-show={`!['${Object.values(collection.fields).map(field => field.enum && field.type).filter(Boolean).join("','")}'].includes($_fieldType)`}>contains</NativeSelectOption>
			<NativeSelectOption value="not_contains" data-show={`!['${Object.values(collection.fields).map(field => field.enum && field.type).filter(Boolean).join("','")}'].includes($_fieldType)`}>not contains</NativeSelectOption>
		{/if}
		{#if field && ['number', 'datetime'].includes(field.type)}
			<NativeSelectOption value="gt" data-show="['number', 'datetime'].includes($_fieldType)">greater than</NativeSelectOption>
			<NativeSelectOption value="lt" data-show="['number', 'datetime'].includes($_fieldType)">less than</NativeSelectOption>
		{/if}
	</NativeSelect>
	{#if !field?.enum && !['date', 'datetime', 'number', 'boolean'].includes(field?.type)}
		<Input bind:value type="text" class="bg-white" />
	{/if}
	{#each Object.values(collection.fields).filter(field => field.enum) as field}
		<NativeSelect bind:value class="w-auto">
			{#each field.enum as option}
				<NativeSelectOption value={option}>
					{option}
				</NativeSelectOption>
			{/each}
		</NativeSelect>
	{/each}
	{#if field?.type === 'boolean'}
		<NativeSelect bind:value class="w-auto">
			<NativeSelectOption value="true">true</NativeSelectOption>
			<NativeSelectOption value="false">false</NativeSelectOption>
		</NativeSelect>
	{/if}
	{#if field?.type === 'date'}
		<Input bind:value type="date" class="bg-white" onclick={(e) => e.target?.showPicker()} />
	{/if}
	{#if field?.type === 'datetime'}
		<Input bind:value type="datetime-local" class="bg-white" onclick={(e) => e.target?.showPicker()} />
	{/if}
	{#if field?.type === 'number'}
		<Input bind:value type="number" class="bg-white" />
	{/if}

	<Button type="submit" class="md:max-w-48" disabled={!fieldSlug || !value}>
		Apply
	</Button>
</form>
