<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		appState,
		loadAvailableStories,
		selectStoryById,
	} from "$lib/app-state.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Empty from "$lib/components/ui/empty";
	import * as Field from "$lib/components/ui/field";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import { createEmptyStory } from "$lib/story";
	import { saveStory } from "$lib/story/story-writer";
	import type { StoryListItem } from "$lib/story/types";
	import { formatCount } from "$lib/story/utils";
	import BookOpenIcon from "@tabler/icons-svelte/icons/book";
	import CalendarIcon from "@tabler/icons-svelte/icons/calendar";
	import FileTextIcon from "@tabler/icons-svelte/icons/file-text";
	import UserIcon from "@tabler/icons-svelte/icons/user";
	import { BaseDirectory, exists, writeFile } from "@tauri-apps/plugin-fs";
	import { info } from "@tauri-apps/plugin-log";
	import { nanoid } from "nanoid";
	import { onMount } from "svelte";
	import Time from "svelte-time";

	let loading = $state(true);
	let creatingStory = $state(false);
	let titleInput = $state("");
	let authorInput = $state("");
	let genreInput = $state("");
	let descriptionInput = $state("");
	let showEmptyWarning = $state(false);

	const stories = $derived(appState.availableStories);
	const canCreateStory = $derived(
		titleInput.trim() ||
			authorInput.trim() ||
			genreInput.trim() ||
			descriptionInput.trim(),
	);

	onMount(async () => {
		loading = false;
	});

	function sanitizeFilename(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, "")
			.replace(/\s+/g, "_")
			.replace(/^_+|_+$/g, "")
			.substring(0, 50);
	}

	async function generateUniqueFilename(title: string): Promise<string> {
		if (!title.trim()) {
			const id = nanoid();
			return `${id}.story`;
		}

		const baseName = sanitizeFilename(title);
		let filename = `${baseName}.story`;
		let counter = 1;

		while (
			await exists(`stories/${filename}`, {
				baseDir: BaseDirectory.AppData,
			})
		) {
			filename = `${baseName}${counter}.story`;
			counter++;
		}

		return filename;
	}

	async function handleOpenStory(storyId: string) {
		await selectStoryById(storyId);
		goto("/story");
	}

	function handleCardClick(story: StoryListItem) {
		handleOpenStory(story.id);
	}

	async function handleCreateStory() {
		if (!canCreateStory) {
			showEmptyWarning = true;
			setTimeout(() => (showEmptyWarning = false), 3000);
			return;
		}

		try {
			const storyTitle = titleInput.trim() || "Untitled Story";
			const newStory = createEmptyStory(storyTitle);

			newStory.metadata.title = storyTitle;
			if (authorInput.trim()) {
				newStory.metadata.author = authorInput.trim();
			}
			if (genreInput.trim()) {
				newStory.metadata.genre = genreInput.trim();
			}
			if (descriptionInput.trim()) {
				newStory.metadata.description = descriptionInput.trim();
			}

			const storyBlob = await saveStory(newStory);
			const arrayBuffer = await storyBlob.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const filename = await generateUniqueFilename(titleInput.trim());
			const path = `stories/${filename}`;

			await writeFile(path, uint8Array, {
				baseDir: BaseDirectory.AppData,
			});

			info(`Created new story: ${filename}`);

			titleInput = "";
			authorInput = "";
			genreInput = "";
			descriptionInput = "";
			creatingStory = false;

			await loadAvailableStories();
			handleOpenStory(filename);
		} catch (error) {
			console.error("Failed to create story:", error);
		}
	}

	function openCreateDialog() {
		creatingStory = true;
	}

	function closeCreateDialog() {
		creatingStory = false;
	}
</script>

<Dialog.Root
	bind:open={creatingStory}
	onOpenChangeComplete={(isOpen) => {
		if (!isOpen) {
			titleInput = "";
			authorInput = "";
			genreInput = "";
			descriptionInput = "";
		}
	}}
