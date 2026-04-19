<script lang="ts">
	import { Switch } from "../ui/switch";
	import LabeledField from "./labeled-field.svelte";

	const { field, value } = $props();
</script>

<LabeledField id={field.name} required={field.required} class="flex-row! items-center">
	<Switch id={field.name} checked={!!value} name={field.name} />
</LabeledField>
