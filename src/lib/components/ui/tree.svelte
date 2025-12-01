<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as Collapsible from "$lib/components/ui/collapsible";
	import { ChevronRight, FileText, Folder, FolderOpen } from "@lucide/svelte";
	import type { StoryFile, StoryFolder } from "$lib/story/types";
	import { setCurrentEditedFile } from "$lib/app-state.svelte.js";
	import TreeSelf from "./tree.svelte";
	import { goto } from "$app/navigation";

	let {
		item,
		level = 0,
	}: {
		item: StoryFile | StoryFolder;
		level?: number;
	} = $props();

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
			// It's a folder - toggle would be handled by parent
			return;
		} else {
			// It's a file - use the new state-based navigation
			setCurrentEditedFile(item as StoryFile);
			goto(`/editor`);
		}
	}
</script>

{#if isFolder(item)}
	<!-- Folder -->
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
					{#each item.children as subItem (subItem.path || subItem)}
						<TreeSelf item={subItem} level={level + 1} />
					{/each}
				</Sidebar.MenuSub>
			</Collapsible.Content>
		</Collapsible.Root>
	</Sidebar.MenuItem>
{:else}
	<!-- File -->
	<Sidebar.MenuItem>
		<Sidebar.MenuButton onclick={() => openItem(item)}>
			<FileText />
			<span>{getItemName(item)}</span>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
{/if}
