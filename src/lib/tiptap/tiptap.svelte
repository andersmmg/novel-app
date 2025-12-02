<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as ButtonGroup from "$lib/components/ui/button-group";
	import type { StoryFile } from "$lib/story";
	import { combineFrontmatter, separateFrontmatter } from "$lib/story/utils";
	import {
		BoldIcon,
		Heading1Icon,
		Heading2Icon,
		ItalicIcon,
		Pilcrow,
	} from "@lucide/svelte";
	import { Editor } from "@tiptap/core";
	import { Placeholder } from "@tiptap/extensions/placeholder";
	import { Markdown } from "@tiptap/markdown";
	import { StarterKit } from "@tiptap/starter-kit";
	import { onDestroy, onMount } from "svelte";

	let {
		currentFile,
		onContentChange,
	}: {
		currentFile: StoryFile | null;
		onContentChange?: (
			content: string,
			frontmatter: string,
			metadata: any,
		) => void;
	} = $props();

	let element = $state<HTMLElement>();
	let editorState = $state({ editor: null as Editor | null });
	let previousFileId = $state<string | null>(null);

	$effect(() => {
		if (!editorState.editor) return;

		const currentFileId = currentFile?.path || null;
		const currentFileChanged = previousFileId !== currentFileId;

		if (currentFileChanged) {
			console.log("Tiptap: File changed, updating content");
			previousFileId = currentFileId;

			// Separate frontmatter from content
			const { content: cleanContent } = separateFrontmatter(
				currentFile?.content || "",
			);
			const currentContent = editorState.editor.getMarkdown();

			if (cleanContent !== currentContent) {
				editorState.editor.commands.setContent(cleanContent, {
					contentType: "markdown",
				});
			}
		}
	});

	onMount(() => {
		// Separate frontmatter from initial content
		const { content: initialContent } = separateFrontmatter(
			currentFile?.content || "",
		);

		editorState.editor = new Editor({
			element: element,
			extensions: [
				Markdown,
				Placeholder.configure({
					placeholder: "Start writing...",
				}),
				StarterKit.configure({
					horizontalRule: {
						HTMLAttributes: {
							class: "border-t border-border",
						},
					},
				}),
			],
			editorProps: {
				attributes: {
					class: "px-4 outline-none min-h-full",
					style: "min-height: 100%;",
				},
			},
			content: initialContent,
			contentType: "markdown",
			onTransaction: ({ editor }) => {
				editorState = { editor };
			},
			onUpdate: ({ editor }) => {
				if (onContentChange && currentFile) {
					const newContent = editor.getMarkdown();
					const { frontmatter, metadata } = separateFrontmatter(
						currentFile.content || "",
					);

					// Update with new content but preserve existing frontmatter
					const updatedFullContent = combineFrontmatter(
						frontmatter,
						newContent,
					);
					onContentChange(updatedFullContent, frontmatter, metadata);
				}
			},
		});

		previousFileId = currentFile?.path || null;
	});

	onDestroy(() => {
		editorState.editor?.destroy();
	});
</script>

<div class="flex flex-col h-full w-full">
	{#if editorState.editor}
		<div class="p-2 pr-4 bg-background flex gap-2 items-center border-b">
			<!-- Headings -->
			<ButtonGroup.Root>
				<Button
					size="sm"
					variant="outline"
					onclick={() =>
						editorState
							.editor!.chain()
							.focus()
							.toggleHeading({ level: 1 })
							.run()}><Heading1Icon /></Button
				>
				<Button
					size="sm"
					variant="outline"
					onclick={() =>
						editorState
							.editor!.chain()
							.focus()
							.toggleHeading({ level: 2 })
							.run()}><Heading2Icon /></Button
				>
				<Button
					size="sm"
					variant="outline"
					onclick={() =>
						editorState
							.editor!.chain()
							.focus()
							.setParagraph()
							.run()}><Pilcrow /></Button
				>
			</ButtonGroup.Root>
			<!-- Formatting -->
			<ButtonGroup.Root>
				<Button
					size="sm"
					variant={editorState.editor.isActive("bold")
						? "default"
						: "outline"}
					onclick={() =>
						editorState.editor!.chain().focus().toggleBold().run()}
					><BoldIcon /></Button
				>
				<Button
					size="sm"
					variant={editorState.editor.isActive("italic")
						? "default"
						: "outline"}
					onclick={() =>
						editorState
							.editor!.chain()
							.focus()
							.toggleItalic()
							.run()}><ItalicIcon /></Button
				>
			</ButtonGroup.Root>
		</div>
	{/if}

	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (only a mouse ux improvement) -->
	<div
		bind:this={element}
		class="flex-1 min-h-[400px] w-full prose **:text-foreground cursor-text max-w-none overflow-y-auto"
		onmouseup={() => {
			if (editorState.editor) {
				if (!editorState.editor.isFocused)
					editorState.editor.chain().focus("end").run();
			}
		}}
	></div>
</div>
