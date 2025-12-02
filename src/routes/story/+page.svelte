<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import Time from "svelte-time";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import * as Field from "$lib/components/ui/field/index.js";
	import {
		appState,
		saveCurrentStory,
		selectStoryById,
	} from "$lib/app-state.svelte";
	import { onMount } from "svelte";
	import { formatDate } from "$lib/utils";
	import { BookOpenIcon, SettingsIcon } from "@lucide/svelte";

	let isEditing = $state(false);
	let titleInput = $state("");
	let authorInput = $state("");
	let genreInput = $state("");
	let descriptionInput = $state("");

	const selectedStory = $derived(appState.selectedStory);
	const storyMetadata = $derived(selectedStory?.metadata || {});

	// Calculate stats from the story data
	const chapterCount = $derived(selectedStory?.chapters.length || 0);
	const totalNotes = $derived.by(() => {
		if (!selectedStory) return 0;
		let count = selectedStory.rootNotes.length;

		function countNotesInFolder(folder: any): number {
			let folderCount = 0;
			for (const child of folder.children) {
				if ("children" in child) {
					folderCount += countNotesInFolder(child);
				} else {
					folderCount++;
				}
			}
			return folderCount;
		}

		for (const folder of selectedStory.notes) {
			count += countNotesInFolder(folder);
		}
		return count;
	});

	onMount(() => {
		if (selectedStory) {
			titleInput = selectedStory.metadata.title || "";
			authorInput = selectedStory.metadata.author || "";
			genreInput = selectedStory.metadata.genre || "";
			descriptionInput = selectedStory.metadata.description || "";
		}
	});

	function startEditing() {
		if (selectedStory) {
			titleInput = selectedStory.metadata.title || "";
			authorInput = selectedStory.metadata.author || "";
			genreInput = selectedStory.metadata.genre || "";
			descriptionInput = selectedStory.metadata.description || "";
		}
		isEditing = true;
	}

	async function saveChanges() {
		if (!selectedStory) return;

		selectedStory.updateMetadata({
			title: titleInput.trim() || "Untitled Story",
			author: authorInput.trim(),
			genre: genreInput.trim(),
			description: descriptionInput.trim(),
			edited: new Date(),
		});

		await saveCurrentStory();
		isEditing = false;
	}

	function cancelEditing() {
		if (selectedStory) {
			titleInput = selectedStory.metadata.title || "";
			authorInput = selectedStory.metadata.author || "";
			genreInput = selectedStory.metadata.genre || "";
			descriptionInput = selectedStory.metadata.description || "";
		}
		isEditing = false;
	}

	// TODO: Actual data
	const wordCount = $derived("45.2k");
	const pageCount = $derived("287");
</script>

