<script lang="ts">
	import { getRelatedField } from '../../../query';
	import LabeledField from './labeled-field.svelte';
	import { api, type ApiModelName } from '../../sdk';
	import SelectSearch from '../ui/select-search.svelte';
	import { getContext } from 'svelte';

	const { field, item } = $props();

	const collections = getContext('collections');
	const value = $derived(item?.[field.field]);

	let options = $state([]);

	api[field.collection as ApiModelName].findMany({
		take: 1000,
	}).then((res) => {
		options = res.map(row => ({
			value: row[collections[field.collection].idField],
			text: row[getRelatedField(field)!]
		}));
	});
</script>

<LabeledField id={field.name} required={field.required}>
	<SelectSearch placeholder={`Select ${field.name}`} {options} {value} name={field.field} />
</LabeledField>
