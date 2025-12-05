<script lang="ts">
	import { goto } from "$app/navigation";
	import { appState, setCurrentEditedFile } from "$lib/app-state.svelte.js";
	import * as Collapsible from "$lib/components/ui/collapsible";
	import * as ContextMenu from "$lib/components/ui/context-menu";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import type { StoryFile, StoryFolder } from "$lib/story/types";
	import {
		FileText,
		Folder,
		FolderOpen,
		SquarePenIcon,
		TrashIcon,
	} from "@lucide/svelte";
	import TreeSelf from "./tree.svelte";

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
		<ContextMenu.Trigger>
			<Sidebar.MenuItem>
				<Collapsible.Root
					class="group/collapsible [&[data-state=open]>button>svg:first-child]:hidden [&[data-state=closed]>button>svg:nth-child(2)]:hidden"
					open={false}
				>
					<Collapsible.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton {...props}>
								<Folder />
								<FolderOpen />
								<span>{getItemName(item)}</span>
							</Sidebar.MenuButton>
						{/snippet}
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Sidebar.MenuSub class="me-0 pe-0">
							{#each item.children as subItem ((subItem.path || "") + (subItem.title || subItem.name || ""))}
								<TreeSelf item={subItem} level={level + 1} />
							{/each}
						</Sidebar.MenuSub>
					</Collapsible.Content>
				</Collapsible.Root>
			</Sidebar.MenuItem>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item><SquarePenIcon /> Rename</ContextMenu.Item>
			<ContextMenu.Item><TrashIcon /> Delete</ContextMenu.Item>
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
					<FileText />
					<span>{getItemName(item)}</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item><TrashIcon /> Delete</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
{/if}
