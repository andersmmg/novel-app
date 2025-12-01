<script lang="ts">
	import { goto } from "$app/navigation";
	import { appState } from "$lib/app-state.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import type { StoryListItem } from "$lib/story/types";
	import BookOpenIcon from "@tabler/icons-svelte/icons/book";
	import CalendarIcon from "@tabler/icons-svelte/icons/calendar";
	import UserIcon from "@tabler/icons-svelte/icons/user";

	const stories: StoryListItem[] = appState.availableStories;
	let loading = true;

	function formatDate(date: Date): string {
		if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
			return "Unknown date";
		}

		try {
			return new Intl.DateTimeFormat("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(date);
		} catch (error) {
			return "Invalid date";
		}
	}

	async function handleOpenStory(storyId: string) {
		// await selectStoryById(storyId);
		goto("/");
	}

	function handleCardClick(story: StoryListItem) {
		handleOpenStory(story.id);
	}
</script>

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
					<Button>Create Story</Button>
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
				<Button>Create Story</Button>
				<Button variant="outline">Import Story</Button>
			</div>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each stories as story (story.id)}
				<div
					role="button"
					tabindex="0"
					class="hover:shadow-md transition-shadow cursor-pointer"
					on:click={() => handleCardClick(story)}
					on:keydown={(e) =>
						e.key === "Enter" && handleCardClick(story)}
				>
					<Card>
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
								<Badge
									variant={story.isDirectory
										? "secondary"
										: "default"}
								>
									{story.isDirectory ? "Folder" : "File"}
								</Badge>
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
								class="flex items-center justify-between text-sm text-muted-foreground"
							>
								<div class="flex items-center gap-1">
									<CalendarIcon class="size-3" />
									{formatDate(story.edited)}
								</div>
								{#if story.genre}
									<Badge variant="outline" class="text-xs">
										{story.genre}
									</Badge>
								{/if}
							</div>

							<div class="mt-4 pt-4 border-t">
								<button
									class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 rounded text-sm font-medium"
									on:click={() => handleOpenStory(story.id)}
								>
									Open Novel
								</button>
							</div>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>
	{/if}
</div>
