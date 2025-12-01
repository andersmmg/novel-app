<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import { saveConfig } from "$lib/config";
	import {
		appState,
		loadAvailableStories,
		saveCurrentStory,
	} from "$lib/app-state.svelte";
	import { Window } from "@tauri-apps/api/window";
	import { onMount } from "svelte";

	let { children } = $props();
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import AppMenubar from "$lib/components/app-menubar.svelte";
	import { info, error } from "@tauri-apps/plugin-log";
	import { Toaster } from "$lib/components/ui/sonner";

	let sidebarOpen = $state(true);

	onMount(async () => {
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
	<Sidebar.Inset class="w-full overflow-hidden max-h-full border-r border-b">
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
