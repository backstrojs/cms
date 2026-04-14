<script lang="ts">
	type AuthClient = ReturnType<typeof import('../../../auth/client').defineAuthClient>

	let { auth }: { auth: AuthClient } = $props()

	let name = $state('')
	let email = $state('')
	let password = $state('')
	let repeatPassword = $state('')
	let errorMessage = $state('')
	let isSubmitting = $state(false)

	import { CodeXml } from '@lucide/svelte'
	import { Button } from '../../components/ui/button'
	import { Input } from '../../components/ui/input'
	import { Label } from '../../components/ui/label'

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		errorMessage = ''

		if (password !== repeatPassword) {
			errorMessage = 'Passwords do not match'
			return
		}

		isSubmitting = true

		const { error } = await auth.signUp.email({
			name,
			email,
			password,
		})

		if (error) {
			errorMessage = error.message || 'Could not create account'
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
			<h1 class="text-xl font-semibold tracking-tight">Create an account</h1>
			<p class="text-muted-foreground text-sm">Enter your details to get started</p>
		</div>

		{#if errorMessage}
			<div class="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<form class="space-y-4" onsubmit={handleSubmit}>
			<div class="space-y-2">
				<Label for="name">Name</Label>
				<Input
					type="text"
					id="name"
					name="name"
					placeholder="Your name"
					required
					autocomplete="name"
					bind:value={name}
				/>
			</div>

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
				<Label for="password">Password</Label>
				<Input
					type="password"
					id="password"
					name="password"
					placeholder="••••••••"
					required
					minlength={8}
					autocomplete="new-password"
					bind:value={password}
				/>
			</div>

			<div class="space-y-2">
				<Label for="repeatPassword">Repeat password</Label>
				<Input
					type="password"
					id="repeatPassword"
					name="repeatPassword"
					placeholder="••••••••"
					required
					minlength={8}
					autocomplete="new-password"
					bind:value={repeatPassword}
				/>
			</div>

			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Creating account…' : 'Create account'}
			</Button>
		</form>

		<p class="text-center text-sm text-muted-foreground">
			Already have an account? <a href="/admin/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</div>
</div>
