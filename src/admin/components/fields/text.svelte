<script lang="ts">
	import { Textarea } from "../ui/textarea";
	import { format } from '../../../format';
	import LabeledField from './labeled-field.svelte';

	const { field, value } = $props();
</script>

<LabeledField id={field.name} required={field.required}>
	<Textarea value={format(value, field)} name={field.name} class="text-sm min-h-32" />
</LabeledField>
