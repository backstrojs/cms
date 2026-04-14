<script lang="ts">
	import { Sidebar, SidebarHeader, SidebarContent, SidebarMenuButton, SidebarMenuItem, SidebarMenu, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarFooter, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarRail } from './ui/sidebar';
	import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
	import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
	import { ChevronRight, ChevronsUpDown, CodeXml, Folder, LogOut } from '@lucide/svelte';
	import { getContext } from "svelte";

	const groups = getContext('groups');
	const authClient = getContext('auth');
	const { route } = getContext('router');

	let user = $state();

	authClient.getSession().then(({ data, error }) => {
		if (error || !data) {
			console.error("Error fetching session:", error);

			window.location.href = "/admin/login";
			return;
		}

		user = data.user;
	})


	const signOut = () => {
		authClient.signOut();
		window.location.href = '/admin/login';
	};

	const isLinkActive = (href: string) => {
		const hash = '#' + route.pathname
		return href === hash || hash.startsWith(href + '/');
	};
</script>

<Sidebar collapsible="icon">
	<SidebarHeader>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg">
					<div
						class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
					>
						<CodeXml />
					</div>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-semibold">Backstro</span>
						<span class="text-sidebar-foreground/70 truncate text-xs">Enterprise</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarHeader>

	<SidebarContent>
		{#each Object.values(groups) as group}
			<SidebarGroup>
				{#if group.title}
					<SidebarGroupLabel class="capitalize opacity-50">{group.title}</SidebarGroupLabel>
				{/if}
				<SidebarGroupContent>
					<SidebarMenu>
						{#each group.items as item}
							{#if item.items}
								<Collapsible class="group/collapsible" open={isLinkActive(item.url)}>
									<SidebarMenuItem>
										<CollapsibleTrigger>
											<SidebarMenuButton tooltipContent={item.title} class="capitalize">
												{#if item.icon}
													<item.icon />
												{:else}
													<Folder />
												{/if}
												<span>{item.title}</span>
												<ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
											</SidebarMenuButton>
										</CollapsibleTrigger>
									</SidebarMenuItem>
										<CollapsibleContent>
											<SidebarMenuSub>
												{#each item.items as subItem}
													<SidebarMenuSubItem>
														<SidebarMenuSubButton href={subItem.url} class="capitalize">
															<span>{subItem.title}</span>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												{/each}
											</SidebarMenuSub>
										</CollapsibleContent>

								</Collapsible>
							{:else}
								<SidebarMenuItem>
									<SidebarMenuButton tooltipContent={item.title} class="capitalize text-muted-foreground" isActive={isLinkActive(item.url)}>
										{#snippet child({ props })}
											<a href={item.url} {...props}>
												{#if item.icon}
													<item.icon stroke-width={1.5} />
												{/if}
												<span>{item.title}</span>
											</a>
										{/snippet}
									</SidebarMenuButton>
								</SidebarMenuItem>
							{/if}
						{/each}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		{/each}
	</SidebarContent>

	{#if user}
		<SidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger>
							{#snippet child({ props })}
								<SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" {...props}>
									<div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold uppercase">
										{user.name ? user.name.substring(0, 2) : user.email.substring(0, 2)}
									</div>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-semibold">{user.name || 'User'}</span>
										<span class="text-sidebar-foreground/70 truncate text-xs">{user.email}</span>
									</div>
									<ChevronsUpDown class="ml-auto size-4" />
								</SidebarMenuButton>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent side="top" class="min-w-56 rounded-lg">
							<DropdownMenuItem id="sign-out-btn" class="cursor-pointer" onclick={signOut}>
								<LogOut class="size-4 mr-2" />
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarFooter>
	{/if}

	<SidebarRail />
</Sidebar>
