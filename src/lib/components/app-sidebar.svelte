<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		appState,
		forceSelectedStoryUpdate,
		selectStoryById,
		setCurrentEditedFile,
	} from "$lib/app-state.svelte";
	import * as Collapsible from "$lib/components/ui/collapsible";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import Tree from "$lib/components/ui/tree.svelte";
	import {
		createChapter,
		createNote,
		createNoteFolder,
	} from "$lib/story/story-writer";
	import type { StoryFile } from "$lib/story/types";
	import { cn } from "$lib/utils";

	import BookIcon from "virtual:icons/lucide/book";
	import BookOpenIcon from "virtual:icons/lucide/book-open";
	import ChevronDownIcon from "virtual:icons/lucide/chevron-down";
	import FilePlusIcon from "virtual:icons/lucide/file-plus";
	import FolderPlusIcon from "virtual:icons/lucide/folder-plus";
	import LibraryIcon from "virtual:icons/lucide/library";
	import PlusIcon from "virtual:icons/lucide/plus";
	import SettingsIcon from "virtual:icons/lucide/settings";

	import { inputPrompt } from "./input-prompt";
	import ChaptersList from "./sidebar/chapters-list.svelte";
	import { Button } from "./ui/button";

	const chapters = $derived.by(() => {
		if (appState.selectedStory) {
			return appState.selectedStory.getSortedChapters();
		} else {
			return [];
		}
	});

	const notes = $derived.by(() => {
		if (appState.selectedStory) {
			const storyNotes = appState.selectedStory.notes;
			const rootNotes = appState.selectedStory.rootNotes;
			const freshRootNotes = [...rootNotes];
			const freshStoryNotes = storyNotes.map((folder) => ({
				...folder,
				children: folder.children.map((child) => ({ ...child })),
			}));
			return [...freshRootNotes, ...freshStoryNotes];
		} else {
			return null;
		}
	});

	function openChapter(chapter: StoryFile) {
		const freshChapter = appState.selectedStory?.getChapterByPath(
			chapter.path,
		);
		const fileToEdit = freshChapter || chapter;
		setCurrentEditedFile(fileToEdit);
		goto("/editor");
	}

	async function addChapter() {
		if (!appState.selectedStory) {
			console.error("No story selected");
			return;
		}

		const nextOrder = appState.selectedStory.chapters.length;
		const newChapter = createChapter("Untitled Chapter", "", nextOrder);
		appState.selectedStory.addChapter(newChapter);

		forceSelectedStoryUpdate();

		appState.isDirty = true;

		setCurrentEditedFile(newChapter);
		goto("/editor");
	}

	async function selectStory(storyId: string) {
		console.log("Sidebar: Selecting story with ID:", storyId);
		await selectStoryById(storyId);
		goto("/story");
	}

	function deleteChapter(chapterPath: string) {
		if (!appState.selectedStory) {
			console.error("No story selected");
			return;
		}

		const success = appState.selectedStory.deleteChapter(chapterPath);

		if (success) {
			for (let i = 0; i < appState.selectedStory.chapters.length; i++) {
				appState.selectedStory.chapters[i].order = i;
				if (!appState.selectedStory.chapters[i].metadata) {
					appState.selectedStory.chapters[i].metadata = {};
				}
				appState.selectedStory.chapters[i].metadata.order = i;
			}

			forceSelectedStoryUpdate();

			appState.isDirty = true;

			if (appState.currentEditedFile?.path === chapterPath) {
				appState.currentEditedFile = null;
			}
		}
	}
</script>

