<script>
	import { fromEvent } from 'file-selector';
	import { LoaderCircle, UploadIcon } from '@lucide/svelte';
	import {
		fileAccepted,
		fileMatchSize,
		isEvtWithFiles,
		isIeOrEdge,
		isPropagationStopped,
	} from './utils';

	let {
		accept = undefined,
		disabled = false,
		uploading = false,
		maxSize = Infinity,
		minSize = 0,
		multiple = true,
		preventDropOnDocument = true,
		noClick = false,
		noKeyboard = false,
		noDrag = false,
		noDragEventsBubbling = false,
		containerClasses = '',
		disableDefaultStyles = false,
		name = '',
		inputElement = $bindable(undefined),
		onchange = null,
		onreject = null,
		required = false,
		children = null,
		...restProps
	} = $props();

	let state = $state({
		isDragAccept: false,
		isDragReject: false,
		draggedFiles: [],
		acceptedFiles: [],
	});

	let rootRef;
	let dragTargetsRef = $state([]);

	const composeHandler = $derived((fn) => (disabled ? null : fn));
	const composeKeyboardHandler = $derived((fn) => (noKeyboard ? null : composeHandler(fn)));
	const composeDragHandler = $derived((fn) => (noDrag ? null : composeHandler(fn)));

	function resetState() {
		state.draggedFiles = [];
		state.acceptedFiles = [];
	}

	// Fn for opening the file dialog programmatically
	function openFileDialog() {
		if (inputElement) {
			inputElement.value = null; // TODO check if null needs to be set
			inputElement.click();
		}
	}

	// Cb to open the file dialog when SPACE/ENTER occurs on the dropzone
	function onKeyDownCb(event) {
		// Ignore keyboard events bubbling up the DOM tree
		if (!rootRef || !rootRef.isEqualNode(event.target)) {
			return;
		}

		if (event.keyCode === 32 || event.keyCode === 13) {
			event.preventDefault();
			openFileDialog();
		}
	}

	// Cb to open the file dialog when click occurs on the dropzone
	function onClickCb() {
		if (noClick) {
			return;
		}

		// In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
		// to ensure React can handle state changes
		// See: https://github.com/react-dropzone/react-dropzone/issues/450
		if (isIeOrEdge()) {
			setTimeout(openFileDialog, 0);
		} else {
			openFileDialog();
		}
	}

	function onDragEnterCb(event) {
		event.preventDefault();
		stopPropagation(event);

		dragTargetsRef = [...dragTargetsRef, event.target];

		if (isEvtWithFiles(event)) {
			fromEvent(event).then((draggedFiles) => {
				if (isPropagationStopped(event) && !noDragEventsBubbling) {
					return;
				}

				state.draggedFiles = draggedFiles;
			});
		}
	}

	function onDragOverCb(event) {
		event.preventDefault();
		stopPropagation(event);

		if (event.dataTransfer) {
			try {
				event.dataTransfer.dropEffect = 'copy';
			} catch {} /* eslint-disable-line no-empty */
		}

		return false;
	}

	function onDragLeaveCb(event) {
		event.preventDefault();
		stopPropagation(event);

		// Only deactivate once the dropzone and all children have been left
		const targets = dragTargetsRef.filter((target) => rootRef && rootRef.contains(target));
		// Make sure to remove a target present multiple times only once
		// (Firefox may fire dragenter/dragleave multiple times on the same element)
		const targetIdx = targets.indexOf(event.target);
		if (targetIdx !== -1) {
			targets.splice(targetIdx, 1);
		}
		dragTargetsRef = targets;
		if (targets.length > 0) {
			return;
		}

		state.draggedFiles = [];
	}

	function onDropCb(event) {
		event.preventDefault();
		stopPropagation(event);

		dragTargetsRef = [];

		if (isEvtWithFiles(event)) {
			fromEvent(event).then((files) => {
				if (isPropagationStopped(event) && !noDragEventsBubbling) {
					return;
				}

				const acceptedFiles = [];

				files.forEach((file) => {
					const [accepted, acceptError] = fileAccepted(file, accept);
					const [sizeMatch, sizeError] = fileMatchSize(file, minSize, maxSize);

					if (accepted && sizeMatch) {
						acceptedFiles.push(file);
					} else if (onreject) {
						onreject({ error: acceptError || sizeError, file });
					}
				});

				if (!multiple && acceptedFiles.length > 1) {
					acceptedFiles.splice(0);
				}

				// Files dropped keep input in sync
				if (event.dataTransfer) {
					inputElement.files = event.dataTransfer.files;
				}

				state.acceptedFiles = acceptedFiles;

				if (onchange) {
					onchange(acceptedFiles, event);
				}
			});
		}
		resetState();
	}

	function stopPropagation(event) {
		if (noDragEventsBubbling) {
			event.stopPropagation();
		}
	}

	// allow the entire document to be a drag target
	function onDocumentDragOver(event) {
		if (preventDropOnDocument) {
			event.preventDefault();
		}
	}

	function onDocumentDrop(event) {
		if (!preventDropOnDocument) {
			return;
		}
		if (rootRef && rootRef.contains(event.target)) {
			// If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
			return;
		}
		event.preventDefault();
		dragTargetsRef = [];
	}

	$effect(() => {
		return () => {
			// This is critical for canceling the timeout behaviour on `onWindowFocus()`
			inputElement = null;
		};
	});

	function onInputElementClick(event) {
		event.stopPropagation();
	}
</script>

<svelte:window ondragover={onDocumentDragOver} ondrop={onDocumentDrop} />

<div
	bind:this={rootRef}
	tabindex="0"
	role="button"
	class="{disableDefaultStyles ? '' : 'flex-1 flex flex-col items-center p-6 border border-input rounded-md active:bg-muted'} {containerClasses}"
	onkeydown={composeKeyboardHandler(onKeyDownCb)}
	onclick={composeHandler(onClickCb)}
	ondragenter={composeDragHandler(onDragEnterCb)}
	ondragover={composeDragHandler(onDragOverCb)}
	ondragleave={composeDragHandler(onDragLeaveCb)}
	ondrop={composeDragHandler(onDropCb)}
	{...restProps}
>
	<input
		accept={accept?.toString()}
		{multiple}
		{required}
		type="file"
		{name}
		autocomplete="off"
		tabindex="-1"
		onchange={onDropCb}
		onclick={onInputElementClick}
		bind:this={inputElement}
		style="display: none;"
	/>
	{#if children}
		{@render children()}
	{:else}
		<div
			class="border-border text-muted-foreground flex size-14 place-items-center justify-center rounded-full border border-dashed"
		>
			{#if uploading}
				<LoaderCircle class="size-7 animate-spin" />
			{:else}
				<UploadIcon class="size-7" />
			{/if}
		</div>
		<div class="text-center text-muted-foreground mt-4">
			Drop files here, or click to select files
		</div>
	{/if}
</div>
