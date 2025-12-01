<script lang="ts">
	import { goto } from "$app/navigation";
	import { appState } from "$lib/app-state.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import Tiptap from "$lib/tiptap/tiptap.svelte";

	let titleInput = $state<HTMLInputElement>();
	let isEditingTitle = $state(false);

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

	function startEditingTitle() {
		isEditingTitle = true;
		setTimeout(() => titleInput?.focus(), 0);
	}

	function saveTitle() {
		if (fileInfo && appState.currentEditedFile && appState.selectedStory) {
			const newTitle = titleInput?.value?.trim() || "Untitled";
			const filePath = appState.currentEditedFile.path;
			const now = new Date();

			appState.currentEditedFile.title = newTitle;
			appState.currentEditedFile.edited = now;

			if (filePath.startsWith("chapters/")) {
				const chapter =
					appState.selectedStory.getChapterByPath(filePath);
				if (chapter) {
					chapter.title = newTitle;
					chapter.edited = now;
				}
			} else if (filePath.startsWith("notes/")) {
				const note = appState.selectedStory.findNoteByPath(filePath);
				if (note && "content" in note) {
					note.title = newTitle;
					note.edited = now;
				}
			}

			appState.selectedStory.metadata.edited = now;

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

	<main class="flex-1 w-full min-w-0">
		{#if appState.selectedStory && appState.currentEditedFile}
			<Tiptap
				currentFile={appState.currentEditedFile}
				onContentChange={(newContent, frontmatter, metadata) => {
					if (appState.currentEditedFile && appState.selectedStory) {
						appState.currentEditedFile.content = newContent;

						const filePath = appState.currentEditedFile.path;
						const now = new Date();

						appState.selectedStory.metadata.edited = now;

						if (filePath.startsWith("chapters/")) {
							const chapter =
								appState.selectedStory.getChapterByPath(
									filePath,
								);
							if (chapter) {
								chapter.content = newContent;
								chapter.edited = now;
							}
						} else if (filePath.startsWith("notes/")) {
							const note =
								appState.selectedStory.findNoteByPath(filePath);
							if (note && "content" in note) {
								note.content = newContent;
								note.edited = now;
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
</div>
