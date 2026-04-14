<script lang="ts">
	import { LoaderCircle } from '@lucide/svelte';
	import { api, type ApiModelName } from '../../sdk';
	import FieldInput from '../../components/fields/index.svelte';
	import Actions from '../../components/single/actions.svelte';
	import Header from '../../components/single/header.svelte';
	import page from '../../state/page.svelte';
	import { getContext } from 'svelte';

	let { form = undefined, actions = undefined } = $props();

	const collections = getContext('collections');
	const { navigate, route } = getContext('router');

	const collection = Object.values(collections).find((col) => col.slug === route.params.collection)!;
	const modelName = collection.name as ApiModelName;

	let id = () => route.params.id;
	let item = $state<any>(null);
	let loading = $derived(id() !== 'new');
	let saving = $state(false);

	$effect(() => {
		saving = false;

		page.breadcrumbs = [
			{ name: collection.name, href: `/${collection.slug}` },
		];

		if (id() !== 'new') {
			loading = true;

			api[modelName]
				.findUnique({ where: { id: id()! } })
				.then((res) => {
					item = res;
					loading = false;

					page.breadcrumbs = [
						{ name: collection.name, href: `#/${collection.slug}` },
						{ name: String(item[collection.mainField]) },
					];
				})
				.catch((err) => {
					console.error(err);
					loading = false;
				});
		} else {
			item = null;

			page.breadcrumbs = [
				{ name: collection.name, href: `#/${collection.slug}` },
				{ name: 'New' },
			];
		}
	});

	const save = async (e) => {
		e.preventDefault();

		saving = true;

		const formData = new FormData(e.target);
		const data = {};

		for (const [key, value] of formData.entries()) {
			if (collection.fields[key]?.readonly !== true) {
				if (collection.fields[key]?.multiple) {
					data[key] = data[key] ? [...data[key], value] : [value];
				} else {
					data[key] = value;
				}
			}
		}

		for (const field of Object.values(collection.fields)) {
			if (!field.readonly && field.multiple && !data[field.name]) {
				data[field.name] = [];
			}
		}

		try {
			if (id() === 'new') {
				const created = await api[modelName].create({ data });
				await navigate('/:collection/:id', { params: { collection: collection.slug, id: created.id } });
				return;
			}

			await api[modelName].update({
				where: { id: id() },
				data,
			});
			alert('Saved successfully!');
		} catch (err) {
			console.error(err);
			alert('Failed to save!');
		}

		saving = false;
	};
</script>

<Header {collection} {item} />

<form onsubmit={save}>
	<Actions {item} {collection} {saving} children={actions} />
	<div>
		<div class="p-4 space-y-4">
			{#if loading}
				<div class="p-4 w-full flex items-center justify-center min-h-60">
					<LoaderCircle class="size-14 text-gray-400 animate-spin" />
				</div>
			{:else}
				{#if form}
					{@render form()}
				{:else}
					{#each Object.values(collection.fields) as field}
						<FieldInput {field} {item} />
					{/each}
				{/if}
			{/if}
		</div>
	</div>
</form>
