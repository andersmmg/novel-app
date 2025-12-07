<script lang="ts">
	import { startAutosave } from "$lib/autosave";
	import FontSelector from "$lib/components/font-selector.svelte";
	import ThemeSelector from "$lib/components/theme-selector.svelte";
	import * as ButtonGroup from "$lib/components/ui/button-group";
	import Button from "$lib/components/ui/button/button.svelte";
	import CardContent from "$lib/components/ui/card/card-content.svelte";
	import CardDescription from "$lib/components/ui/card/card-description.svelte";
	import CardHeader from "$lib/components/ui/card/card-header.svelte";
	import CardTitle from "$lib/components/ui/card/card-title.svelte";
	import Card from "$lib/components/ui/card/card.svelte";
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select";
	import { config, type AppConfig } from "$lib/config/config-store";
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
		UnderlineIcon,
		UnfoldHorizontalIcon,
	} from "@lucide/svelte";

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
						Customize the fonts used throughout the application.
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
					<CardTitle>Editor Toolbar</CardTitle>
					<CardDescription>
						Customize the items in the editor toolbar.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex gap-1 items-center">
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
					<div class="flex items-center gap-3">
						<Label for="autosave-enabled">Notes</Label>
						<Select.Root
							type="single"
							bind:value={$config.noteOpenPosition}
						>
							<Select.Trigger
								class="w-[180px]"
								id="note-open-position"
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
					<div class="flex items-center gap-3">
						<Label for="autosave-enabled">Chapters</Label>
						<Select.Root
							type="single"
							bind:value={$config.chapterOpenPosition}
						>
							<Select.Trigger
								class="w-[180px]"
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
		</div>
	{/if}
	<div class="text-sm text-muted-foreground mt-2 cursor-default">
		v{__APP_VERSION__}
	</div>
</div>
