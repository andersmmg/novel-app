<script lang="ts">
	import { startAutosave } from "$lib/autosave";
	import FontSelector from "$lib/components/font-selector.svelte";
	import { LanguageSelector } from "$lib/components/language-selector";
	import ThemeSelector from "$lib/components/theme-selector.svelte";
	import * as ButtonGroup from "$lib/components/ui/button-group";
	import Button from "$lib/components/ui/button/button.svelte";
	import CardContent from "$lib/components/ui/card/card-content.svelte";
	import CardDescription from "$lib/components/ui/card/card-description.svelte";
	import CardHeader from "$lib/components/ui/card/card-header.svelte";
	import CardTitle from "$lib/components/ui/card/card-title.svelte";
	import Card from "$lib/components/ui/card/card.svelte";
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import Input from "$lib/components/ui/input/input.svelte";
	import { Label } from "$lib/components/ui/label";
	import * as NumberField from "$lib/components/ui/number-field";
	import * as Select from "$lib/components/ui/select";
	import * as Table from "$lib/components/ui/table";
	import { config, saveConfig, type AppConfig } from "$lib/config";
	import {
		ArrowDownToLine,
		ArrowUpToLine,
		BoldIcon,
		Heading1Icon,
		Heading2Icon,
		ItalicIcon,
		ListIcon,
		ListOrderedIcon,
		ListTodoIcon,
		MinusIcon,
		PilcrowIcon,
		PlusIcon,
		SettingsIcon,
		TextSearchIcon,
		TrashIcon,
		UnderlineIcon,
		UnfoldHorizontalIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";

	let manageCustomWordsOpen = $state(false);

	function handleIntervalChange(event: Event) {
		if (!$config) return;
		const target = event.target as HTMLInputElement;
		if (config && target.value) {
			const value = parseInt(target.value);
			if (!isNaN(value) && value > 0) {
				$config.autosave.intervalMinutes = value;
			}
		}
	}

	function setThemeMode(mode: AppConfig["themeMode"]) {
		if ($config) {
			$config.themeMode = mode;
		}
	}

	onMount(() => {
		return () => {
			saveConfig();
		};
	});
</script>

<div class="container mx-auto p-6">
	<h1 class="text-2xl mb-4 flex items-center gap-2">
		<SettingsIcon />
		Settings
	</h1>

	{#if $config}
		<div class="space-y-2">
			<Card>
				<CardHeader>
					<CardTitle>Autosave</CardTitle>
					<CardDescription>
						Configure automatic saving of your story to prevent data
						loss.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center gap-3">
						<Checkbox
							id="autosave-enabled"
							bind:checked={$config.autosave.enabled}
							onCheckedChange={() => {
								startAutosave();
							}}
						/>
						<Label for="autosave-enabled">Enable autosave</Label>
					</div>

					{#if $config.autosave.enabled}
						<div class="space-y-2">
							<label
								for="autosave-interval"
								class="text-sm font-medium"
							>
								Autosave interval (minutes)
							</label>
							<Input
								id="autosave-interval"
								type="number"
								min="1"
								max="60"
								value={$config.autosave.intervalMinutes}
								onchange={handleIntervalChange}
								placeholder="Enter minutes between autosaves"
							/>
							<p class="text-xs text-muted-foreground">
								Story will be automatically saved every {$config
									.autosave.intervalMinutes} minute{$config
									.autosave.intervalMinutes !== 1
									? "s"
									: ""}
							</p>
						</div>
					{/if}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Theme</CardTitle>
					<CardDescription>
						Choose your preferred visual theme.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ThemeSelector />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Theme Mode</CardTitle>
					<CardDescription>
						Choose between dark and light modes.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex items-center gap-2">
						<Button
							variant={$config.themeMode === "light"
								? "default"
								: "outline"}
							size="sm"
							onclick={() => setThemeMode("light")}
						>
							Light
						</Button>
						<Button
							variant={$config.themeMode === "dark"
								? "default"
								: "outline"}
							size="sm"
							onclick={() => setThemeMode("dark")}
						>
							Dark
						</Button>
						<Button
							variant={$config.themeMode === "system"
								? "default"
								: "outline"}
							size="sm"
							onclick={() => setThemeMode("system")}
						>
							System
						</Button>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Fonts</CardTitle>
					<CardDescription>
						Customize fonts used throughout application.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					{#if config}
						<FontSelector
							category="ui"
							label="UI Font"
							bind:value={$config.fonts.ui}
						/>
						<FontSelector
							category="editor"
							label="Editor Font"
							bind:value={$config.fonts.editor}
						/>
					{/if}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Spellcheck</CardTitle>
					<CardDescription>
						Configure the spellcheck system.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center gap-3">
						<Checkbox
							id="spellcheck-enabled"
							bind:checked={$config.spellcheck.enabled}
						/>
						<Label for="spellcheck-enabled">Enable Spellcheck</Label
						>
					</div>
					{#if $config.spellcheck.enabled}
						<div class="flex flex-col gap-2">
							<Label for="spellcheck-language">Language</Label>
							<LanguageSelector
								id="spellcheck-language"
								availableLanguages={["en_US", "tok"]}
								currentLanguage={$config?.spellcheck
									?.language || "en_US"}
								onLanguageChange={(newLang) => {
									if ($config) {
										$config.spellcheck.language = newLang;
									}
								}}
							/>
						</div>
						<Button
							variant="secondary"
							onclick={() => (manageCustomWordsOpen = true)}
							>Manage Custom Words</Button
						>
					{/if}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Editor Toolbar</CardTitle>
					<CardDescription>
						Customize the items in the editor toolbar.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex gap-1 items-center overflow-x-auto pb-2">
						<ButtonGroup.Root>
							<Button
								tooltipContent="Heading 1"
								size="sm"
								variant={$config.editor.toolbarItems.heading1
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.heading1 =
										!$config.editor.toolbarItems.heading1;
								}}><Heading1Icon /></Button
							>
							<Button
								tooltipContent="Heading 2"
								size="sm"
								variant={$config.editor.toolbarItems.heading2
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.heading2 =
										!$config.editor.toolbarItems.heading2;
								}}><Heading2Icon /></Button
							>
							<Button
								tooltipContent="Paragraph"
								size="sm"
								variant={$config.editor.toolbarItems.paragraph
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.paragraph =
										!$config.editor.toolbarItems.paragraph;
								}}><PilcrowIcon /></Button
							>
						</ButtonGroup.Root>
						<!-- Formatting -->
						<ButtonGroup.Root>
							<Button
								tooltipContent="Bold"
								size="sm"
								variant={$config.editor.toolbarItems.bold
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.bold =
										!$config.editor.toolbarItems.bold;
								}}><BoldIcon /></Button
							>
							<Button
								tooltipContent="Italic"
								size="sm"
								variant={$config.editor.toolbarItems.italic
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.italic =
										!$config.editor.toolbarItems.italic;
								}}><ItalicIcon /></Button
							>
							<Button
								tooltipContent="Underline"
								size="sm"
								variant={$config.editor.toolbarItems.underline
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.underline =
										!$config.editor.toolbarItems.underline;
								}}><UnderlineIcon /></Button
							>
						</ButtonGroup.Root>
						<!-- Lists -->
						<ButtonGroup.Root>
							<Button
								tooltipContent="List"
								size="sm"
								variant={$config.editor.toolbarItems.list
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.list =
										!$config.editor.toolbarItems.list;
								}}><ListIcon /></Button
							>
							<Button
								tooltipContent="Numbered List"
								size="sm"
								variant={$config.editor.toolbarItems
									.numberedList
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.numberedList =
										!$config.editor.toolbarItems
											.numberedList;
								}}><ListOrderedIcon /></Button
							>
							<Button
								tooltipContent="Task List"
								size="sm"
								variant={$config.editor.toolbarItems.taskList
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.taskList =
										!$config.editor.toolbarItems.taskList;
								}}><ListTodoIcon /></Button
							>
						</ButtonGroup.Root>
						<!-- Focus -->
						<ButtonGroup.Root>
							<Button
								tooltipContent="Jump to Start"
								size="sm"
								variant={$config.editor.toolbarItems.top
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.top =
										!$config.editor.toolbarItems.top;
								}}><ArrowUpToLine /></Button
							>
							<Button
								tooltipContent="Jump to End"
								size="sm"
								variant={$config.editor.toolbarItems.bottom
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.bottom =
										!$config.editor.toolbarItems.bottom;
								}}><ArrowDownToLine /></Button
							>
							<Button
								tooltipContent="Find"
								size="sm"
								variant={$config.editor.toolbarItems.find
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.find =
										!$config.editor.toolbarItems.find;
								}}><TextSearchIcon /></Button
							>
						</ButtonGroup.Root>
						<!-- Font Size -->
						<ButtonGroup.Root class="ms-auto">
							<Button
								tooltipContent="Editor Font Size"
								size="sm"
								variant={$config.editor.toolbarItems.fontSize
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.fontSize =
										!$config.editor.toolbarItems.fontSize;
								}}><MinusIcon />16<PlusIcon /></Button
							>
						</ButtonGroup.Root>
						<!-- View -->
						<ButtonGroup.Root>
							<Button
								tooltipContent="Expand Editor Width"
								size="sm"
								variant={$config.editor.toolbarItems.expandWidth
									? "default"
									: "outline"}
								class="border"
								onclick={() => {
									$config.editor.toolbarItems.expandWidth =
										!$config.editor.toolbarItems
											.expandWidth;
								}}><UnfoldHorizontalIcon /></Button
							>
						</ButtonGroup.Root>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>File Load Positions</CardTitle>
					<CardDescription>
						Where to place the cursor when opening a chapter or
						note.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex flex-col gap-2">
						<Label for="note-open-position">Notes</Label>
						<Select.Root
							type="single"
							bind:value={$config.noteOpenPosition}
						>
							<Select.Trigger class="w-45" id="note-open-position"
								><span
									>{$config.noteOpenPosition == "start"
										? "Start"
										: "End"}</span
								></Select.Trigger
							>
							<Select.Content>
								<Select.Item value="start">Start</Select.Item>
								<Select.Item value="end">End</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="chapter-open-position">Chapters</Label>
						<Select.Root
							type="single"
							bind:value={$config.chapterOpenPosition}
						>
							<Select.Trigger
								class="w-45"
								id="chapter-open-position"
								><span
									>{$config.chapterOpenPosition == "start"
										? "Start"
										: "End"}</span
								></Select.Trigger
							>
							<Select.Content>
								<Select.Item value="start">Start</Select.Item>
								<Select.Item value="end">End</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Story Statistics</CardTitle>
					<CardDescription>
						Configure statistics to display in the story overview.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex items-center gap-3">
							<Checkbox
								id="stats-chapters"
								bind:checked={$config.stats.display.chapters}
							/>
							<Label for="stats-chapters">Chapters</Label>
						</div>
						<div class="flex items-center gap-3">
							<Checkbox
								id="stats-words"
								bind:checked={$config.stats.display.words}
							/>
							<Label for="stats-words">Words</Label>
						</div>
						<div class="flex items-center gap-3">
							<Checkbox
								id="stats-notes"
								bind:checked={$config.stats.display.notes}
							/>
							<Label for="stats-notes">Notes</Label>
						</div>
						<div class="flex items-center gap-3">
							<Checkbox
								id="stats-quotes"
								bind:checked={$config.stats.display.quotes}
							/>
							<Label for="stats-quotes">Quotes</Label>
						</div>
						<div class="flex items-center gap-3">
							<Checkbox
								id="stats-paragraphs"
								bind:checked={$config.stats.display.paragraphs}
							/>
							<Label for="stats-paragraphs">Paragraphs</Label>
						</div>
					</div>
					<div class="flex items-center gap-3 pt-2">
						<Label for="min-words-per-paragraph"
							>Minimum Words in Paragraph</Label
						>

						<NumberField.Root
							min={1}
							max={50}
							bind:value={$config.stats.minWordsPerParagraph}
						>
							<NumberField.Group>
								<NumberField.Decrement />
								<NumberField.Input
									id="min-words-per-paragraph"
								/>
								<NumberField.Increment />
							</NumberField.Group>
						</NumberField.Root>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Hemingway Mode</CardTitle>
					<CardDescription>
						Writing mode that prevents editing previous content to
						encourage forward momentum. Only applies to chapters.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center gap-3">
						<Checkbox
							id="hemingway-enabled"
							bind:checked={$config.editor.hemingway.enabled}
						/>
						<Label for="hemingway-enabled"
							>Enable Hemingway mode</Label
						>
					</div>

					{#if $config.editor.hemingway.enabled}
						<div class="flex items-center gap-3">
							<Checkbox
								id="hemingway-allow-additions"
								bind:checked={
									$config.editor.hemingway.allowAdditions
								}
							/>
							<Label for="hemingway-allow-additions"
								>Allow additions</Label
							>
						</div>
						<p class="text-xs text-muted-foreground">
							When enabled, you can only add new text at the end
							of chapters. Cursor movement is still allowed but
							typing is restricted.
						</p>

						<div class="flex items-center gap-3">
							<Checkbox
								id="hemingway-spellcheck"
								bind:checked={
									$config.editor.hemingway.spellcheck
								}
							/>
							<Label for="hemingway-spellcheck">Spellcheck</Label>
						</div>
						<p class="text-xs text-muted-foreground">
							Spellcheck is disabled in Hemingway mode by default,
							but you can enable it here.
						</p>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}
	<div class="text-sm text-muted-foreground mt-2 cursor-default">
		v{__APP_VERSION__}
	</div>
</div>
<Dialog.Root bind:open={manageCustomWordsOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Custom Words</Dialog.Title>
			<Dialog.Description>
				Manage your custom dictionary for spellchecking.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid grid-rows-[auto_1fr] max-h-60">
			<Table.Root>
				<Table.Header class="border-b">
					<Table.Row>
						<Table.Head>Word</Table.Head>
						<Table.Head class="text-end">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
			</Table.Root>
			<div class="overflow-auto">
				<Table.Root>
					<Table.Body>
						{#each $config?.spellcheck.customWords as word}
							<Table.Row>
								<Table.Cell>{word}</Table.Cell>
								<Table.Cell class="text-end">
									<Button
										variant="secondary"
										size="icon"
										onclick={() => {
											if (
												!$config?.spellcheck.customWords
											)
												return;
											$config.spellcheck.customWords =
												$config?.spellcheck.customWords.filter(
													(w) => w !== word,
												);
										}}
									>
										<TrashIcon />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
