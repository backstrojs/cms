declare module '*.astro' {
	const component: any;
	export default component;
}

declare module '*.svelte' {
	const component: any;
	export default component;
}

declare global {
	interface Window {
		auth: any;
	}
}

export {};
