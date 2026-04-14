<script lang="ts">
	import type { Component } from "svelte";
	import InputField from "./input.svelte";
	import Enum from "./enum.svelte";
	import Relation from "./relation.svelte";
	import RelationList from "./relation-list.svelte";
	import Boolean from "./boolean.svelte";
	import Storage from "./storage.svelte";
	import Text from "./text.svelte";
	import Richtext from "./richtext.svelte";
	import Code from "./code.svelte";

	const { field, item } = $props();

	const value = $derived(item?.[field.name]);
	let FieldComponent: Component | null = InputField;

	if (field?.input) {
		FieldComponent = field.input;
	} else if (field?.id || field?.hidden) {
		FieldComponent = null;
	} else if (field.type === 'enum') {
		FieldComponent = Enum;
	} else if (field.type === 'relation' && !field.multiple) {
		FieldComponent = Relation;
	} else if (field.type === 'relation') {
		FieldComponent = RelationList;
	} else if (field.type === 'boolean') {
		FieldComponent = Boolean;
	} else if (field.type === 'storage') {
		FieldComponent = Storage;
	} else if (field.type === 'text') {
		FieldComponent = Text;
	} else if (field.type === 'richtext') {
		FieldComponent = Richtext;
	} else if (field.type === 'code' || field.type === 'json') {
		FieldComponent = Code;
	}
</script>

{#if FieldComponent}
	<FieldComponent {field} {value} {item} />
{/if}
