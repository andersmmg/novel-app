<script lang="ts">
	import { onMount } from "svelte";
	import { configStore, type AppConfig } from "$lib/config/config-store";
	import { updateConfig, saveConfig } from "$lib/config/config-store.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
	import Card from "$lib/components/ui/card/card.svelte";
	import CardContent from "$lib/components/ui/card/card-content.svelte";
	import CardDescription from "$lib/components/ui/card/card-description.svelte";
	import CardHeader from "$lib/components/ui/card/card-header.svelte";
	import CardTitle from "$lib/components/ui/card/card-title.svelte";
	import { startAutosave } from "$lib/autosave";
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	import { Label } from "$lib/components/ui/label";
	import { toast } from "svelte-sonner";
	import { SettingsIcon } from "@lucide/svelte";

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

			<div class="flex justify-end">
				<Button onclick={handleSave} disabled={isSaving}>
					{isSaving ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</div>
	{/if}
</div>
