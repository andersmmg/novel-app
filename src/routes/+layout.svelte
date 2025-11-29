<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import { saveConfig } from "$lib/config-store.svelte";
	import { Window } from "@tauri-apps/api/window";
	import { onMount } from "svelte";

	let { children } = $props();
	import "../app.css";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import AppMenubar from "$lib/components/app-menubar.svelte";

	let sidebarOpen = $state(true);

	onMount(async () => {
		// Get the main window
		const appWindow = new Window("main");

		// Listen for close request
		await appWindow.onCloseRequested(async () => {
			try {
				await saveConfig();
			} catch (error) {
				console.error("Failed to save config before closing:", error);
			}
			// Destroy the window to close
			await appWindow.destroy();
		});
	});
</script>

<ModeWatcher />
<AppMenubar bind:sidebarOpen />

<Sidebar.Provider
	open={sidebarOpen}
	class="min-h-[calc(100svh-2.25rem)] max-h-[calc(100svh-2.25rem)]"
>
	<AppSidebar />
	<Sidebar.Inset class="w-full overflow-y-auto max-h-full border-r border-b">
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
