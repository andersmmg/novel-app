<script lang="ts">
	import { goto } from "$app/navigation";
	import { setCurrentEditedFile } from "$lib/app-state.svelte.js";
	import * as Collapsible from "$lib/components/ui/collapsible";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { StoryFile, StoryFolder } from "$lib/story/types";
	import { FileText, Folder, FolderOpen } from "@lucide/svelte";
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
					{#each item.children as subItem ((subItem.path || "") + (subItem.title || subItem.name || ""))}
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
