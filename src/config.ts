import type { DiskDriver } from "@minimajs/disk";
import type { Dialect } from "kysely";
import type { Transporter } from "nodemailer";
import type { Config as TailwindConfig } from 'tailwindcss';

type Config = {
	auth: {
		adminRole: string;
		allowSignup: boolean;
	},
	database: {
		dialect: Dialect;
	},
	email: {
		from: string;
		transport: Transporter;
		tailwind?: TailwindConfig;
	},
	storage: Record<string, DiskDriver>;
}

type GlobalWithBackstroConfig = typeof globalThis & {
	__backstro_config?: Config | null;
};

const globalConfig = globalThis as GlobalWithBackstroConfig;

let config: Config | null = globalConfig.__backstro_config ?? null;

const defineConfig = (userConfig: Config) => {
	config = userConfig;
	globalConfig.__backstro_config = userConfig;

	return config;
}

export { config, defineConfig };
