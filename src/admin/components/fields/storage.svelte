<script lang="ts">
	import Dropzone from "../ui/dropzone/index.svelte";
	import LabeledField from './labeled-field.svelte';
	import { Button } from "../ui/button";
	import { X } from "@lucide/svelte";
	import { api } from "../../sdk";

	const { field, value } = $props();
	let uploading = $state(false);

	const onUpload = async (files) => {
		await Promise.allSettled(files.map(uploadFile));
	};
	const onreject = async ({ reason, file }) => {
		console.error(`${file.name} failed to upload!`, reason);
	};
	const uploadFile = async (file: File) => {
		// don't upload duplicate files
		if (files.find((f) => f.name === file.name)) return;

		uploading = true;

		const uploaded = await api.storage.upload(file, {
			driver: field.driver
		})

		files.push(uploaded);

		uploading = false;
	};
	const removeFile = async (file: UploadedFile) => {
		files = files.filter((f) => f.id !== file.id);
	};
	type UploadedFile = {
		id: string;
		filename: string;
		type: string;
		size: number;
		updatedAt: number;
		url: string;
	};
	let files = $state<UploadedFile[]>(field.multiple ? value || [] : value ? [value] : []);
</script>

<LabeledField id={field.name} required={field.required}>
	<div class="flex gap-4 flex-wrap">
		{#if files.length === 0}
			<input type="hidden" name={field.name} />
		{/if}
		{#each files as file (file.id)}
			<div class="space-y-2 w-36">
				<div class="relative group">
					<Button size="icon-sm" variant="default" class="absolute hidden group-hover:flex right-1 top-1" onclick={() => removeFile(file)}>
						<X class="size-4" />
					</Button>
					<img src={file.url} alt={file.filename} class="size-36 object-cover rounded-md" />
				</div>
				<div class="text-sm space-y-1">
					<div class="text-ellipsis overflow-hidden" title={file.filename}>{file.filename}</div>
					<div class="opacity-50 text-xs">
						{Math.round(file.size / 1024)}KB · {file.type}
					</div>
				</div>
				<input type="hidden" name={field.name} value={file.id} />
			</div>
		{/each}
	</div>
	<Dropzone onchange={onUpload} {onreject} multiple={field.multiple} accept={field.accept} {uploading}>
	</Dropzone>
</LabeledField>
