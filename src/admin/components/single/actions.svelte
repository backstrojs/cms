<script lang="ts">
	import { Cloud, LoaderCircle, Trash } from "@lucide/svelte";
	import { api, type ApiModelName } from '../../sdk';
	import { Button } from "../ui/button";
	import { format } from '../../../format';
	import { getContext } from "svelte";

	let { item, collection, saving, children = undefined } = $props();

	const { navigate } = getContext('router');

	const deleteItem = async () => {
		if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

		try {
			await api[collection.name as ApiModelName].delete({ where: { id: item.id } });
			navigate('/:collection', { params: { collection: collection.slug } });
		} catch (err) {
			console.error(err);
			alert('Failed to delete!');
		}
	};
</script>

<div class="border-y sticky top-0 bg-background px-4 py-3 z-1 flex items-center gap-4">
	{#if item?.createdAt}
		<div class="text-sm">
			<span class="opacity-50">Created at:</span>
			{format(item.createdAt, collection.fields.createdAt)}
		</div>
	{/if}
	{#if item?.updatedAt}
		<div class="text-sm">
			<span class="opacity-50">Updated at:</span>
			{format(item.updatedAt, collection.fields.updatedAt)}
		</div>
	{/if}

	<div class="ml-auto flex items-center gap-2">
		{@render children?.({ item, collection })}
		<Button type="submit">
			{#if saving}
				<LoaderCircle class="size-5 mr-1 animate-spin" />
			{:else}
				<Cloud class="size-5 mr-1" />
			{/if}
			Save
		</Button>
		{#if item}
			<Button variant="destructive" onclick={deleteItem}>
				<Trash class="size-5 mr-1" />
				Delete
			</Button>
		{/if}
	</div>
</div>
