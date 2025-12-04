<script lang="ts">
	import { goto } from "$app/navigation";
	import { appState } from "$lib/app-state.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import {
		addFrontmatterIfNeeded,
		countWords,
		separateFrontmatter,
	} from "$lib/story/utils";
	import Tiptap from "$lib/tiptap/tiptap.svelte";

	let titleInput = $state<HTMLInputElement>();
	let isEditingTitle = $state(false);
	let debouncedWordCount = $state(0);
	let wordCountTimeout: ReturnType<typeof setTimeout> | undefined;
	let lastFilePath = $state<string | null>(null);

	const fileInfo = $derived.by(() => {
		if (!appState.currentEditedFile) {
			return null;
		}

		const file = appState.currentEditedFile;
		const title = file?.title || file?.name || "Untitled";

		if (file.path.startsWith("chapters/")) {
			return { type: "Chapter", title, variant: "default" as const };
		} else if (file.path.startsWith("notes/")) {
			return { type: "Note", title, variant: "outline" as const };
		}

		return { type: "File", title, variant: "outline" as const };
	});

	$effect(() => {
		const currentFile = appState.currentEditedFile;
		const currentFilePath = currentFile?.path || null;
		const content = currentFile?.content || "";

		if (!currentFile) {
			debouncedWordCount = 0;
			lastFilePath = null;
			return;
		}

		if (lastFilePath !== currentFilePath) {
			lastFilePath = currentFilePath;
			debouncedWordCount = countWords(content);
			return;
		}

		clearTimeout(wordCountTimeout);
		wordCountTimeout = setTimeout(() => {
			debouncedWordCount = countWords(content);
		}, 200);
	});

	function startEditingTitle() {
		isEditingTitle = true;
		setTimeout(() => titleInput?.focus(), 0);
	}

	function saveTitle() {
		if (fileInfo && appState.currentEditedFile && appState.selectedStory) {
			const newTitle = titleInput?.value?.trim() || "Untitled";
			const filePath = appState.currentEditedFile.path;
			const now = new Date();

			const updatedMetadata = {
				...appState.currentEditedFile.metadata,
				title: newTitle,
			};
			appState.currentEditedFile.title = newTitle;
			appState.currentEditedFile.metadata = updatedMetadata;
			appState.currentEditedFile.edited = now;
			appState.isDirty = true;

			const { content } = separateFrontmatter(
				appState.currentEditedFile.content || "",
			);

			const tempFile = {
				content,
				created: appState.currentEditedFile.created,
				edited: now,
				metadata: updatedMetadata,
			};

			appState.currentEditedFile.content =
				addFrontmatterIfNeeded(tempFile);

			if (filePath.startsWith("chapters/")) {
				appState.selectedStory.updateChapter(filePath, {
					title: newTitle,
					metadata: updatedMetadata,
					content: appState.currentEditedFile.content,
					edited: now,
				});
			} else if (filePath.startsWith("notes/")) {
				appState.selectedStory.updateNote(filePath, {
					title: newTitle,
					metadata: updatedMetadata,
					content: appState.currentEditedFile.content,
					edited: now,
				});
			}

			appState.selectedStory.updateMetadata({ edited: now });

			const currentStory = appState.selectedStory;
			appState.selectedStory = null;
			appState.selectedStory = currentStory;
		}
		isEditingTitle = false;
	}

	function cancelEditTitle() {
		isEditingTitle = false;
	}

	function goBack() {
		goto("/");
	}
</script>

<div class="flex flex-col h-full">
	<header
		class="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
	>
		<div class="container px-4 py-1">
			<div class="flex items-center gap-4">
				{#if appState.selectedStory && fileInfo}
					<div class="flex items-center gap-2 flex-1">
						<Badge variant={fileInfo.variant} class=""
							>{fileInfo.type}</Badge
						>
						<div class="relative min-w-0 flex-1">
							{#if isEditingTitle}
								<input
									bind:this={titleInput}
									type="text"
									value={fileInfo.title}
									onblur={saveTitle}
									onkeydown={(e) => {
										if (e.key === "Enter") saveTitle();
										if (e.key === "Escape")
											cancelEditTitle();
									}}
									class="text-md font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-ring rounded px-2 py-1 w-full"
									style="min-height: 2rem;"
								/>
							{:else}
								<button
									type="button"
									class="text-md font-medium cursor-pointer hover:bg-muted rounded px-2 py-1 border-none bg-transparent text-left w-full overflow-hidden text-ellipsis whitespace-nowrap"
									onclick={startEditingTitle}
									onkeydown={(e) => {
										if (
											e.key === "Enter" ||
											e.key === " "
										) {
											e.preventDefault();
											startEditingTitle();
										}
									}}
									style="min-height: 2rem;"
								>
									{fileInfo.title}
								</button>
							{/if}
						</div>
					</div>
				{:else}
					<div class="flex-1">
						<h1 class="text-lg font-semibold">No Novel Selected</h1>
						<p class="text-sm text-muted-foreground">
							Please select a novel from the home page to start
							editing.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<main class="flex-1 w-full min-w-0 overflow-y-hidden">
		{#if appState.selectedStory && appState.currentEditedFile}
			<Tiptap
				currentFile={appState.currentEditedFile}
				fileType={fileInfo?.type}
				onContentChange={(newContent, frontmatter, metadata) => {
					if (appState.currentEditedFile && appState.selectedStory) {
						if (appState.currentEditedFile.content != newContent) {
							appState.currentEditedFile.content = newContent;

							const filePath = appState.currentEditedFile.path;
							const now = new Date();

							appState.selectedStory.metadata.edited = now;
							appState.isDirty = true;

							if (filePath.startsWith("chapters/")) {
								appState.selectedStory.updateChapter(filePath, {
									content: newContent,
									edited: now,
								});
							} else if (filePath.startsWith("notes/")) {
								appState.selectedStory.updateNote(filePath, {
									content: newContent,
									edited: now,
								});
							}
						}
					}
				}}
			/>
		{:else if appState.selectedStory}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<h2 class="text-xl font-semibold mb-2">No File Selected</h2>
					<p class="text-muted-foreground mb-4">
						Select a chapter or note to start editing.
					</p>
					<Button onclick={goBack}>Go to Novels</Button>
				</div>
			</div>
		{:else}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<h2 class="text-xl font-semibold mb-2">
						No Novel Selected
					</h2>
					<p class="text-muted-foreground mb-4">
						Please select a novel from the home page to start
						editing.
					</p>
					<Button onclick={goBack}>Go to Novels</Button>
				</div>
			</div>
		{/if}
	</main>

	{#if appState.currentEditedFile}
		<footer
			class="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
		>
			<div class="container px-4 py-2">
				<div
					class="flex items-center justify-between text-sm text-muted-foreground"
				>
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-1">
							<span class="text-foreground font-semibold">
								{debouncedWordCount.toLocaleString()}
							</span>
							<span class="font-medium">words</span>
						</div>
					</div>
				</div>
			</div>
		</footer>
	{/if}
</div>
