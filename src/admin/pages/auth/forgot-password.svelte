<script lang="ts">
	type AuthClient = ReturnType<typeof import('../../../auth/client').defineAuthClient>

	let { auth }: { auth: AuthClient } = $props()

	let email = $state('')
	let errorMessage = $state('')
	let successMessage = $state('')
	let isSubmitting = $state(false)

	import { CodeXml } from '@lucide/svelte'
	import { Button } from '../../components/ui/button'
	import { Input } from '../../components/ui/input'
	import { Label } from '../../components/ui/label'

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		errorMessage = ''
		successMessage = ''
		isSubmitting = true

		const redirectTo = new URL('/admin/reset-password', window.location.origin).toString()
		const { error } = await auth.requestPasswordReset({
			email,
			redirectTo,
		})

		if (error) {
			errorMessage = error.message === "Reset password isn't enabled"
				? 'Password reset is not configured yet. Contact an administrator.'
				: error.message || 'Could not send reset link'
			isSubmitting = false
			return
		}

		successMessage = 'Check your inbox for the reset link.'
		email = ''
		isSubmitting = false
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/40">
	<div class="w-full max-w-sm mx-auto space-y-6 p-6">
		<div class="flex flex-col items-center gap-3 mb-8">
			<div class="bg-primary text-primary-foreground flex items-center justify-center size-12 rounded-xl">
				<CodeXml class="size-6" />
			</div>
			<h1 class="text-xl font-semibold tracking-tight">Reset your password</h1>
			<p class="text-center text-sm text-muted-foreground">
				Enter your email and we'll send you a reset link.
			</p>
		</div>

		{#if errorMessage}
			<div class="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div class="rounded-md border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
				{successMessage}
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

			<Button type="submit" class="w-full mt-4" disabled={isSubmitting}>
				{isSubmitting ? 'Sending link…' : 'Send reset link'}
			</Button>
		</form>

		<p class="text-center text-sm text-muted-foreground">
			Remembered your password? <a href="/admin/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</div>
</div>
