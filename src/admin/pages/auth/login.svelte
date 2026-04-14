<script lang="ts">
	type AuthClient = ReturnType<typeof import('../../../auth/client').defineAuthClient>

	let { auth }: { auth: AuthClient } = $props()

	let email = $state('')
	let password = $state('')
	let rememberMe = $state(false)
	let errorMessage = $state('')
	let isSubmitting = $state(false)

	import { CodeXml } from '@lucide/svelte'
	import { Button } from '../../components/ui/button'
	import { Checkbox } from '../../components/ui/checkbox'
	import { Input } from '../../components/ui/input'
	import { Label } from '../../components/ui/label'

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		errorMessage = ''
		isSubmitting = true

		const { error } = await auth.signIn.email({
			email,
			password,
			rememberMe,
		})

		if (error) {
			errorMessage = error.message || 'Invalid email or password'
			isSubmitting = false
			return
		}

		window.location.href = '/admin'
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/40">
	<div class="w-full max-w-sm mx-auto space-y-6 p-6">
		<div class="flex flex-col items-center gap-3 mb-8">
			<div class="bg-primary text-primary-foreground flex items-center justify-center size-12 rounded-xl">
				<CodeXml class="size-6" />
			</div>
			<h1 class="text-xl font-semibold tracking-tight">Sign in to Admin</h1>
		</div>

		{#if errorMessage}
			<div class="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<form class="space-y-4" onsubmit={handleSubmit}>
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					type="email"
					id="email"
					name="email"
					placeholder="you@example.com"
					required
					autocomplete="email"
					bind:value={email}
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/admin/forgot-password" class="text-xs hover:underline">Forgot password?</a>
				</div>
				<Input
					type="password"
					id="password"
					name="password"
					placeholder="••••••••"
					required
					autocomplete="current-password"
					bind:value={password}
				/>
			</div>

			<div class="flex items-center">
				<Checkbox id="rememberMe" name="rememberMe" bind:checked={rememberMe} />
				<Label for="rememberMe" class="ml-2 text-sm cursor-pointer">Remember me</Label>
			</div>

			<Button type="submit" class="w-full mt-4" disabled={isSubmitting}>
				{isSubmitting ? 'Signing in…' : 'Sign in'}
			</Button>
		</form>

		<p class="text-center text-sm text-muted-foreground">
			Don't have an account? <a href="/admin/signup" class="text-primary hover:underline">Sign up</a>
		</p>
	</div>
</div>
