import { createAuthClient, type BetterAuthClientOptions } from 'better-auth/client'
import { inferAdditionalFields, adminClient } from "better-auth/client/plugins";

export const defineAuthClient = (options: Partial<BetterAuthClientOptions> = {}): ReturnType<typeof createAuthClient> => createAuthClient({
	basePath: '/auth',
	...options,
	plugins: [
		inferAdditionalFields(),
		adminClient(),
		...(options.plugins || []),
	],
})
