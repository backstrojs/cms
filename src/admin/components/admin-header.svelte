<script lang="ts">
	import { SidebarTrigger } from './ui/sidebar';
	import page from '../state/page.svelte';
</script>

<header class="flex h-12 shrink-0 items-center gap-2 px-2 min-w-0">
	<SidebarTrigger />

	<nav class="flex items-center gap-2 text-sm overflow-hidden">
		{#each page.breadcrumbs as breadcrumb, i (breadcrumb.name)}
			{#if breadcrumb.href}
				<a href={breadcrumb.href} class="text-gray-500 hover:text-gray-700">
					{breadcrumb.name}
				</a>
			{:else}
				<span class="text-gray-700 text-ellipsis text-nowrap">
					{breadcrumb.name}
				</span>
			{/if}
			{i < page.breadcrumbs.length - 1 ? ' / ' : ''}
		{/each}
	</nav>
</header>
