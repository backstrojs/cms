<script lang="ts">
	import { onMount } from "svelte";
	import LabeledField from './labeled-field.svelte';

	const { field, value } = $props();

	import undo from 'lucide-static/icons/undo.svg?raw';
	import redo from 'lucide-static/icons/redo.svg?raw';
	import link from 'lucide-static/icons/link.svg?raw';
	import bold from 'lucide-static/icons/bold.svg?raw';
	import italic from 'lucide-static/icons/italic.svg?raw';
	import underline from 'lucide-static/icons/underline.svg?raw';
	import image from 'lucide-static/icons/image.svg?raw';
	import table from 'lucide-static/icons/grid-2x2.svg?raw';
	import code from 'lucide-static/icons/code-xml.svg?raw'
	import strikethrough from 'lucide-static/icons/strikethrough.svg?raw';
	import highlighter from 'lucide-static/icons/highlighter.svg?raw';
	import baseline from 'lucide-static/icons/baseline.svg?raw';
	import play from 'lucide-static/icons/square-play.svg?raw';

	onMount(() => {
		tinymce.init({
			selector: '#' + field.name,
			license_key: 'gpl',
			branding: false,
			menubar: false,
			plugins: 'quickbars link lists image table code codesample autolink media wordcount accordion autoresize',
			toolbar:
				'undo redo | styles fontsize | bold italic underline | alignleft aligncenter alignright alignjustify lineheight | bullist numlist outdent indent | image media codesample table hr accordion | removeformat code',
			invalid_elements: 'script',
			paste_remove_styles: true,
			paste_remove_spans: true,
			image_uploadtab: true,
			image_dimensions: false,
			quickbars_selection_toolbar: 'bold italic underline backcolor forecolor | quicklink blockquote',
			quickbars_image_toolbar: 'fullsizeimage wideimage oversizeimage leftimage rightimage | imageproperties',
			quickbars_insert_toolbar: false,
			min_height: 350,
			max_height: 800,
			async images_upload_handler(blobInfo) {
				return 'data:' + blobInfo.blob().type + ';base64,' + blobInfo.base64();
			},
			formats: {
				fullsize_image: {
					selector: 'img,figure',
					classes: ['fullsize'],
					ceFalseOverride: true
				},
				wide_image: {
					selector: 'img,figure',
					classes: ['wide'],
					ceFalseOverride: true
				},
				oversize_image: {
					selector: 'img,figure',
					classes: ['oversize'],
					ceFalseOverride: true
				},
				left_image: {
					selector: 'img,figure',
					classes: ['left'],
					ceFalseOverride: true
				},
				right_image: {
					selector: 'img,figure',
					classes: ['right'],
					ceFalseOverride: true
				},
			},
			setup(editor) {
				editor.ui.registry.addIcon('undo', undo);
				editor.ui.registry.addIcon('redo', redo);
				editor.ui.registry.addIcon('link', link);
				editor.ui.registry.addIcon('bold', bold);
				editor.ui.registry.addIcon('italic', italic);
				editor.ui.registry.addIcon('underline', underline);
				editor.ui.registry.addIcon('image', image);
				editor.ui.registry.addIcon('table', table);
				editor.ui.registry.addIcon('sourcecode', code);
				editor.ui.registry.addIcon('strike-through', strikethrough);
				editor.ui.registry.addIcon('highlight-bg-color', highlighter);
				editor.ui.registry.addIcon('text-color', baseline);
				editor.ui.registry.addIcon('embed', play);

				editor.ui.registry.addIcon('line-height', '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="fill: none;"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 10V5m0 0L4 7m2-2 2 2m-2 7v5m0 0 2-2m-2 2-2-2m8-10h8m0 5h-8m0 5h8"/></svg>');
				editor.ui.registry.addIcon('wideimage', '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M0 0H24V24H0z"/><path fill="currentColor" d="M5 3H19V5H5z"/><path fill="currentColor" d="M5 19H19V21H5z"/><path fill="currentColor" d="M3 7H21V17H3z"/></g></svg>');
				editor.ui.registry.addIcon('oversizeimage', '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M0 0H24V24H0z"/><path fill="currentColor" d="M0 7H24V17H0z"/><path fill="currentColor" d="M5 3H19V5H5z"/><path fill="currentColor" d="M5 19H19V21H5z"/></g></svg>');
				editor.ui.registry.addIcon('fullsizeimage', '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M0 0H24V24H0z"/><path fill="currentColor" d="M3 3H21V5H3z"/><path fill="currentColor" d="M3 7H21V17H3z"/><path fill="currentColor" d="M3 19H21V21H3z"/></g></svg>');
				editor.ui.registry.addIcon('leftimage', '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M0 0H24V24H0z"/><path fill="currentColor" d="M3 3H21V5H3z"/><path fill="currentColor" d="M3 7H13V17H3z"/><path fill="currentColor" d="M15 8H21V9H15z"/><path fill="currentColor" d="M15 11H21V12H15z"/><path fill="currentColor" d="M15 14H21V15H15z"/><path fill="currentColor" d="M3 19H21V21H3z"/></g></svg>');
				editor.ui.registry.addIcon('rightimage', '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M0 0H24V24H0z"/><path fill="currentColor" d="M3 3H21V5H3z"/><path fill="currentColor" d="M11 7H21V17H11z"/><path fill="currentColor" d="M3 8H9V9H3z"/><path fill="currentColor" d="M3 11H9V12H3z"/><path fill="currentColor" d="M3 14H9V15H3z"/><path fill="currentColor" d="M3 19H21V21H3z"/></g></svg>');

				editor.ui.registry.addToggleButton('wideimage', {
					icon: 'wideimage',
					onAction: (api) => {
						editor.execCommand('mceToggleFormat', false, 'wide_image');

						editor.formatter.remove('oversize_image');
						editor.formatter.remove('left_image');
						editor.formatter.remove('right_image');
						editor.formatter.remove('fullsize_image');
					},
					onSetup: (buttonApi) => {
						// Highlight this button if the selected image already has the format applied
						buttonApi.setActive(editor.formatter.match('wide_image'));
						let change = editor.formatter.formatChanged('wide_image', (state) => buttonApi.setActive(state));
						return () => {
							change.unbind();
						};
					},
				});
				editor.ui.registry.addToggleButton('oversizeimage', {
					icon: 'oversizeimage',
					onAction: (api) => {
						editor.execCommand('mceToggleFormat', false, 'oversize_image');
						editor.formatter.remove('wide_image');
						editor.formatter.remove('left_image');
						editor.formatter.remove('right_image');
						editor.formatter.remove('fullsize_image');
					},
					onSetup: (buttonApi) => {
						buttonApi.setActive(editor.formatter.match('oversize_image'));
						let change = editor.formatter.formatChanged('oversize_image', (state) => buttonApi.setActive(state));
						return () => {
							change.unbind();
						};
					},
				});
				editor.ui.registry.addToggleButton('fullsizeimage', {
					icon: 'fullsizeimage',
					onAction: (api) => {
						editor.execCommand('mceToggleFormat', false, 'fullsize_image');
						editor.formatter.remove('wide_image');
						editor.formatter.remove('oversize_image');
						editor.formatter.remove('left_image');
						editor.formatter.remove('right_image');
					},
					onSetup: (buttonApi) => {
						buttonApi.setActive(editor.formatter.match('fullsize_image'));
						let change = editor.formatter.formatChanged('fullsize_image', (state) => buttonApi.setActive(state));
						return () => {
							change.unbind();
						};
					},
				});
				editor.ui.registry.addToggleButton('leftimage', {
					icon: 'leftimage',
					onAction: (api) => {
						editor.execCommand('mceToggleFormat', false, 'left_image');
						editor.formatter.remove('wide_image');
						editor.formatter.remove('oversize_image');
						editor.formatter.remove('right_image');
						editor.formatter.remove('fullsize_image');
					},
					onSetup: (buttonApi) => {
						buttonApi.setActive(editor.formatter.match('left_image'));
						let change = editor.formatter.formatChanged('left_image', (state) => buttonApi.setActive(state));
						return () => {
							change.unbind();
						};
					},
				});
				editor.ui.registry.addToggleButton('rightimage', {
					icon: 'rightimage',
					onAction: (api) => {
						editor.execCommand('mceToggleFormat', false, 'right_image');
						editor.formatter.remove('wide_image');
						editor.formatter.remove('oversize_image');
						editor.formatter.remove('left_image');
						editor.formatter.remove('fullsize_image');
					},
					onSetup: (buttonApi) => {
						buttonApi.setActive(editor.formatter.match('right_image'));
						let change = editor.formatter.formatChanged('right_image', (state) => buttonApi.setActive(state));
						return () => {
							change.unbind();
						};
					},
				});
				editor.ui.registry.addButton('imageproperties', {
					icon: 'image-options',
					onAction: (api) => {
						// the mceImage command opens the image properties dialog
						// https://www.tiny.cloud/docs/tinymce/latest/image/#commands
						editor.execCommand('mceImage');
					}
				});
			},
			content_style: `
				body {
					margin-left: auto;
					margin-right: auto;
					width: 80%;
				}
				img.wide {
					display: block;
					height: auto;
					width: 110%;
					transform: translateX(-50%);
					margin-left: 50%;
				}
				figure.image.wide {
					display: block;
					height: auto;
					width: 110%;
				}
				img.oversize {
					height: auto;
					margin-left: calc((100vw - 100%) / 2 * -1);
					max-width: 100vw;
					width: 100vw;
				}
				figure.image.oversize {
					display: block;
					height: auto;
					height: auto;
					max-width: 100vw;
					width: 100vw;
				}
				img.fullsize {
					display: block;
					height: auto;
					max-width: 100%;
				}
				figure.image.fullsize {
					display: block;
					height: auto;
					max-width: 100%;
				}
				img.left {
					float: left;
					margin-right: 1em;
					max-width: 50%;
					height: auto;
				}
				figure.image.left {
					float: left;
					margin-right: 1em;
					max-width: 50%;
					height: auto;
				}
				img.right {
					float: right;
					margin-left: 1em;
					max-width: 50%;
					height: auto;
				}
				figure.image.right {
					float: right;
					margin-left: 1em;
					max-width: 50%;
					height: auto;
				}

				figure.image img,
				figure.image.left img,
				figure.image.right img,
				figure.image.wide img,
				figure.image.oversize img {
					height: auto;
					max-width: 100%;
					width: 100%;
				}
			`,
		});
	});
</script>

<LabeledField id={field.name} required={field.required}>
	<textarea id={field.name} name={field.name}>{value}</textarea>
</LabeledField>