<div class="container mx-auto p-6 space-y-6">
	{#if !selectedStory}
		<div class="text-center py-12">
			<h2 class="text-2xl font-semibold mb-2">No Story Selected</h2>
			<p class="text-muted-foreground">
				Please select a story to view its details.
			</p>
		</div>
	{:else}
		<!-- Header -->
		<div class="flex items-center justify-between">
			<h1 class="text-2xl flex items-center gap-2">
				<BookOpenIcon />
				Story Overview
			</h1>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<!-- Story Metadata Section -->
			<div class="lg:col-span-2 space-y-4">
				<Card>
					<CardContent>
						{#if isEditing}
							<Field.Set>
								<Field.Group class="gap-4">
									<Field.Field>
										<Field.Label for="title"
											>Title</Field.Label
										>
										<Input
											id="title"
											bind:value={titleInput}
											placeholder="Enter story title"
										/>
										<Field.Description>
											The title of your story. You can
											always change it later.
										</Field.Description>
									</Field.Field>
									<Field.Field>
										<Field.Label for="author"
											>Author</Field.Label
										>
										<Input
											id="author"
											bind:value={authorInput}
											placeholder="Enter author name"
										/>
									</Field.Field>
									<Field.Field>
										<Field.Label for="genre"
											>Genre</Field.Label
										>
										<Input
											id="genre"
											bind:value={genreInput}
											placeholder="Fantasy, Sci-Fi, etc."
										/>
									</Field.Field>
									<Field.Field>
										<Field.Label for="description"
											>Description</Field.Label
										>
										<Textarea
											id="description"
											bind:value={descriptionInput}
											placeholder="A short description of your story..."
										/>
									</Field.Field>
								</Field.Group>
								<div class="flex gap-2 pt-4">
									<Button onclick={saveChanges}
										>Save Changes</Button
									>
									<Button
										variant="outline"
										onclick={cancelEditing}>Cancel</Button
									>
								</div>
							</Field.Set>
						{:else}
							<div class="space-y-3">
								<div>
									<div class="flex items-center">
										<h3 class="text-lg font-semibold">
											{storyMetadata.title}
										</h3>
										<Button
											variant="outline"
											size="sm"
											class="ms-auto"
											onclick={startEditing}
											disabled={isEditing}
										>
											Edit
										</Button>
									</div>
									{#if storyMetadata.author}
										<p class="text-muted-foreground">
											by {storyMetadata.author}
										</p>
									{/if}
								</div>
								{#if storyMetadata.genre}
									<Badge variant="secondary"
										>{storyMetadata.genre}</Badge
									>
								{/if}
								{#if storyMetadata.description}
									<p
										class="text-sm text-muted-foreground leading-relaxed"
									>
										{storyMetadata.description}
									</p>
								{/if}
							</div>
						{/if}
					</CardContent>
				</Card>
				<!-- Recent Activity -->
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription
							>Latest changes to your story</CardDescription
						>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							<div class="flex items-center gap-3 text-sm">
								<div
									class="w-2 h-2 bg-green-500 rounded-full"
								></div>
								<span>Chapter 12 completed</span>
								<span class="text-muted-foreground ml-auto"
									>2 hours ago</span
								>
							</div>
							<div class="flex items-center gap-3 text-sm">
								<div
									class="w-2 h-2 bg-blue-500 rounded-full"
								></div>
								<span>Added character notes</span>
								<span class="text-muted-foreground ml-auto"
									>1 day ago</span
								>
							</div>
							<div class="flex items-center gap-3 text-sm">
								<div
									class="w-2 h-2 bg-purple-500 rounded-full"
								></div>
								<span>Revised Chapter 8</span>
								<span class="text-muted-foreground ml-auto"
									>3 days ago</span
								>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Stats Section -->
			<div class="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Story Statistics</CardTitle>
						<CardDescription>Track your progress</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div class="text-center p-3 bg-muted rounded-lg">
								<div class="text-2xl font-bold text-primary">
									{chapterCount}
								</div>
								<div class="text-xs text-muted-foreground">
									Chapters
								</div>
							</div>
							<div class="text-center p-3 bg-muted rounded-lg">
								<div class="text-2xl font-bold text-primary">
									{wordCount}
								</div>
								<div class="text-xs text-muted-foreground">
									Words
								</div>
							</div>
							<div class="text-center p-3 bg-muted rounded-lg">
								<div class="text-2xl font-bold text-primary">
									{pageCount}
								</div>
								<div class="text-xs text-muted-foreground">
									Pages
								</div>
							</div>
							<div class="text-center p-3 bg-muted rounded-lg">
								<div class="text-2xl font-bold text-primary">
									{totalNotes}
								</div>
								<div class="text-xs text-muted-foreground">
									Notes
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Timeline</CardTitle>
						<CardDescription
							>Story creation and updates</CardDescription
						>
					</CardHeader>
					<CardContent class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-sm text-muted-foreground"
								>Created</span
							>
							<span class="text-sm font-medium">
								<Time
									timestamp={storyMetadata.created}
									relative
									live
								/>
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-muted-foreground"
								>Last Edited</span
							>
							<span class="text-sm font-medium">
								<Time
									timestamp={storyMetadata.edited}
									relative
									live
								/>
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div>
