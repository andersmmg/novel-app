<script lang="ts">
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
	import { configStore, type AppConfig } from "$lib/config/config-store";
	import { saveConfig, updateConfig } from "$lib/config/config-store.svelte";
	import { SettingsIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";

	let config: AppConfig | null = $state(null);
	let isLoading = $state(true);
	let isSaving = $state(false);

	onMount(async () => {
		config = await configStore.getConfig();
		isLoading = false;
	});

	async function handleSave() {
		if (!config) return;

		isSaving = true;
		try {
			await updateConfig(config);
			await saveConfig();
			toast.success("Settings saved!");
		} catch (error) {
			console.error("Failed to save config:", error);
		} finally {
			isSaving = false;
		}
	}

	function handleIntervalChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (config && target.value) {
			const value = parseInt(target.value);
			if (!isNaN(value) && value > 0) {
				config.autosave.intervalMinutes = value;
			}
		}
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="text-2xl mb-4 flex items-center gap-2">
		<SettingsIcon />
		Settings
	</h1>

	{#if isLoading}
		<div class="flex items-center justify-center p-8">
			<div class="text-muted-foreground">Loading settings...</div>
		</div>
	{:else if config}
		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Autosave</CardTitle>
					<CardDescription>
						Configure automatic saving of your story to prevent data
						loss
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center gap-3">
						<Checkbox
							id="autosave-enabled"
							bind:checked={config.autosave.enabled}
						/>
						<Label for="autosave-enabled">Enable autosave</Label>
					</div>

					{#if config.autosave.enabled}
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
								value={config.autosave.intervalMinutes}
								onchange={handleIntervalChange}
								placeholder="Enter minutes between autosaves"
							/>
							<p class="text-xs text-muted-foreground">
								Story will be automatically saved every {config
									.autosave.intervalMinutes} minute{config
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
							bind:value={config.noteOpenPosition}
						>
							<Select.Trigger
								class="w-[180px]"
								id="note-open-position"
								><span
									>{config.noteOpenPosition == "start"
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
							bind:value={config.chapterOpenPosition}
						>
							<Select.Trigger
								class="w-[180px]"
								id="chapter-open-position"
								><span
									>{config.chapterOpenPosition == "start"
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

			<div class="flex justify-end">
				<Button onclick={handleSave} disabled={isSaving}>
					{isSaving ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	{/if}
</div>
