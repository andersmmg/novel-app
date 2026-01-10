<script lang='ts'>
	import { goto } from '$app/navigation'
	import {
		appState,
		forceSelectedStoryUpdate,
		saveCurrentStory,
	} from '$lib/app-state.svelte'
	import GoalsDialog from '$lib/components/goals-dialog'
	import { Badge } from '$lib/components/ui/badge'
	import { Button } from '$lib/components/ui/button'
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card'
	import * as Field from '$lib/components/ui/field'
	import { Input } from '$lib/components/ui/input'
	import { Textarea } from '$lib/components/ui/textarea'
	import { config } from '$lib/config'
	import { formatCount } from '$lib/story/utils'

	import { onMount } from 'svelte'
	import Time from 'svelte-time'

	import BookOpenIcon from 'virtual:icons/lucide/book-open'
	import WrenchIcon from 'virtual:icons/lucide/wrench'

	let isEditing = $state(false)
	let titleInput = $state('')
	let authorInput = $state('')
	let genreInput = $state('')
	let descriptionInput = $state('')
	let showingTotalWords = $state(false)
	let showingTotalQuotes = $state(false)
	let showingTotalParagraphs = $state(false)
	let notesParagraphCount = $state(0)

	const storyMetadata = $derived(appState.selectedStory?.metadata || {})

	const chapterCount = $derived(appState.selectedStory?.chapters.length || 0)
	const chapterWordCount = $derived.by(() => {
		if (!appState.selectedStory)
			return 0
		return appState.selectedStory.getWordCount()
	})
	const notesWordCount = $derived.by(() => {
		if (!appState.selectedStory)
			return 0
		return appState.selectedStory.getNotesWordCount()
	})
	const chapterQuoteCount = $derived.by(() => {
		if (!appState.selectedStory)
			return 0
		return appState.selectedStory.getQuoteCount()
	})
	const notesQuoteCount = $derived.by(() => {
		if (!appState.selectedStory)
			return 0
		return appState.selectedStory.getNotesQuoteCount()
	})
	let chapterParagraphCount = $state(0)

	$effect(() => {
		if (appState.selectedStory) {
			appState.selectedStory.getParagraphCount().then((count) => {
				chapterParagraphCount = count
			})
			appState.selectedStory.getNotesParagraphCount().then((count) => {
				notesParagraphCount = count
			})
		}
		else {
			chapterParagraphCount = 0
			notesParagraphCount = 0
		}
	})
	const totalNotes = $derived.by(() => {
		if (!appState.selectedStory)
			return 0
		let count = appState.selectedStory.rootNotes.length

		function countNotesInFolder(folder: any): number {
			let folderCount = 0
			for (const child of folder.children) {
				if ('children' in child) {
					folderCount += countNotesInFolder(child)
				}
				else {
					folderCount++
				}
			}
			return folderCount
		}

		for (const folder of appState.selectedStory.notes) {
			count += countNotesInFolder(folder)
		}
		return count
	})

	onMount(() => {
		if (appState.selectedStory) {
			titleInput = appState.selectedStory.metadata.title || ''
			authorInput = appState.selectedStory.metadata.author || ''
			genreInput = appState.selectedStory.metadata.genre || ''
			descriptionInput
				= appState.selectedStory.metadata.description || ''
		}
	})

	function startEditing() {
		if (appState.selectedStory) {
			titleInput = appState.selectedStory.metadata.title || ''
			authorInput = appState.selectedStory.metadata.author || ''
			genreInput = appState.selectedStory.metadata.genre || ''
			descriptionInput
				= appState.selectedStory.metadata.description || ''
		}
		isEditing = true
	}

	async function saveChanges() {
		if (!appState.selectedStory)
			return

		appState.selectedStory.updateMetadata({
			title: titleInput.trim() || 'Untitled Story',
			author: authorInput.trim(),
			genre: genreInput.trim(),
			description: descriptionInput.trim(),
			edited: new Date(),
		})
		forceSelectedStoryUpdate()

		await saveCurrentStory()
		isEditing = false
	}

	function cancelEditing() {
		if (appState.selectedStory) {
			titleInput = appState.selectedStory.metadata.title || ''
			authorInput = appState.selectedStory.metadata.author || ''
			genreInput = appState.selectedStory.metadata.genre || ''
			descriptionInput
				= appState.selectedStory.metadata.description || ''
		}
		isEditing = false
	}

	async function saveGoals(goals: any) {
		if (!appState.selectedStory)
			return

		appState.selectedStory.updateMetadata({
			goals,
		})
		forceSelectedStoryUpdate()
		await saveCurrentStory()
	}

	function getProgress(current: number, target: number): number {
		return Math.min((current / target) * 100, 100)
	}
