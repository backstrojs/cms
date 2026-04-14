<script lang="ts">
	import LabeledField from './labeled-field.svelte';
	import SelectSearch from '../ui/select-search.svelte';

	const { field, value } = $props();

	const options = field.options.map(opt => ({ value: opt, text: opt }));
</script>

<LabeledField id={field.name} required={field.required}>
	<SelectSearch placeholder={`Select ${field.name}`} {options} {value} name={field.name} />
</LabeledField>