<Sidebar.Root class="mt-9 max-h-[calc(100svh-2.25rem)] border-l border-b">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton size="lg" {...props}>
								{#if appState.selectedStory}
									<BookIcon />
									<div
										class="flex flex-col gap-0.5 leading-none"
									>
										<span class="font-medium"
											>{appState.selectedStory.metadata
												.title}</span
										>
										<span class="text-muted-foreground"
											>{appState.selectedStory.metadata
												.author}</span
										>
									</div>
									<ChevronDownIcon class="ms-auto" />
								{:else}
									<LibraryIcon />
									Select Story
									<ChevronDownIcon class="ms-auto" />
								{/if}
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-(--bits-dropdown-menu-anchor-width)"
					>
						{#each appState.availableStories as story (story.id)}
							<DropdownMenu.Item
								onclick={() => selectStory(story.id)}
							>
								<BookIcon class="size-4" />
								<span>{story.title}</span>
							</DropdownMenu.Item>
						{:else}
							<DropdownMenu.Label>
								<span
									class="font-normal text-muted-foreground cursor-default"
									>Create your first story!</span
								>
							</DropdownMenu.Label>
						{/each}
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/" {...props}>
									<LibraryIcon class="size-4" />
									<span>Manage Stories</span>
								</a>
							{/snippet}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content class="overflow-x-hidden gap-0">
		{#if appState.selectedStory}
			<!-- Story Home -->
			<Sidebar.Group class="py-1">
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href="/story" {...props}>
										<BookOpenIcon class="size-4" />
										<span>Story Overview</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
			<!-- Chapters Group -->
			<Collapsible.Root open class="group/collapsible">
				<Sidebar.Group>
					<Sidebar.GroupLabel>
						{#snippet child({ props })}
							<Collapsible.Trigger {...props}>
								<ChevronDownIcon
									class="me-1 transition-transform group-data-[state=open]/collapsible:rotate-180"
								/>
								Chapters
							</Collapsible.Trigger>
						{/snippet}
					</Sidebar.GroupLabel>
					<Collapsible.Content>
						<Sidebar.GroupContent>
							<!-- Chapters List -->
							<Sidebar.Menu>
								<ChaptersList
									{chapters}
									{openChapter}
									{deleteChapter}
								/>
								<Sidebar.MenuItem class="text-muted-foreground">
									<Sidebar.MenuButton onclick={addChapter}>
										<PlusIcon class="size-4" />
										<span>New Chapter</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Collapsible.Content>
				</Sidebar.Group>
			</Collapsible.Root>

			<!-- Notes Group -->
			<Collapsible.Root open class="group/collapsible">
				<Sidebar.Group>
					<Sidebar.GroupLabel>
						{#snippet child({ props })}
							<div class="flex justify-stretch items-end">
								<Collapsible.Trigger
									{...props}
									class={cn(props.class as string, "flex-1")}
								>
									<ChevronDownIcon
										class="me-1 transition-transform group-data-[state=open]/collapsible:rotate-180"
									/>
									Notes
								</Collapsible.Trigger>
								<Button
									class="size-7 rounded-full"
									variant="ghost"
									onclick={() =>
										inputPrompt({
											title: "Create Folder",
											description:
												"Enter a name for the folder",
											onConfirm: async (value) => {
												if (!appState.selectedStory)
													return;

												const newFolder =
													createNoteFolder(value);
												appState.selectedStory.addNoteFolder(
													newFolder,
												);
												forceSelectedStoryUpdate();
												appState.isDirty = true;
											},
										})}
								>
									<FolderPlusIcon />
								</Button>
								<Button
									class="size-7 rounded-full"
									variant="ghost"
									onclick={() =>
										inputPrompt({
											title: "Create Note",
											description:
												"Enter a name for the note",
											onConfirm: async (value) => {
												if (!appState.selectedStory)
													return;

												const newNote =
													createNote(value);
												appState.selectedStory.addRootNote(
													newNote,
												);
												setCurrentEditedFile(newNote);
												goto(`/editor`);
												forceSelectedStoryUpdate();
												appState.isDirty = true;
											},
										})}
								>
									<FilePlusIcon />
								</Button>
							</div>
						{/snippet}
					</Sidebar.GroupLabel>
					<Collapsible.Content>
						<Sidebar.GroupContent>
							<!-- Notes Tree -->
							<Sidebar.Menu>
								{#each notes as noteItem (noteItem.path)}
									<Tree item={noteItem} />
								{/each}
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Collapsible.Content>
				</Sidebar.Group>
			</Collapsible.Root>
		{:else}
			<Sidebar.Content
				class="flex-1 flex items-center justify-center p-4"
			>
				<div class="text-center text-muted-foreground">
					<LibraryIcon class="size-8 mx-auto mb-2 opacity-50" />
					<p class="text-sm">No story selected</p>
					<p class="text-xs">
						Select a story from the dropdown above, or create a new
						one.
					</p>
				</div>
			</Sidebar.Content>
		{/if}
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href="/settings" {...props}>
							<SettingsIcon class="size-4" />
							<span>Settings</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
