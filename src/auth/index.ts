import { betterAuth, type BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins"
import { betterAuthAdapter } from "./auth-adapter";

export const defineAuth = (db, config: Partial<BetterAuthOptions>) => betterAuth({
	baseURL: process.env.AUTH_URL!,
	basePath: '/auth',
	secret: process.env.AUTH_SECRET!,
	...config,
	database: betterAuthAdapter(db),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		...config.emailAndPassword,
	},
	advanced: {
		ipAddress: {
			ipAddressHeaders: [ 'x-forwarded-for', 'cf-connecting-ip', 'fastly-client-ip', 'true-client-ip', 'x-real-ip', 'x-cluster-client-ip', 'x-forwarded', 'forwarded-for', 'forwarded' ],
		},
		useSecureCookies: true,
		...config.advanced,
	},
	rateLimit: {
		enabled: true,
		storage: 'database',
		max: 100,
		window: 60,
		...config.rateLimit,
	},
	emailVerification: {
		expiresIn: 60 * 60 * 24, // 24 hours
		...config.emailVerification,
	},
	user: {
		...config.user,
		fields: {
			image: 'avatar',
			...config.user?.fields,
		},
		additionalFields: {
			role: {
				type: 'string',
				defaultValue: 'user',
			},
			...config.user?.additionalFields,
		},
	},
	plugins: [
		admin(),
		...(config.plugins || []),
	],
});
