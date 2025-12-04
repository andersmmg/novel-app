<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as ButtonGroup from "$lib/components/ui/button-group";
	import { config } from "$lib/config/config-store.svelte";
	import type { StoryFile } from "$lib/story";
	import { combineFrontmatter, separateFrontmatter } from "$lib/story/utils";
	import {
		ArrowDownToLine,
		ArrowUpToLine,
		BoldIcon,
		Heading1Icon,
		Heading2Icon,
		ItalicIcon,
		MinusIcon,
		Pilcrow,
		PlusIcon,
		UnfoldHorizontalIcon,
	} from "@lucide/svelte";
	import { Editor } from "@tiptap/core";
	import { Placeholder } from "@tiptap/extensions/placeholder";
	import { Markdown } from "@tiptap/markdown";
	import { StarterKit } from "@tiptap/starter-kit";
	import { onDestroy, onMount } from "svelte";

	let {
		currentFile,
		onContentChange,
		fileType = "File",
	}: {
		currentFile: StoryFile | null;
		onContentChange?: (
			content: string,
			frontmatter: string,
			metadata: any,
		) => void;
		fileType?: string;
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

			focusOpenPosition();
		}
	});

	function focusOpenPosition() {
		if (!editorState.editor) return;

		if (fileType === "Chapter") {
			editorState.editor
				.chain()
				.focus($config?.chapterOpenPosition || "start")
				.scrollIntoView()
				.run();
		} else if (fileType === "Note") {
			editorState.editor.chain().focus("start").scrollIntoView().run();
		} else {
			editorState.editor.chain().focus("start").scrollIntoView().run();
		}
	}

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
					class: "px-4 outline-none min-h-full max-h-full overflow-y-auto",
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
		focusOpenPosition();
	});

	function toggleExpandWidth() {
		if (!$config || !$config.editor) return;
		$config.editor.expandWidth = !$config.editor.expandWidth;
	}

	function adjustFontsize(value: number) {
		if (!$config || !$config.editor) return;
		$config.editor.fontSize += value;
		$config.editor.fontSize = Math.max(
			10,
			Math.min(40, $config.editor.fontSize),
		);
	}

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
					variant={editorState.editor.isActive("heading", {
						level: 1,
					})
						? "default"
						: "outline"}
					class="border"
					onclick={() =>
						editorState
							.editor!.chain()
							.focus()
							.toggleHeading({ level: 1 })
							.run()}><Heading1Icon /></Button
				>
				<Button
					size="sm"
					variant={editorState.editor.isActive("heading", {
						level: 2,
					})
						? "default"
						: "outline"}
					class="border"
					onclick={() =>
						editorState
							.editor!.chain()
							.focus()
							.toggleHeading({ level: 2 })
							.run()}><Heading2Icon /></Button
				>
				<Button
					size="sm"
					variant={editorState.editor.isActive("paragraph")
						? "default"
						: "outline"}
					class="border"
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
					class="border"
					onclick={() =>
						editorState.editor!.chain().focus().toggleBold().run()}
					><BoldIcon /></Button
				>
				<Button
					size="sm"
					variant={editorState.editor.isActive("italic")
						? "default"
						: "outline"}
					class="border"
					onclick={() =>
						editorState
							.editor!.chain()
							.focus()
							.toggleItalic()
							.run()}><ItalicIcon /></Button
				>
			</ButtonGroup.Root>
			<!-- Focus -->
			<ButtonGroup.Root>
				<Button
					size="sm"
					variant="outline"
					onclick={() =>
						editorState.editor!.chain().focus("start").run()}
					><ArrowUpToLine /></Button
				>
				<Button
					size="sm"
					variant="outline"
					onclick={() =>
						editorState.editor!.chain().focus("end").run()}
					><ArrowDownToLine /></Button
				>
			</ButtonGroup.Root>
			<!-- Font Size -->
			<ButtonGroup.Root class="ms-auto">
				<Button
					size="sm"
					variant={$config?.editor.expandWidth
						? "default"
						: "outline"}
					onclick={() => adjustFontsize(-1)}><MinusIcon /></Button
				>
				<Button
					size="sm"
					variant="outline"
					class="pointer-events-none font-mono"
					onclick={toggleExpandWidth}
					>{$config?.editor.fontSize}</Button
				>
				<Button
					size="sm"
					variant={$config?.editor.expandWidth
						? "default"
						: "outline"}
					onclick={() => adjustFontsize(1)}><PlusIcon /></Button
				>
			</ButtonGroup.Root>
			<!-- View -->
			<ButtonGroup.Root>
				<Button
					size="sm"
					variant={$config?.editor.expandWidth
						? "default"
						: "outline"}
					onclick={toggleExpandWidth}><UnfoldHorizontalIcon /></Button
				>
			</ButtonGroup.Root>
		</div>
	{/if}

	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (only a mouse ux improvement) -->
	<div class="max-h-full flex flex-col overflow-y-auto w-full flex-1">
		<div class="mx-auto h-full">
			<div
				bind:this={element}
				class="min-h-full w-full prose **:text-foreground cursor-text"
				class:md:max-w-none={!$config?.editor.expandWidth}
				class:lg:max-w-200={!$config?.editor.expandWidth}
				class:xl:max-w-250={!$config?.editor.expandWidth}
				class:max-w-none={$config?.editor.expandWidth}
				style="font-family: var(--font-editor); font-size: {$config
					?.editor.fontSize}px;"
				onmouseup={() => {
					if (editorState.editor) {
						if (!editorState.editor.isFocused)
							editorState.editor.chain().focus("end").run();
					}
				}}
			></div>
		</div>
	</div>
</div>
