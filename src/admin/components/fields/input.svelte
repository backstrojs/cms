<script lang="ts">
	import { Input as BaseInput } from '../ui/input';
	import { format } from '../../../format';
	import LabeledField from './labeled-field.svelte';
	import { Badge } from '../ui/badge';
	import { X } from '@lucide/svelte';

	let { field, value } = $props();

	const types = {
		string: 'text',
		number: 'number',
		date: 'date',
		datetime: 'datetime-local',
		timestamp: 'datetime-local',
	}

	const step = {
		number: 'any',
		date: 1,
		datetime: 1,
		timestamp: 1,
	}

	const type = types[field.type as keyof typeof types] || 'text';

	const remove = (val: string) => {
		value = value.filter(v => v !== val);
	}

	const add = (val: string) => {
		if (val && !value.includes(val)) {
			value = [...value, val];
		}
	}
</script>

<LabeledField id={field.name} required={field.required}>
	{#if field.multiple}
		<div class="flex gap-2 flex-wrap mb-2">
			{#each value as val, i}
				{#if val.length}
					<Badge variant="outline" class="cursor-pointer" onclick={() => remove(val)}>
						<span class="max-w-48 text-ellipsis overflow-hidden font-normal" title={val}>{val}</span>
						<X class="size-4" />
					</Badge>
					{#if !field.readonly}
						<input type="hidden" name={field.name} value={val} />
					{/if}
				{/if}
			{/each}
		</div>
		<BaseInput id={field.name} {type} step={1} class="text-sm" readonly={!!field.readonly} onclick={(e) => type.includes('date') && e.target!.showPicker()} />
	{:else}
		<BaseInput value={format(value, field)} id={field.name} name={field.name} {type} step={step[field.type as keyof typeof step]} class="text-sm" required={!!field.required} readonly={!!field.readonly} onclick={(e) => type.includes('date') && e.target!.showPicker()} />
	{/if}
</LabeledField>
