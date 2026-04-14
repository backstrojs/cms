<script lang="ts">
	import { setContext } from "svelte";
	import { Router } from 'sv-router';
	import * as Sidebar from './components/ui/sidebar';
	import AdminSidebar from './components/admin-sidebar.svelte';
	import AdminHeader from './components/admin-header.svelte';
	import { router as defaultRouter } from './router';
	import pages from './pages/auth';

	const { router = defaultRouter, auth, collections, groups, slug } = $props();

	let Page = $derived(pages[slug as keyof typeof pages])

	setContext('router', router);
	setContext('auth', auth);
	setContext('collections', collections);
	setContext('groups', groups);
</script>

{#if Page}
	<Page {auth} />
{:else}
	<Sidebar.Provider>
		<AdminSidebar />
		<div class="flex-1 min-w-0 h-screen">
			<AdminHeader />
			<main>
				<Router base="#" />
			</main>
		</div>
	</Sidebar.Provider>
{/if}
