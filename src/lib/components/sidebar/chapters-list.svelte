<script lang="ts">
	import { appState, forceSelectedStoryUpdate } from "$lib/app-state.svelte";
	import { confirmDelete } from "$lib/components/confirm-delete";
	import * as ContextMenu from "$lib/components/ui/context-menu";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import type { StoryFile } from "$lib/story";
	import { renameStoryFile } from "$lib/story/utils";
	import { BookText, SquarePenIcon, TrashIcon } from "@lucide/svelte";
	import { dndzone, type DndEvent } from "svelte-dnd-action";
	import { flip } from "svelte/animate";
	import { inputPrompt } from "../input-prompt";
	// setDebugMode(true);

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
	const flipDurationMs = 100;
	function handleDndConsider(e: CustomEvent<DndEvent<StoryFile>>) {
		localChapters = e.detail.items;
	}
	function handleDndFinalize(e: CustomEvent<DndEvent<StoryFile>>) {
		localChapters = e.detail.items;
		if (!appState.selectedStory) return;

		const success = appState.selectedStory.reorderChapters(localChapters);
		if (success) {
			appState.isDirty = true;
			forceSelectedStoryUpdate();
		}
	}
</script>

<div
	use:dndzone={{
		items: localChapters,
		flipDurationMs,
		type: "chapter",
		dropTargetStyle: {},
	}}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each localChapters as chapter (chapter.id)}
		<div animate:flip={{ duration: flipDurationMs }}>
			<ContextMenu.Root>
				<ContextMenu.Trigger
					onclick={() => openChapter(chapter)}
					class="cursor-default"
				>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={appState.currentEditedFile?.path ===
								chapter.path}
						>
							{#snippet child({ props })}
								<span {...props}>
									<BookText />
									<span
										>{chapter.title ||
											chapter.name ||
											"Untitled Chapter"}</span
									></span
								>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item
						onclick={() =>
							inputPrompt({
								title: "Rename Chapter",
								description:
									"Enter a new title for this chapter",
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
		</div>
	{/each}
</div>
