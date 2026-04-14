<script lang="ts">
	import { getContext } from "svelte";
	import { slide } from "svelte/transition";
	import { format, buildField, buildSelect } from '../../../client';
	import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
	import { Button } from '../../components/ui/button';
	import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNextButton, PaginationPrevButton } from "../../components/ui/pagination";
	import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
	import { Collapsible, CollapsibleContent } from '../../components/ui/collapsible';
	import { Badge } from '../../components/ui/badge';
	import { api, type ApiModelName, type ApiResult } from '../../sdk';
	import { ChevronDown, ChevronUp, CircleCheck, CircleX, ListFilter, LoaderCircle, Plus, Search, Settings, X } from '@lucide/svelte';
	import { reorder, useSortable } from "../../hooks/useSortable.svelte";
	import AddFilter from "../../components/list/add-filter.svelte";
	import Header from "../../components/header.svelte";
	import pageState from '../../state/page.svelte';

	let isLoading = $state(true);
	const collections = getContext('collections');
	const { route, navigate } = getContext('router');
	const perPage = 30;
	const conditions = {
		equals: '=',
		neq: '!=',
		contains: 'contains',
		not_contains: 'not contains',
		gt: '>',
		lt: '<',
		search: 'contains'
	}

	const slug = () => route.params.collection;

	let data = $state<null | ApiResult<ApiModelName, any>[]>(null);
	let count = $state(0);
	let page = $state(1);
	let sort = $state<{ column: string; direction: 'asc' | 'desc' } | null>(null);
	let showColumns = $state(false);
	let showFilters = $state(false);
	let filters = $state<{ field: string; condition: string; value: any }[]>([]);
	let collection = $derived(Object.values(collections).find((col) => col.slug === slug()));
	let columns = $derived<string[]>(collection?.columns || Object.keys(collection?.fields || {}).slice(0, 5));
	let modelName = $derived<ApiModelName>(collection?.name as ApiModelName);
	let where = $derived(filters.reduce((acc, filter) => {
		const condition = filter.condition.replace('search', 'contains');

		return {
			...acc,
			[filter.field]: buildField(collection.fields[filter.field], {
				[condition]: filter.value,
				...(['contains', 'not_contains'].includes(condition) ? { mode: 'insensitive' } : {})
			})
		};
	}, {}));

	let columnsBadges = $state<HTMLElement | null>(null);


	$effect(() => {
		pageState.breadcrumbs = []

		if (collection) {
			showFilters = false;
			showColumns = false;
			filters = [];

			pageState.breadcrumbs = [
				{ name: collection.name },
			];
		}
	});

	useSortable(() => columnsBadges, {
		draggable: '.bg-white',
		onEnd: (evt) => {
			columns = reorder(columns, evt);
		}
	});

	$effect(() => {
		if (!modelName) return;

		isLoading = true;
		const select = buildSelect(collection.fields, columns);

		api[modelName].findMany({
			select,
			orderBy: sort ? { [sort.column]: sort.direction } : undefined,
			where,
		}, {
			page,
			limit: perPage,
		}).then((res) => {
			data = res;
		}).catch((err) => {
			console.error(err);
		}).finally(() => {
			isLoading = false;
		});
	});

	$effect(() => {
		if (!modelName) return;

		api[modelName].count({ where }).then((res) => {
			count = res;
		}).catch((err) => {
			console.error(err);
		});
	});

	const handleSort = (column: string, direction: 'asc' | 'desc') => {
		if (sort?.column === column && sort.direction === direction) {
			sort = null;
		} else {
			sort = { column, direction };
		}
	};

	const toggleColumn = (column: string) => {
		if (columns.includes(column)) {
			columns = columns.filter((col) => col !== column);
		} else {
			columns = [...columns, column];
		}
	};

	const addFilter = (filter: { field: string; condition: string; value: any }) => {
		filters.push(filter);
	}

	const search = (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const value = new FormData(form).get('search') as string;

		if (value === undefined || value === null || value === '') return;

		const field = collection.mainField || collection.idField || 'id';

		filters.push({
			field,
			condition: 'search',
			value
		});
	}

	const cleanSearch = () => {
		filters = filters.filter(filter => filter.condition !== 'search');
	}
</script>

