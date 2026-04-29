<script lang="ts">
	import { buttonVariants } from "../../components/ui/button";
	import Single from "./single.svelte";
	import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogFooter } from "../../components/ui/dialog";
	import { Input } from "../../components/ui/input";
	import { getContext } from "svelte";

	let open = $state(false);
	let newPassword = $state('');
	const authClient = getContext('auth');

	const changePassword = (userId) => {
		authClient.admin.setUserPassword({ userId, newPassword })
			.then(({ error }) => {
				if (error) {
					alert('Failed to update password!');
				} else {
					alert('Password updated successfully!');
					newPassword = '';
					open = false;
				}
			})
			.catch((err) => {
				console.error(err);
				alert('Failed to update password!');
			});

	};

	const create = async (data) => {
		const res = await authClient.admin.createUser({
			email: data.email,
			password: crypto.randomUUID(),
			name: data.name,
			role: data.role,
			data
		});

		return res.data.user;
	};
</script>

<Single {create}>
	{#snippet actions({ item })}
		{#if item}
			<Dialog bind:open>
				<DialogTrigger type="button" class={buttonVariants({ variant: 'outline' })}>
					Change password
				</DialogTrigger>
				<DialogContent>
					<DialogTitle>Change Password</DialogTitle>

					<Input type="password" placeholder="New password" class="w-full mt-4" bind:value={newPassword} />

					<DialogFooter>
						<button class={buttonVariants({ variant: 'outline' })} onclick={() => {newPassword = ''; open = false;}}>
							Cancel
						</button>
						<button class={buttonVariants()} onclick={() => changePassword(item.id)}>
							Update
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		{/if}
	{/snippet}
</Single>
