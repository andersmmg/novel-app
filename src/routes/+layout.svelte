<script lang="ts">
	import {
		appState,
		loadAvailableStories,
		saveCurrentStory,
	} from "$lib/app-state.svelte";
	import AppLayout from "$lib/components/app-layout.svelte";
	import { ConfirmDeleteDialog } from "$lib/components/confirm-delete";
	import { InputPromptDialog } from "$lib/components/input-prompt";
	import { Toaster } from "$lib/components/ui/sonner";
	import type { AppConfig } from "$lib/config";
	import { config, saveConfig } from "$lib/config";
	import { configStore } from "$lib/config/config-store";
	import { applyFontSettings } from "$lib/fonts/font-settings";
	import { loadTheme } from "$lib/themes/theme-loader";
	import { Window } from "@tauri-apps/api/window";
	import { error, info } from "@tauri-apps/plugin-log";
	import { ModeWatcher, setMode } from "mode-watcher";
	import { onMount } from "svelte";
	import "../app.css";

	let { children } = $props();

	let sidebarOpen = $state(true);

	config.subscribe((value: AppConfig | null) => {
		if (value?.themeMode) {
			setMode(value.themeMode);
		}
	});

	onMount(async () => {
		try {
			const config = await configStore.getConfig();
			await loadTheme(config.theme || "default");
			await applyFontSettings();
		} catch (themeError) {
			error("Failed to load theme: {themeError}");

			await loadTheme("default");
			await applyFontSettings();
		}

		try {
			await loadAvailableStories();
			info("Story management initialized successfully");
			info(`${appState.availableStories.length} stories available`);
		} catch (_error) {
			error("Failed to initialize story management: {_error}");
		}

		const appWindow = new Window("main");

		await appWindow.onCloseRequested(async () => {
			try {
				await saveConfig();
			} catch (error) {
				console.error("Failed to save config before closing:", error);
			}
			try {
				await saveCurrentStory();
			} catch (error) {
				console.error("Failed to save story before closing:", error);
			}

			await appWindow.destroy();
		});
	});
</script>

<ModeWatcher />
<Toaster />
<ConfirmDeleteDialog />
<InputPromptDialog />

<AppLayout>
	{@render children?.()}
</AppLayout>
