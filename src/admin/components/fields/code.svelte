<script lang="ts">
	import type { LanguageSupport } from "@codemirror/language";
	import CodeMirror from "svelte-codemirror-editor";
	import LabeledField from './labeled-field.svelte';

	const { field, value } = $props();

	const languages = {
		json: () => import('@codemirror/lang-json').then((m) => m.json()),
		js: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
		ts: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
		css: () => import('@codemirror/lang-css').then((m) => m.css()),
		html: () => import('@codemirror/lang-html').then((m) => m.html()),
		md: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
		php: () => import('@codemirror/lang-php').then((m) => m.php()),
		py: () => import('@codemirror/lang-python').then((m) => m.python()),
		sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
	}

	let code = $state(value || '\n\n\n\n');
	let lang = $state<LanguageSupport>();

	$effect(() => {
		const language = field.language || field.type === 'json' ? 'json' : undefined;

		if (language && languages[language]) {
			languages[language]().then((l) => (lang = l));
		}
	});
</script>

<LabeledField id={field.name} required={field.required}>
	<input type="hidden" name={field.name} value={code} />
	{#if lang}
		<CodeMirror bind:value={code} class="border rounded-md" tabSize={4} readonly={!!field.readonly} {lang} />
	{/if}
</LabeledField>
