<script lang="ts">
	import { getRelatedField } from '../../../query';
	import LabeledField from './labeled-field.svelte';
	import { api, type ApiModelName } from '../../sdk';
	import SelectSearch from '../ui/select-search.svelte';
	import { Badge } from '../ui/badge';
	import { X } from '@lucide/svelte';
	import { getContext } from 'svelte';

	const { field, item } = $props();

	const collections = getContext('collections');
	const idField = collections[field.collection].idField;
	const relatedField = getRelatedField(field);

	let options = $state([]);
	let value = $state([]);
	let selected = $derived(value.map(val => options.find(opt => opt.value === val)).filter(Boolean));

	$effect(() => {
		value = [];

		api[field.collection as ApiModelName].findMany({
			...(field.readonly ? {
				where: {
					[field.field]: item.id
				}
			} : {}),
			select: {
				[idField]: true,
				[relatedField]: true,
				[field.field]: true,
			},
			take: 1000,
		}).then((res) => {
			options = res.map(row => {
				if (row[field.field] == item?.id) {
					value.push(row[idField]);
				}

				return ({
					value: row[idField],
					text: row[relatedField]
				});
			})
		});
	});

	const remove = (val: string) => {
		value = value.filter(v => v !== val);
	}
</script>

<LabeledField id={field.name} required={field.required}>
	<div class="flex gap-2 flex-wrap mb-2">
		{#each selected as sel, i (sel.value)}
			<Badge variant="outline" class="cursor-pointer" onclick={() => remove(sel.value)}>
				<span class="max-w-48 text-ellipsis overflow-hidden font-normal" title={sel.text}>{sel.text}</span>
				<X class="size-4" />
			</Badge>
			{#if !field.readonly}
				<input type="hidden" name={field.name} value={sel.value} />
			{/if}
		{/each}
	</div>
	{#if !field.readonly}
		<SelectSearch bind:value placeholder={`Select ${field.name}`} {options} multiple />
	{/if}
</LabeledField>
