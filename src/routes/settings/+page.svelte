<script lang="ts">
	import { startAutosave } from "$lib/autosave";
	import FontSelector from "$lib/components/font-selector.svelte";
	import ThemeSelector from "$lib/components/theme-selector.svelte";
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
	import { SettingsIcon } from "@lucide/svelte";

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
	<div class="text-sm text-muted-foreground mt-2 cursor-default"
		>v{__APP_VERSION__}</div
	>
</div>
