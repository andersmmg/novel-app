<script lang="ts">
	import { appState, forceSelectedStoryUpdate } from "$lib/app-state.svelte";
	import { confirmDelete } from "$lib/components/confirm-delete";
	import * as ContextMenu from "$lib/components/ui/context-menu";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import type { StoryFile } from "$lib/story";
	import { renameStoryFile } from "$lib/story/utils";
	import { FileText, SquarePenIcon, TrashIcon } from "@lucide/svelte";
	import { inputPrompt } from "../input-prompt";

	let {
		chapters,
		openChapter,
		deleteChapter,
	}: {
		chapters: StoryFile[];
		openChapter: (chapter: StoryFile) => void;
		deleteChapter: (path: string) => void;
	} = $props();

	let localChapters: StoryFile[] = $derived(chapters);

</script>

<div>
	{#each localChapters as chapter, index (chapter.path)}
		<ContextMenu.Root>
			<ContextMenu.Trigger data-index={index}
				onclick={() => openChapter(chapter)}>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						isActive={appState.currentEditedFile?.path ===
							chapter.path}
					>
						<FileText />
						<span
							>{chapter.title ||
								chapter.name ||
								"Untitled Chapter"}</span
						>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				<ContextMenu.Item
					onclick={() =>
						inputPrompt({
							title: "Rename Chapter",
							description: "Enter a new title for this chapter",
							input: {
								initialValue: chapter.title || "",
							},
							onConfirm: async (value) => {
								if (!appState.selectedStory) return;
								renameStoryFile(
									appState.selectedStory,
									chapter.path,
									value,
								);
								forceSelectedStoryUpdate();
							},
						})}><SquarePenIcon /> Rename</ContextMenu.Item
				>
				<ContextMenu.Item
					onclick={() => {
						confirmDelete({
							title: `Delete ${chapter.title}`,
							description: `Are you sure you want to delete this chapter?`,
							input: {
								confirmationText: chapter.title || "",
							},
							onConfirm: async () => {
								deleteChapter(chapter.path);
								return true;
							},
						});
					}}><TrashIcon /> Delete</ContextMenu.Item
				>
			</ContextMenu.Content>
		</ContextMenu.Root>
	{/each}
</div>
