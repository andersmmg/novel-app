<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		appState,
		selectStoryById,
		setCurrentEditedFile,
	} from "$lib/app-state.svelte";
	import * as Collapsible from "$lib/components/ui/collapsible";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import Tree from "$lib/components/ui/tree.svelte";
	import type { StoryFile } from "$lib/story/types";
	import {
		Book,
		Bookmark,
		ChevronDownIcon,
		EllipsisIcon,
		FileText,
		Folder,
		FolderOpen,
		LibraryIcon,
		PenTool,
		PlusIcon,
		Search,
		Settings,
		Users,
	} from "@lucide/svelte";

	let notesOpen = $state(false);
	let subFolder1Open = $state(false);
	let subFolder2Open = $state(false);
	let subFolder3Open = $state(false);
	let chapterMenuOpen: string | null = null;

	function toggleSubFolder1() {
		subFolder1Open = !subFolder1Open;
	}

	function toggleSubFolder2() {
		subFolder2Open = !subFolder2Open;
	}

	function toggleSubFolder3() {
		subFolder3Open = !subFolder3Open;
	}

	function toggleNotes() {
		notesOpen = !notesOpen;
	}

	// Derive chapters from selected story
	const chapters = $derived.by(() => {
		if (appState.selectedStory) {
			console.log("Sidebar: Deriving chapters from selected story");
			const storyChapters = appState.selectedStory.chapters;
			console.log("Sidebar: Loaded chapters:", storyChapters);
			storyChapters.forEach((chapter, index) => {
				console.log(
					`Sidebar: Chapter ${index} - title:`,
					chapter.title,
					"name:",
					chapter.name,
					"path:",
					chapter.path,
				);
			});
			return storyChapters;
		} else {
			console.log("Sidebar: No story selected, no chapters to load");
			return [];
		}
	});

	// Derive notes from selected story
	const notes = $derived.by(() => {
		if (appState.selectedStory) {
			console.log("Sidebar: Deriving notes from selected story");
			const storyNotes = appState.selectedStory.notes;
			const rootNotes = appState.selectedStory.rootNotes;
			console.log("Sidebar: Loaded notes folders:", storyNotes);
			console.log("Sidebar: Loaded root notes:", rootNotes);

			// Combine root notes with note folders
			const allNotes = [...rootNotes, ...storyNotes];
			console.log("Sidebar: All notes:", allNotes);
			return allNotes;
		} else {
			console.log("Sidebar: No story selected, no notes to load");
			return null;
		}
	});

	function openChapter(chapter: StoryFile) {
		// Set current edited file and navigate to editor
		setCurrentEditedFile(chapter);
		goto("/editor");
	}

	function addChapter() {
		// TODO: Implement chapter creation
		console.log("Adding new chapter to story:", appState.selectedStory);
	}

	async function selectStory(storyId: string) {
		console.log("Sidebar: Selecting story with ID:", storyId);
		await selectStoryById(storyId);
		console.log(
			"Sidebar: Story selected, app state:",
			$state.snapshot(appState),
		);
		goto("/");
	}

	function toggleChapterMenu(chapterPath: string) {
		chapterMenuOpen = chapterMenuOpen === chapterPath ? null : chapterPath;
	}

	function deleteChapter(chapterPath: string) {
		// TODO: Implement chapter deletion
		console.log("Deleting chapter:", chapterPath);
		chapterMenuOpen = null;
	}

	function renameChapter(chapterPath: string) {
		// TODO: Implement chapter renaming
		console.log("Renaming chapter:", chapterPath);
		chapterMenuOpen = null;
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
									<Book />
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
								<Book class="size-4" />
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
	<Sidebar.Content class="overflow-x-hidden">
		{#if appState.selectedStory}
			<!-- Chapters Group -->
			<Collapsible.Root open class="group/collapsible">
				<Sidebar.Group>
					<Sidebar.GroupLabel>
						{#snippet child({ props })}
							<Collapsible.Trigger {...props}>
								Chapters
								<ChevronDownIcon
									class="ms-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
								/>
							</Collapsible.Trigger>
						{/snippet}
					</Sidebar.GroupLabel>
					<Collapsible.Content>
						<Sidebar.GroupContent>
							<!-- Chapters List -->
							<Sidebar.Menu>
								{#each chapters as chapter (chapter.path)}
									<Sidebar.MenuItem>
										<Sidebar.MenuButton
											onclick={() => openChapter(chapter)}
										>
											<FileText />
											<span
												>{chapter.title ||
													chapter.name ||
													"Untitled Chapter"}</span
											>
										</Sidebar.MenuButton>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												{#snippet child({ props })}
													<Sidebar.MenuAction
														{...props}
													>
														<EllipsisIcon />
													</Sidebar.MenuAction>
												{/snippet}
											</DropdownMenu.Trigger>
											<DropdownMenu.Content
												side="right"
												align="start"
											>
												<DropdownMenu.Item
													onclick={() =>
														renameChapter(
															chapter.path,
														)}
												>
													<span>Rename</span>
												</DropdownMenu.Item>
												<DropdownMenu.Item
													onclick={() =>
														deleteChapter(
															chapter.path,
														)}
												>
													<span>Delete</span>
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</Sidebar.MenuItem>
								{/each}
								<Sidebar.MenuItem class="text-muted-foreground">
									<Sidebar.MenuButton>
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
							<Collapsible.Trigger {...props}>
								Notes
								<ChevronDownIcon
									class="ms-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
								/>
							</Collapsible.Trigger>
						{/snippet}
					</Sidebar.GroupLabel>
					<Collapsible.Content>
						<Sidebar.GroupContent>
							<!-- Notes Tree -->
							<Sidebar.Menu>
								{#each notes as noteItem (noteItem.path)}
									<Tree item={noteItem} />
								{/each}
								<Sidebar.MenuItem class="text-muted-foreground">
									<Sidebar.MenuButton>
										<PlusIcon />
										<span>New Note</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Collapsible.Content>
				</Sidebar.Group>
			</Collapsible.Root>

			<Sidebar.Separator />

			<!-- Writing Tools -->
			<Sidebar.Group>
				<Sidebar.GroupLabel>Writing Tools</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href="/editor" {...props}>
										<PenTool class="size-4" />
										<span>Editor</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>

						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href="/search" {...props}>
										<Search class="size-4" />
										<span>Search</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>

						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href="/bookmarks" {...props}>
										<Bookmark class="size-4" />
										<span>Bookmarks</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{:else}
			<!-- No story selected message -->
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
							<Settings class="size-4" />
							<span>Settings</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<span class="text-xs text-muted-foreground p-2 cursor-default"
					>v{__APP_VERSION__}</span
				>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
