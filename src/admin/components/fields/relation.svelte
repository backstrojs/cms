<script lang="ts">
	import { buildSelect, getRelatedField } from '../../../query';
	import LabeledField from './labeled-field.svelte';
	import { api, type ApiModelName } from '../../sdk';
	import SelectSearch from '../ui/select-search.svelte';
	import { getContext } from 'svelte';
  import { format } from '../../../format';

	const { field, item } = $props();

	const collections = getContext('collections');
	const value = $derived(item?.[field.field]);

	let options = $state([]);

	$effect(() => {
		const select = buildSelect(collections[field.collection].fields);
		const relatedField = getRelatedField(field);

		api[field.collection as ApiModelName].findMany({
			select,
			where: field.where,
			take: 1000,
		}).then((res) => {
			options = res.map(row => ({
				value: row[collections[field.collection].idField],
				text: format(row[relatedField], collections[field.collection].fields[relatedField])
			}));
		});
	});
</script>

<LabeledField id={field.name} required={field.required}>
	<SelectSearch placeholder={`Select ${field.name}`} {options} {value} name={field.name} />
</LabeledField>