{#if collection}
	<Header {collection}>
		<div>
			<Button href={`/admin#/${collection.slug}/new`}>
				<Plus class="size-5" />
				Create new
			</Button>
		</div>
	</Header>

	<div class="p-4 flex items-center justify-between">
		<div class="flex items-center w-sm">
			<form class="flex items-center flex-1" onsubmit={search}>
				<InputGroup class="rounded-full">
					<InputGroupInput name="search" placeholder="Search..." class="placeholder:text-gray-400" />
					<InputGroupAddon>
						<Search class="text-gray-400" />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						<X class="text-gray-400 cursor-pointer" onclick={cleanSearch} />
					</InputGroupAddon>
				</InputGroup>
			</form>
			<Button variant="ghost" size="icon-sm" class="rounded-full text-gray-400 ml-2" onclick={() => showFilters = !showFilters}>
				<ListFilter />
			</Button>
		</div>
		<Button variant="ghost" size="icon-sm" class="rounded-full text-gray-400" onclick={() => showColumns = !showColumns}>
			<Settings />
		</Button>
	</div>

	<Collapsible bind:open={showFilters}>
		<CollapsibleContent>
			{#snippet child({ props, open })}
				{#if open}
					<div transition:slide {...props} class="p-4 relative mx-4 mb-4 bg-muted rounded-lg rounded-tl-none">
						{#each filters as filter, i (i)}
							<Badge variant="outline" class="mr-2 mb-2 cursor-pointer font-normal bg-white" onclick={() => filters = filters.filter((_, index) => index !== i)}>
								{collection.fields[filter.field].name} <span class="opacity-50">{conditions[filter.condition]}</span> {filter.value}
								<X class="remove w-3 h-3 ml-1" />
							</Badge>
						{/each}
						<AddFilter {collection} add={addFilter} />
					</div>
				{/if}
			{/snippet}
		</CollapsibleContent>
	</Collapsible>

	<Collapsible bind:open={showColumns}>
		<CollapsibleContent>
			{#snippet child({ props, open })}
				{#if open}
					<div bind:this={columnsBadges} transition:slide {...props} class="px-4 pt-4 pb-2 relative mx-4 mb-4 bg-muted rounded-lg rounded-tr-none">
						{#each columns as column (column)}
							<Badge variant="outline" class="capitalize mr-2 mb-2 cursor-pointer font-normal bg-white" onclick={() => toggleColumn(column)}>
								{collection.fields[column].name}
								<X class="remove w-3 h-3" />
							</Badge>
						{/each}
						{#each Object.keys(collection.fields) as column}
							{#if !columns.includes(column)}
								<Badge variant="outline" class="capitalize mr-2 mb-2 cursor-pointer font-normal text-muted-foreground" onclick={() => toggleColumn(column)}>
									{collection.fields[column].name}
								</Badge>
							{/if}
						{/each}
					</div>
				{/if}
			{/snippet}
		</CollapsibleContent>
	</Collapsible>

	{#if isLoading}
		<div class="p-4 w-full flex items-center justify-center min-h-60">
			<LoaderCircle class="size-14 text-gray-400 animate-spin" />
		</div>
	{:else}
		<Table>
			<TableHeader class="sticky top-0 bg-background z-1">
				<TableRow class="border-t hover:bg-transparent">
					{#each columns as column}
						<TableHead class="p-4 font-semibold">
							<span class="opacity-50">
								{collection.fields[column].name}
							</span>
							{#if collection.fields[column].sort !== false}
								<button class={`${sort?.column === column && sort.direction === 'asc' ? 'opacity-100' : 'opacity-50'} hover:opacity-100`} onclick={() => handleSort(column, 'asc')}>
									<ChevronUp stroke-width={1.5} class="inline-block w-4 h-4 ms-2" />
								</button>
								<button class={`${sort?.column === column && sort.direction === 'desc' ? 'opacity-100' : 'opacity-50'} hover:opacity-100`} onclick={() => handleSort(column, 'desc')}>
									<ChevronDown stroke-width={1.5} class="inline-block w-4 h-4 ms-0.5" />
								</button>
							{/if}
						</TableHead>
					{/each}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if data.length > 0}
					{#each data || [] as item, i}
						<TableRow class={'cursor-pointer ' + (i % 2 !== 0 ? 'bg-muted border-none' : 'border-none')} onclick={() => navigate('/:collection/:id', { params: { collection: collection.slug, id: item.id } })}>
							{#each columns as column}
								<TableCell class="p-4 text-sm text-secondary-foreground">
									{#if collection.fields[column].cell}
										<div class="w-10 h-10 bg-black inline-block align-middle rounded overflow-hidden mr-2"><img src={item.url} alt={item.filename} class="size-10 object-cover" /></div> {item.filename}
									{:else if collection.fields[column].type === 'boolean'}
										<div class="pr-16">
											{#if item[column] === true}
												<CircleCheck class="size-6 fill-green-500 text-white mx-auto" />
											{:else}
												<CircleX class="size-6 fill-red-500 text-white mx-auto" />
											{/if}
										</div>
									{:else}
										{format(item[column], collection.fields[column])}
									{/if}
								</TableCell>
							{/each}
						</TableRow>
					{/each}
				{:else}
					<TableRow>
						<TableCell colspan={columns.length} class="p-8 text-center text-sm text-gray-500">
							Nothing found.
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
		{#if count > perPage}
			<div class="p-4 w-full flex items-center sticky bottom-0 bg-background border-t">
				<Pagination bind:page class="mx-0 justify-end" {perPage} {count}>
					{#snippet children({ pages, currentPage })}
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevButton />
							</PaginationItem>
							{#each pages as page (page.key)}
								{#if page.type === "ellipsis"}
									<PaginationItem>
										<PaginationEllipsis class="opacity-50 text-muted-foreground" />
									</PaginationItem>
								{:else}
									<PaginationItem>
										<PaginationLink {page} isActive={currentPage === page.value}>{page.value}</PaginationLink>
									</PaginationItem>
								{/if}
							{/each}
							<PaginationItem>
								<PaginationNextButton />
							</PaginationItem>
						</PaginationContent>
					{/snippet}
				</Pagination>
			</div>
		{/if}
	{/if}
{/if}
