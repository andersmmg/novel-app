<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as ButtonGroup from "$lib/components/ui/button-group";
	import { Input } from "$lib/components/ui/input";
	import { config } from "$lib/config/config-store.svelte";
	import type { StoryFile } from "$lib/story";
	import { combineFrontmatter, separateFrontmatter } from "$lib/story/utils";
	import OfficePaste from "@intevation/tiptap-extension-office-paste";
	import {
		ArrowDownToLine,
		ArrowUpToLine,
		BoldIcon,
		CaseSensitiveIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		Heading1Icon,
		Heading2Icon,
		ItalicIcon,
		ListIcon,
		ListOrderedIcon,
		ListTodoIcon,
		MinusIcon,
		Pilcrow,
		PlusIcon,
		TextSearchIcon,
		UnderlineIcon,
		UnfoldHorizontalIcon,
		XIcon,
	} from "@lucide/svelte";
	import { Editor, Extension } from "@tiptap/core";
	import { TaskItem, TaskList } from "@tiptap/extension-list";
	import { Placeholder } from "@tiptap/extensions/placeholder";
	import { Markdown } from "@tiptap/markdown";
	import { StarterKit } from "@tiptap/starter-kit";
	import { Plugin } from "prosemirror-state";
	import { onDestroy, onMount } from "svelte";
	import { SearchAndReplace } from "./search-replace";
	import { SpellCheck, setupSuggestions } from "./spellcheck";

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
	let previousSpellcheckState = $state<boolean>(false);
	let updateTimeout: ReturnType<typeof setTimeout> | undefined;
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	let searchQuery = $state<string>("");
	let searchElement = $state<HTMLInputElement>();
	let searchOpen = $state(false);
	let currentLanguage = $state<string>("en_US");

	const spellcheckEnabled = $derived(
		($config?.spellcheck?.enabled ?? false) &&
			!(
				$config?.editor?.hemingway?.enabled &&
				!$config?.editor?.hemingway?.spellcheck
			),
	);

	function createEditor() {
		if (editorState.editor) {
			editorState.editor.destroy();
		}

		const { content: initialContent } = separateFrontmatter(
			currentFile?.content || "",
		);

		const extensions = [
			ShortcutsExtension,
			SearchAndReplace,
			OfficePaste,
			Markdown,
			SpellCheck.configure({
				language: $config?.spellcheck?.language || "en_US",
				enabled: spellcheckEnabled,
			}),
			Placeholder.configure({
				placeholder: "Start writing...",
			}),
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			StarterKit.configure({
				horizontalRule: {
					HTMLAttributes: {
						class: "border-t border-border",
					},
				},
			}),
		];

		editorState.editor = new Editor({
			element: element,
			extensions,
			editorProps: {
				attributes: {
					class: "px-4 outline-none min-h-full max-h-full overflow-y-hidden",
					style: "min-height: 100%;",
				},
				scrollMargin: 80,
				scrollThreshold: 80,
			},
			content: initialContent,
			contentType: "markdown",
			onTransaction: ({ editor }) => {
				editorState = { editor };
			},
			onUpdate: ({ editor }) => {
				if (onContentChange && currentFile) {
					clearTimeout(updateTimeout);
					updateTimeout = setTimeout(() => {
						const newContent = editor.getMarkdown();
						const { frontmatter, metadata } = separateFrontmatter(
							currentFile.content || "",
						);

						const updatedFullContent = combineFrontmatter(
							frontmatter,
							newContent,
						);
						onContentChange(
							updatedFullContent,
							frontmatter,
							metadata,
						);
					}, 200);
				}
			},
		});

		previousFileId = currentFile?.path || null;
		focusOpenPosition();

		const suggestionHandlers = setupSuggestions(editorState.editor);
		(window as any).showSpellSuggestions =
			suggestionHandlers.showSuggestions;
	}

	$effect(() => {
		if (!editorState.editor) return;

		const currentFileId = currentFile?.path || null;
		const currentFileChanged = previousFileId !== currentFileId;

		if (currentFileChanged) {
			previousFileId = currentFileId;

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

	const ShortcutsExtension = Extension.create({
		addKeyboardShortcuts() {
			return {
				"Mod-f": () => {
					openSearch();
					return false;
				},
				Backspace: () => {
					if (
						$config?.editor?.hemingway?.enabled &&
						fileType === "Chapter"
					) {
						return true;
					}
					return false;
				},
				Delete: () => {
					if (
						$config?.editor?.hemingway?.enabled &&
						fileType === "Chapter"
					) {
						return true;
					}
					return false;
				},
			};
		},
		addProseMirrorPlugins() {
			return [
				new Plugin({
					props: {
						handleTextInput(view) {
							if (
								$config?.editor?.hemingway?.enabled &&
								fileType === "Chapter"
							) {
								if (
									!$config?.editor?.hemingway?.allowAdditions
								) {
									const { from, to } = view.state.selection;
									const doc = view.state.doc;
									const docLength = doc.content.size;

									const isAtEnd =
										from === to &&
										(from === docLength ||
											from === docLength - 1);

									if (!isAtEnd) {
										return true;
									}
								}
							}
							return false;
						},
					},
				}),
			];
		},
	});

	$effect(() => {
		if (
			previousSpellcheckState !== spellcheckEnabled &&
			editorState.editor
		) {
			previousSpellcheckState = spellcheckEnabled;
			editorState.editor.commands.setSpellcheckEnabled(spellcheckEnabled);
		}
	});

	onMount(() => {
		createEditor();

		$effect(() => {
			if (
				$config?.spellcheck?.language &&
				editorState.editor &&
				spellcheckEnabled
			) {
				const newLanguage = $config.spellcheck.language;
				if (newLanguage !== currentLanguage) {
					currentLanguage = newLanguage;
					const storage = editorState.editor.storage as any;
					if (
						storage.spellCheck?.switchLanguage &&
						storage.spellCheck.enabled
					) {
						storage.spellCheck.switchLanguage(newLanguage);
					}
				}
			}
		});
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

	function openSearch() {
		if (!editorState.editor) return;
		searchOpen = true;
		editorState.editor.commands.resetIndex();
		const { view, state } = editorState.editor;
		const { from, to } = view.state.selection;
		searchQuery = state.doc.textBetween(from, to, "");
		setTimeout(() => {
			searchElement?.focus();
			searchElement?.select();
		}, 0);
	}

	function closeSearch() {
		if (!editorState.editor) return;
		searchOpen = false;
		editorState.editor.commands.focus();
		editorState.editor.commands.setSearchTerm("");
		editorState.editor.commands.resetIndex();
	}

	function scrollToSearch() {
		if (!editorState.editor) return;
		if (editorState.editor.storage.searchAndReplace.results.length === 0)
			return;
		editorState.editor.commands.setTextSelection(
			editorState.editor.storage.searchAndReplace.results[
				editorState.editor.storage.searchAndReplace.resultIndex
			],
		);
		const { node } = editorState.editor.view.domAtPos(
			editorState.editor.state.selection.anchor,
		);
		node instanceof HTMLElement &&
			node.scrollIntoView({ behavior: "smooth", block: "center" });
	}

	function updateSearch(e: KeyboardEvent) {
		if (!editorState.editor) return;
		if (e.key === "Enter") {
			if (e.getModifierState("Shift")) {
				editorState.editor.commands.previousSearchResult();
			} else {
				editorState.editor.commands.nextSearchResult();
			}
			scrollToSearch();
			return;
		}
		if (e.key === "Escape") {
			closeSearch();
			return;
		}
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		searchTimeout = setTimeout(() => {
			if (!editorState.editor) return;
			editorState.editor.commands.setSearchTerm(searchQuery);
			scrollToSearch();
		}, 300);
	}

	onDestroy(() => {
		clearTimeout(updateTimeout);
		clearTimeout(searchTimeout);
		delete (window as any).showSpellSuggestions;
		editorState.editor?.destroy();
	});
</script>

<div class="flex flex-col h-full w-full">
	{#if editorState.editor}
		<div
			class="p-2 pr-4 bg-background flex gap-2 items-center border-b max-w-full overflow-x-auto"
		>
			<!-- Headings -->
			<ButtonGroup.Root class="empty:hidden">
				{#if $config?.editor.toolbarItems.heading1}
					<Button
						tooltipContent="Heading 1"
						tooltipContentProps={{ side: "bottom" }}
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
				{/if}
				{#if $config?.editor.toolbarItems.heading2}
					<Button
						tooltipContent="Heading 2"
						tooltipContentProps={{ side: "bottom" }}
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
				{/if}
				{#if $config?.editor.toolbarItems.paragraph}
					<Button
						tooltipContent="Paragraph"
						tooltipContentProps={{ side: "bottom" }}
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
				{/if}
			</ButtonGroup.Root>
			<!-- Formatting -->
			<ButtonGroup.Root class="empty:hidden">
				{#if $config?.editor.toolbarItems.bold}
					<Button
						tooltipContent="Bold"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant={editorState.editor.isActive("bold")
							? "default"
							: "outline"}
						class="border"
						onclick={() =>
							editorState
								.editor!.chain()
								.focus()
								.toggleBold()
								.run()}><BoldIcon /></Button
					>
				{/if}
				{#if $config?.editor.toolbarItems.italic}
					<Button
						tooltipContent="Italic"
						tooltipContentProps={{ side: "bottom" }}
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
				{/if}
				{#if $config?.editor.toolbarItems.underline}
					<Button
						tooltipContent="Underline"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant={editorState.editor.isActive("underline")
							? "default"
							: "outline"}
						class="border"
						onclick={() =>
							editorState
								.editor!.chain()
								.focus()
								.toggleUnderline()
								.run()}><UnderlineIcon /></Button
					>
				{/if}
			</ButtonGroup.Root>
			<!-- Lists -->
			<ButtonGroup.Root class="empty:hidden">
				{#if $config?.editor.toolbarItems.list}
					<Button
						tooltipContent="List"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant={editorState.editor.isActive("bulletList")
							? "default"
							: "outline"}
						class="border"
						onclick={() =>
							editorState
								.editor!.chain()
								.focus()
								.toggleBulletList()
								.run()}><ListIcon /></Button
					>
				{/if}
				{#if $config?.editor.toolbarItems.numberedList}
					<Button
						tooltipContent="Numbered List"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant={editorState.editor.isActive("orderedList")
							? "default"
							: "outline"}
						class="border"
						onclick={() =>
							editorState
								.editor!.chain()
								.focus()
								.toggleOrderedList()
								.run()}><ListOrderedIcon /></Button
					>
				{/if}
				{#if $config?.editor.toolbarItems.taskList}
					<Button
						tooltipContent="Task List"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant={editorState.editor.isActive("taskList")
							? "default"
							: "outline"}
						class="border"
						onclick={() =>
							editorState
								.editor!.chain()
								.focus()
								.toggleTaskList()
								.run()}><ListTodoIcon /></Button
					>
				{/if}
			</ButtonGroup.Root>
			<!-- Focus -->
			<ButtonGroup.Root class="empty:hidden">
				{#if $config?.editor.toolbarItems.top}
					<Button
						tooltipContent="Jump to Start"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant="outline"
						onclick={() =>
							editorState.editor!.chain().focus("start").run()}
						><ArrowUpToLine /></Button
					>
				{/if}
				{#if $config?.editor.toolbarItems.bottom}
					<Button
						tooltipContent="Jump to End"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant="outline"
						onclick={() =>
							editorState.editor!.chain().focus("end").run()}
						><ArrowDownToLine /></Button
					>
				{/if}
				{#if $config?.editor.toolbarItems.find}
					<Button
						tooltipContent="Find"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant="outline"
						onclick={searchOpen ? closeSearch : openSearch}
						><TextSearchIcon /></Button
					>
				{/if}
			</ButtonGroup.Root>
			<div class="ms-auto"></div>
			<!-- Font Size -->
			{#if $config?.editor.toolbarItems.fontSize}
				<ButtonGroup.Root>
					<Button
						tooltipContent="Reduce Editor Font Size"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant="outline"
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
						tooltipContent="Increase Editor Font Size"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant="outline"
						onclick={() => adjustFontsize(1)}><PlusIcon /></Button
					>
				</ButtonGroup.Root>
			{/if}
			<!-- View -->
			<ButtonGroup.Root class="empty:hidden">
				{#if $config?.editor.toolbarItems.expandWidth}
					<Button
						tooltipContent="Expand Editor Width"
						tooltipContentProps={{ side: "bottom" }}
						size="sm"
						variant={$config?.editor.expandWidth
							? "default"
							: "outline"}
						onclick={toggleExpandWidth}
						><UnfoldHorizontalIcon /></Button
					>
				{/if}
			</ButtonGroup.Root>
		</div>
	{/if}

	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (only a mouse ux improvement) -->
	<div class="max-h-full flex flex-col overflow-y-auto w-full flex-1">
		<div
			class="mx-auto h-full max-lg:w-full"
			class:min-w-full={$config?.editor.expandWidth}
		>
			<div
				bind:this={element}
				class="min-h-full w-full **:text-foreground cursor-text pb-10 prose"
				class:max-lg:max-w-none={!$config?.editor.expandWidth}
				class:lg:min-w-190={!$config?.editor.expandWidth}
				class:lg:max-w-190={!$config?.editor.expandWidth}
				class:xl:min-w-250={!$config?.editor.expandWidth}
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
				onclick={(window as any).showSpellSuggestions}
			></div>
		</div>
	</div>
	{#if searchOpen}
		<footer class="border-t bg-background/95">
			<div class="flex items-center gap-1 px-1">
				<Button variant="ghost" size="icon-sm" onclick={closeSearch}
					><XIcon /></Button
				>
				<div class="mx-2 text-muted-foreground text-sm">Find:</div>
				<Input
					class="rounded-none focus-visible:ring-0 border-y-0 focus-visible:border-input"
					bind:value={searchQuery}
					onkeyup={updateSearch}
					bind:ref={searchElement}
				/>
				<Button
					variant={editorState.editor?.storage.searchAndReplace
						.caseSensitive
						? "secondary"
						: "ghost"}
					size="icon-sm"
					onclick={() => {
						if (editorState.editor) {
							editorState.editor.commands.setCaseSensitive(
								!editorState.editor?.storage.searchAndReplace
									.caseSensitive,
							);
						}
					}}><CaseSensitiveIcon /></Button
				>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => {
						if (editorState.editor) {
							editorState.editor.commands.previousSearchResult();
							scrollToSearch();
						}
					}}><ChevronLeftIcon /></Button
				>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => {
						if (editorState.editor) {
							editorState.editor.commands.nextSearchResult();
							scrollToSearch();
						}
					}}><ChevronRightIcon /></Button
				>
				<div class="mx-2 text-muted-foreground text-sm font-mono">
					{editorState.editor?.storage?.searchAndReplace.results
						.length
						? editorState.editor?.storage?.searchAndReplace
								.resultIndex + 1
						: 0}/{editorState.editor?.storage?.searchAndReplace
						.results.length}
				</div>
			</div>
		</footer>
	{/if}
</div>