</script>

<div class='container mx-auto p-6 space-y-6'>
	{#if !appState.selectedStory}
		<div class='text-center py-12'>
			<h2 class='text-2xl font-semibold mb-2'>No Story Selected</h2>
			<p class='text-muted-foreground'>
				Please select a story to view its details.
			</p>
		</div>
	{:else}
		<!-- Header -->
		<div class='flex items-center justify-between'>
			<h1 class='text-2xl flex items-center gap-2'>
				<BookOpenIcon />
				Story Overview
			</h1>
		</div>

		<!-- Main Content Grid -->
		<div class='grid grid-cols-1 lg:grid-cols-3 gap-4'>
			<!-- Story Metadata Section -->
			<div class='lg:col-span-2 space-y-4'>
				<Card>
					<CardContent>
						{#if isEditing}
							<Field.Set>
								<Field.Group class='gap-4'>
									<Field.Field>
										<Field.Label for='title'
										>Title</Field.Label
										>
										<Input
											id='title'
											bind:value={titleInput}
											placeholder='Enter story title'
										/>
										<Field.Description>
											The title of your story. You can
											always change it later.
										</Field.Description>
									</Field.Field>
									<Field.Field>
										<Field.Label for='author'
										>Author</Field.Label
										>
										<Input
											id='author'
											bind:value={authorInput}
											placeholder='Enter author name'
										/>
									</Field.Field>
									<Field.Field>
										<Field.Label for='genre'
										>Genre</Field.Label
										>
										<Input
											id='genre'
											bind:value={genreInput}
											placeholder='Fantasy, Sci-Fi, etc.'
										/>
									</Field.Field>
									<Field.Field>
										<Field.Label for='description'
										>Description</Field.Label
										>
										<Textarea
											class='bg-background'
											id='description'
											bind:value={descriptionInput}
											placeholder='A short description of your story...'
										/>
									</Field.Field>
								</Field.Group>
								<div class='flex gap-2 pt-4'>
									<Button onclick={saveChanges}
									>Save Changes</Button
									>
									<Button
										variant='outline'
										onclick={cancelEditing}>Cancel</Button
									>
								</div>
							</Field.Set>
						{:else}
							<div class='space-y-3'>
								<div>
									<div class='flex items-center'>
										<h3 class='text-lg font-semibold'>
											{storyMetadata.title}
										</h3>
										<Button
											variant='outline'
											size='sm'
											class='ms-auto'
											onclick={startEditing}
											disabled={isEditing}
										>
											Edit
										</Button>
									</div>
									{#if storyMetadata.author}
										<p class='text-muted-foreground'>
											by {storyMetadata.author}
										</p>
									{/if}
								</div>
								{#if storyMetadata.genre}
									<Badge variant='secondary'
									>{storyMetadata.genre}</Badge
									>
								{/if}
								{#if storyMetadata.description}
									<p
										class='text-sm text-muted-foreground leading-relaxed'
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
						<div class='space-y-3'>
							<div class='flex items-center gap-3 text-sm'>
								<div
									class='w-2 h-2 bg-green-500 rounded-full'
								></div>
								<span>Chapter 12 completed</span>
								<span class='text-muted-foreground ml-auto'
								>2 hours ago</span
								>
							</div>
							<div class='flex items-center gap-3 text-sm'>
								<div
									class='w-2 h-2 bg-blue-500 rounded-full'
								></div>
								<span>Added character notes</span>
								<span class='text-muted-foreground ml-auto'
								>1 day ago</span
								>
							</div>
							<div class='flex items-center gap-3 text-sm'>
								<div
									class='w-2 h-2 bg-purple-500 rounded-full'
								></div>
								<span>Revised Chapter 8</span>
								<span class='text-muted-foreground ml-auto'
								>3 days ago</span
								>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Stats Section -->
			<div class='space-y-4'>
				<Card>
					<CardHeader>
						<CardTitle class='flex items-center'>
							<span>Story Statistics</span>
							<div class='ms-auto flex gap-2'>
								<GoalsDialog
									metadata={storyMetadata}
									onSave={saveGoals}
								/>
								<Button
									variant='outline'
									size='icon-sm'
									onclick={() =>
										goto(
											'/settings#min-words-per-paragraph',
										)}
								>
									<WrenchIcon />
								</Button>
							</div></CardTitle
						>
						<CardDescription>Track your progress</CardDescription>
					</CardHeader>
					<CardContent class='space-y-4'>
						<div class='grid grid-cols-2 gap-4'>
							{#if $config?.stats.display.chapters}
								<div
									class='text-center p-3 bg-muted rounded-lg'
								>
									<div
										class='text-2xl font-bold text-primary'
									>
										{chapterCount}
									</div>
									<div class='text-xs text-muted-foreground'>
										Chapters
									</div>
									{#if storyMetadata.goals?.chapters?.enabled}
										<div class='mt-2'>
											<div
												class='w-full bg-background rounded-full h-1.5'
											>
												<div
													class='bg-primary h-1.5 rounded-full transition-all'
													style='width: {getProgress(
														chapterCount,
														storyMetadata.goals
															.chapters.target,
													)}%'
												></div>
											</div>
											<div
												class='text-xs text-muted-foreground mt-1'
											>
												{chapterCount} / {storyMetadata
													.goals
													.chapters
													.target}
											</div>
										</div>
									{/if}
								</div>
							{/if}
							{#if $config?.stats.display.words}
								<button
									class='text-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors w-full'
									onclick={() =>
										(showingTotalWords
											= !showingTotalWords)}
								>
									<div
										class='text-2xl font-bold text-primary'
										title={(showingTotalWords
											? chapterWordCount + notesWordCount
											: chapterWordCount
										).toLocaleString()}
									>
										{formatCount(
											showingTotalWords
												? chapterWordCount + notesWordCount
												: chapterWordCount,
										)}
									</div>
									<div class='text-xs text-muted-foreground'>
										{showingTotalWords
											? 'Total Words'
											: 'Words'}
									</div>
									{#if storyMetadata.goals?.words?.enabled}
										<div
											class='mt-2'
											role='presentation'
											onclick={e => e.stopPropagation()}
										>
											<div
												class='w-full bg-background rounded-full h-1.5'
											>
												<div
													class='bg-primary h-1.5 rounded-full transition-all'
													style='width: {getProgress(
														chapterWordCount,
														storyMetadata.goals
															.words.target,
													)}%'
												></div>
											</div>
											<div
												class='text-xs text-muted-foreground mt-1'
											>
												{chapterWordCount.toLocaleString()}
												/ {storyMetadata.goals.words.target.toLocaleString()}
											</div>
										</div>
									{/if}
								</button>
							{/if}
							{#if $config?.stats.display.notes}
								<div
									class='text-center p-3 bg-muted rounded-lg'
								>
									<div
										class='text-2xl font-bold text-primary'
									>
										{totalNotes}
									</div>
									<div class='text-xs text-muted-foreground'>
										Notes
									</div>
									{#if storyMetadata.goals?.notes?.enabled}
										<div class='mt-2'>
											<div
												class='w-full bg-background rounded-full h-1.5'
											>
												<div
													class='bg-primary h-1.5 rounded-full transition-all'
													style='width: {getProgress(
														totalNotes,
														storyMetadata.goals
															.notes.target,
													)}%'
												></div>
											</div>
											<div
												class='text-xs text-muted-foreground mt-1'
											>
												{totalNotes} / {storyMetadata
													.goals
													.notes
													.target}
											</div>
										</div>
									{/if}
								</div>
							{/if}
							{#if $config?.stats.display.quotes}
								<button
									class='text-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors w-full'
									onclick={() =>
										(showingTotalQuotes
											= !showingTotalQuotes)}
								>
									<div
										class='text-2xl font-bold text-primary'
										title={(showingTotalQuotes
											? chapterQuoteCount + notesQuoteCount
											: chapterQuoteCount
										).toLocaleString()}
									>
										{formatCount(
											showingTotalQuotes
												? chapterQuoteCount + notesQuoteCount
												: chapterQuoteCount,
										)}
									</div>
									<div class='text-xs text-muted-foreground'>
										{showingTotalQuotes
											? 'Total Quotes'
											: 'Quotes'}
									</div>
									{#if storyMetadata.goals?.quotes?.enabled}
										<div
											class='mt-2'
											role='presentation'
											onclick={e => e.stopPropagation()}
										>
											<div
												class='w-full bg-background rounded-full h-1.5'
											>
												<div
													class='bg-primary h-1.5 rounded-full transition-all'
													style='width: {getProgress(
														chapterQuoteCount,
														storyMetadata.goals
															.quotes.target,
													)}%'
												></div>
											</div>
											<div
												class='text-xs text-muted-foreground mt-1'
											>
												{chapterQuoteCount.toLocaleString()}
												/ {storyMetadata.goals.quotes.target.toLocaleString()}
											</div>
										</div>
									{/if}
								</button>
							{/if}
							{#if $config?.stats.display.paragraphs}
								<button
									class='text-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors w-full'
									onclick={() =>
										(showingTotalParagraphs
											= !showingTotalParagraphs)}
								>
									<div
										class='text-2xl font-bold text-primary'
										title={(showingTotalParagraphs
											? chapterParagraphCount + notesParagraphCount
											: chapterParagraphCount
										).toLocaleString()}
									>
										{formatCount(
											showingTotalParagraphs
												? chapterParagraphCount + notesParagraphCount
												: chapterParagraphCount,
										)}
									</div>
									<div class='text-xs text-muted-foreground'>
										{showingTotalParagraphs
											? 'Total Paragraphs'
											: 'Paragraphs'}
									</div>
									{#if storyMetadata.goals?.paragraphs?.enabled}
										<div
											class='mt-2'
											role='presentation'
											onclick={e => e.stopPropagation()}
										>
											<div
												class='w-full bg-background rounded-full h-1.5'
											>
												<div
													class='bg-primary h-1.5 rounded-full transition-all'
													style='width: {getProgress(
														chapterParagraphCount,
														storyMetadata.goals
															.paragraphs.target,
													)}%'
												></div>
											</div>
											<div
												class='text-xs text-muted-foreground mt-1'
											>
												{chapterParagraphCount.toLocaleString()}
												/ {storyMetadata.goals.paragraphs.target.toLocaleString()}
											</div>
										</div>
									{/if}
								</button>
							{/if}
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
					<CardContent class='space-y-3'>
						<div class='flex justify-between items-center'>
							<span class='text-sm text-muted-foreground'
							>Created</span
							>
							<span class='text-sm font-medium'>
								<Time
									timestamp={storyMetadata.created}
									relative
									live
								/>
							</span>
						</div>
						<div class='flex justify-between items-center'>
							<span class='text-sm text-muted-foreground'
							>Last Edited</span
							>
							<span class='text-sm font-medium'>
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
