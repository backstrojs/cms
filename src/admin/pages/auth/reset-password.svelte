<script lang="ts">
	import { onMount } from 'svelte'
	import { CodeXml } from '@lucide/svelte'
	import { Button } from '../../components/ui/button'
	import { Input } from '../../components/ui/input'
	import { Label } from '../../components/ui/label'

	type AuthClient = ReturnType<typeof import('../../../auth/client').defineAuthClient>

	let { auth }: { auth: AuthClient } = $props()

	let token = $state('')
	let errorParam = $state('')
	let password = $state('')
	let repeatPassword = $state('')
	let errorMessage = $state('')
	let successMessage = $state('')
	let isReady = $state(false)
	let isSubmitting = $state(false)
	let hasSucceeded = $state(false)
	let redirectTimer: number | undefined

	let isInvalidToken = $derived(isReady && (errorParam === 'INVALID_TOKEN' || !token))

	onMount(() => {
		const searchParams = new URLSearchParams(window.location.search)
		token = searchParams.get('token') ?? ''
		errorParam = searchParams.get('error') ?? ''
		isReady = true

		return () => {
			if (redirectTimer) {
				window.clearTimeout(redirectTimer)
			}
		}
	})

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault()

		errorMessage = ''
		successMessage = ''

		if (password !== repeatPassword) {
			errorMessage = 'Passwords do not match'
			return
		}

		isSubmitting = true

		const { error } = await auth.resetPassword({
			newPassword: password,
			token,
		})

		if (error) {
			switch (error.message) {
				case 'Invalid token':
					errorMessage = 'This reset link is invalid or has expired. Request a new one.'
					break
				case 'Password too short':
					errorMessage = 'Password must be at least 8 characters long.'
					break
				case 'Password too long':
					errorMessage = 'Password is too long.'
					break
				default:
					errorMessage = error.message || 'Could not reset password'
			}

			isSubmitting = false
			return
		}

		hasSucceeded = true
		successMessage = 'Your password has been updated. Redirecting to sign in…'
		password = ''
		repeatPassword = ''
		isSubmitting = false

		redirectTimer = window.setTimeout(() => {
			window.location.href = '/admin/login'
		}, 1200)
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/40">
	<div class="w-full max-w-sm mx-auto space-y-6 p-6">
		<div class="flex flex-col items-center gap-3 mb-8">
			<div class="bg-primary text-primary-foreground flex items-center justify-center size-12 rounded-xl">
				<CodeXml class="size-6" />
			</div>
			<h1 class="text-xl font-semibold tracking-tight">Set a new password</h1>
			<p class="text-center text-sm text-muted-foreground">
				Choose a new password for your admin account.
			</p>
		</div>

		{#if isReady && isInvalidToken}
			<div class="space-y-4">
				<div class="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
					This reset link is invalid or has expired. Request a new password reset email.
				</div>
				<Button href="/admin/forgot-password" class="w-full">
					Request new link
				</Button>
			</div>
		{:else if isReady}
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
					<Label for="password">New password</Label>
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

				<Button type="submit" class="w-full mt-4" disabled={isSubmitting || hasSucceeded}>
					{hasSucceeded ? 'Password updated' : isSubmitting ? 'Resetting password…' : 'Reset password'}
				</Button>
			</form>
		{/if}

		<p class="text-center text-sm text-muted-foreground">
			Back to <a href="/admin/login" class="text-primary hover:underline">Sign in</a>
		</p>
	</div>
</div>
