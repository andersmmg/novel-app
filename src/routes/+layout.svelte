<script lang="ts">
	import {
		appState,
		loadAvailableStories,
		saveCurrentStory,
	} from "$lib/app-state.svelte";
	import AppMenubar from "$lib/components/app-menubar.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import { Toaster } from "$lib/components/ui/sonner";
	import { saveConfig, config } from "$lib/config";
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

	config.subscribe((value) => {
		if (value?.themeMode) {
			setMode(value.themeMode);
		}
	});

	onMount(async () => {
		// Load theme and fonts from config
		try {
			const config = await configStore.getConfig();
			await loadTheme(config.theme || "default");
			await applyFontSettings();
		} catch (themeError) {
			error("Failed to load theme: {themeError}");
			// Fallback to default theme
			await loadTheme("default");
			await applyFontSettings();
		}

		// Initialize story management after config is loaded
		try {
			await loadAvailableStories();
			info("Story management initialized successfully");
			info(`${appState.availableStories.length} stories available`);
		} catch (_error) {
			error("Failed to initialize story management: {_error}");
		}

		// Get the main window
		const appWindow = new Window("main");

		// Listen for close request
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
			// Destroy the window to close
			await appWindow.destroy();
		});
	});
</script>

<ModeWatcher />
<Toaster />
<AppMenubar bind:sidebarOpen />

<Sidebar.Provider
	open={sidebarOpen}
	class="min-h-[calc(100svh-2.25rem)] max-h-[calc(100svh-2.25rem)]"
>
	<AppSidebar />
	<Sidebar.Inset class="w-full overflow-y-auto max-h-full border-t-0 border-l-0 border-b border-r">
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