>
	<Dialog.Content class="sm:max-w-[425px]">
		<Field.Set>
			<Dialog.Header>
				<Dialog.Title>Create Story</Dialog.Title>
			</Dialog.Header>

			{#if showEmptyWarning}
				<div
					class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
				>
					<p class="text-sm text-destructive">
						Please enter at least a title, author, genre, or
						description to create a story.
					</p>
				</div>
			{/if}

			<Field.Group class="gap-2">
				<Field.Field>
					<Field.Label for="title">Title</Field.Label>
					<Input
						id="title"
						bind:value={titleInput}
						placeholder="Enter story title..."
					/>
					<Field.Description>
						The title of your story. You can always change it later.
					</Field.Description>
				</Field.Field>
				<Field.Field>
					<Field.Label for="author">Author</Field.Label>
					<Input
						id="author"
						bind:value={authorInput}
						placeholder="Your name"
					/>
				</Field.Field>
				<Field.Field>
					<Field.Label for="genre">Genre</Field.Label>
					<Input
						id="genre"
						bind:value={genreInput}
						placeholder="Fantasy, Sci-Fi, etc."
					/>
				</Field.Field>
				<Field.Field>
					<Field.Label for="description">Description</Field.Label>
					<Textarea
						id="description"
						bind:value={descriptionInput}
						placeholder="A short description of your story..."
					/>
				</Field.Field>
			</Field.Group>
		</Field.Set>
		<Dialog.Footer>
			<Button variant="outline" onclick={closeCreateDialog}>
				Cancel
			</Button>
			<Button onclick={handleCreateStory} disabled={!canCreateStory}>
				Create Story
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
<div class="container mx-auto p-6">
	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each Array(6) as _}
				<Card class="animate-pulse">
					<CardHeader>
						<div class="h-6 bg-muted rounded w-3/4"></div>
						<div class="h-4 bg-muted rounded w-1/2"></div>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							<div class="h-4 bg-muted rounded"></div>
							<div class="h-4 bg-muted rounded w-5/6"></div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if stories.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<BookOpenIcon />
				</Empty.Media>
				<Empty.Title>No Stories Yet</Empty.Title>
				<Empty.Description>
					You haven't created any stories yet. Get started by creating
					your first story or importing an existing one.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<div class="flex gap-2">
					<Button onclick={openCreateDialog}>Create Story</Button>
					<Button variant="outline">Import Story</Button>
				</div>
			</Empty.Content>
		</Empty.Root>
	{:else}
		<div class="flex items-center justify-between mb-6">
			<div>
				<h1 class="text-3xl font-bold">My Stories</h1>
				<p class="text-muted-foreground">
					Manage your writing projects
				</p>
			</div>
			<div class="flex gap-2">
				<Button onclick={openCreateDialog}>Create Story</Button>
				<Button variant="outline">Import Story</Button>
			</div>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each stories as story (story.id)}
				<div>
					<Card
						role="button"
						tabindex={0}
						class="hover:shadow-md transition-shadow cursor-pointer"
						onclick={() => handleCardClick(story)}
						onkeydown={(e) =>
							e.key === "Enter" && handleCardClick(story)}
					>
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<CardTitle class="truncate"
										>{story.title}</CardTitle
									>
									{#if story.author}
										<CardDescription
											class="flex items-center gap-1"
										>
											<UserIcon class="size-3" />
											{story.author}
										</CardDescription>
									{/if}
								</div>
								{#if story.genre}
									<Badge variant="outline" class="text-xs">
										{story.genre}
									</Badge>
								{/if}
							</div>
						</CardHeader>
						<CardContent>
							{#if story.description}
								<p
									class="text-sm text-muted-foreground mb-4 line-clamp-2"
								>
									{story.description}
								</p>
							{/if}

							<div
								class="flex justify-between items-start text-sm text-muted-foreground"
							>
								<div class="flex items-center gap-1">
									<CalendarIcon class="size-3" />
									<Time timestamp={story.created} />
								</div>
								<div class="flex items-center gap-1">
									<CalendarIcon class="size-3" />
									<Time timestamp={story.edited} />
								</div>
							</div>

							<div
								class="flex items-center gap-4 text-sm text-muted-foreground"
							>
								<div class="flex items-center gap-1">
									<FileTextIcon class="size-3" />
									<span>
										{formatCount(story.wordCount || 0)} words
									</span>
								</div>
							</div>

							<div class="mt-4 pt-4 border-t">
								<button
									class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 rounded text-sm font-medium"
									onclick={() => handleOpenStory(story.id)}
								>
									Open Story
								</button>
							</div>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>
	{/if}
</div>
