<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		appState,
		forceSelectedStoryUpdate,
		setCurrentEditedFile,
	} from "$lib/app-state.svelte.js";
	import * as Collapsible from "$lib/components/ui/collapsible";
	import * as ContextMenu from "$lib/components/ui/context-menu";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import type { StoryFile, StoryFolder } from "$lib/story/types";
	import { createNote, createNoteFolder } from "$lib/story/story-writer";
	import { renameStoryItem } from "$lib/story/utils";

	import FilePlusIcon from "virtual:icons/lucide/file-plus";
	import FolderIcon from "virtual:icons/lucide/folder";
	import FolderOpenIcon from "virtual:icons/lucide/folder-open";
	import NotepadTextIcon from "virtual:icons/lucide/notepad-text";
	import SquarePenIcon from "virtual:icons/lucide/square-pen";
	import TrashIcon from "virtual:icons/lucide/trash";

	import { confirmDelete } from "../confirm-delete";
	import { inputPrompt } from "../input-prompt";
	import Tree from "./tree.svelte";

	let {
		item,
		level = 0,
	}: {
		item: StoryFile | StoryFolder;
		level?: number;
	} = $props();

	$effect(() => {
		item.path;
		if ("title" in item) item.title;
		if ("name" in item) item.name;
		if ("children" in item) {
			item.children.forEach((child) => {
				child.path;
				if ("title" in child) child.title;
				if ("name" in child) child.name;
			});
		}
	});

	function isFolder(item: StoryFile | StoryFolder): item is StoryFolder {
		return "children" in item;
	}

	function getItemName(item: StoryFile | StoryFolder): string {
		if ("title" in item && item.title) return item.title;
		if ("name" in item && item.name) return item.name;
		return "Untitled";
	}

	function openItem(item: StoryFile | StoryFolder) {
		if ("children" in item) {
			return;
		} else {
			const fileItem = item as StoryFile;
			const freshFile = appState.selectedStory?.findNoteByPath(
				fileItem.path,
			) as StoryFile;
			const fileToEdit = freshFile || fileItem;
			setCurrentEditedFile(fileToEdit);
			goto(`/editor`);
		}
	}
</script>

{#if isFolder(item)}
	<!-- Folder -->
	<ContextMenu.Root>
		<Sidebar.MenuItem>
			<Collapsible.Root
				class="group/collapsible [&[data-state=open]>div>button>svg:first-child]:hidden [&[data-state=closed]>div>button>svg:nth-child(2)]:hidden"
				open={false}
			>
				<Collapsible.Trigger>
					{#snippet child({ props })}
						<ContextMenu.Trigger>
							<Sidebar.MenuButton {...props}>
								<FolderIcon />
								<FolderOpenIcon />
								<span>{getItemName(item)}</span>
							</Sidebar.MenuButton>
						</ContextMenu.Trigger>
					{/snippet}
				</Collapsible.Trigger>
				<Collapsible.Content>
					<Sidebar.MenuSub class="me-0 pe-0">
						{#each item.children as subItem (subItem.path || subItem.name)}
							<Tree item={subItem} level={level + 1} />
						{/each}
					</Sidebar.MenuSub>
				</Collapsible.Content>
			</Collapsible.Root>
		</Sidebar.MenuItem>

		<ContextMenu.Content>
			<ContextMenu.Item
				onclick={() =>
					inputPrompt({
						title: "Create Note",
						description: "Enter a name for the note",
						onConfirm: async (value) => {
							if (!appState.selectedStory) return;
							const newNote = createNote(value);
							appState.selectedStory.addNoteToFolder(
								item.path,
								newNote,
							);
							setCurrentEditedFile(newNote);
							goto(`/editor`);
							forceSelectedStoryUpdate();
							appState.isDirty = true;
						},
					})}><FilePlusIcon /> Create Note</ContextMenu.Item
			>
			<ContextMenu.Item
				onclick={() =>
					inputPrompt({
						title: "Create Subfolder",
						description: "Enter a name for the subfolder",
						onConfirm: async (value) => {
							if (!appState.selectedStory) return;
							const newSubfolder = createNoteFolder(value);
							appState.selectedStory.addSubfolderToFolder(
								item.path,
								newSubfolder,
							);
							forceSelectedStoryUpdate();
							appState.isDirty = true;
						},
					})}><FolderIcon /> Create Subfolder</ContextMenu.Item
			>
			<ContextMenu.Item
				onclick={() =>
					inputPrompt({
						title: "Rename Folder",
						description: "Enter a new name for this folder",
						input: {
							initialValue: getItemName(item),
						},
						onConfirm: async (value) => {
							if (!appState.selectedStory) return;
							renameStoryItem(
								appState.selectedStory,
								item.path,
								value,
							);
							forceSelectedStoryUpdate();
						},
					})}><SquarePenIcon /> Rename</ContextMenu.Item
			>
			<ContextMenu.Item
				onclick={() =>
					confirmDelete({
						title: "Delete Folder",
						description: `Are you sure you want to delete "${getItemName(item)}" and all its contents?`,
						input: {
							confirmationText: "DELETE",
						},
						onConfirm: async () => {
							if (!appState.selectedStory) return;
							const isCurrentlyOpen =
								appState.currentEditedFile?.path === item.path;
							if (appState.selectedStory.deleteNote(item.path)) {
								if (isCurrentlyOpen) {
									setCurrentEditedFile(null);
									goto(`/story`);
								}
								forceSelectedStoryUpdate();
								appState.isDirty = true;
							}
						},
					})}><TrashIcon /> Delete</ContextMenu.Item
			>
		</ContextMenu.Content>
	</ContextMenu.Root>
{:else}
	<!-- File -->
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					onclick={() => openItem(item)}
					isActive={appState.currentEditedFile?.path === item.path}
				>
					<NotepadTextIcon />
					<span>{getItemName(item)}</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item
				onclick={() =>
					inputPrompt({
						title: "Rename Note",
						description: "Enter a new name for this note",
						input: {
							initialValue: getItemName(item),
						},
						onConfirm: async (value) => {
							if (!appState.selectedStory) return;
							renameStoryItem(
								appState.selectedStory,
								item.path,
								value,
							);
							forceSelectedStoryUpdate();
						},
					})}><SquarePenIcon /> Rename</ContextMenu.Item
			>
			<ContextMenu.Item
				onclick={() =>
					confirmDelete({
						title: "Delete Note",
						description: `Are you sure you want to delete "${getItemName(item)}"?`,
						input: {
							confirmationText: "DELETE",
						},
						onConfirm: async () => {
							if (!appState.selectedStory) return;
							const isCurrentlyOpen =
								appState.currentEditedFile?.path === item.path;
							if (appState.selectedStory.deleteNote(item.path)) {
								if (isCurrentlyOpen) {
									setCurrentEditedFile(null);
									goto(`/story`);
								}
								forceSelectedStoryUpdate();
								appState.isDirty = true;
							}
						},
					})}><TrashIcon /> Delete</ContextMenu.Item
			>
		</ContextMenu.Content>
	</ContextMenu.Root>
{/if}
