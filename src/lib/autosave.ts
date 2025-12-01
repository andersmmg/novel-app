import { appState, saveCurrentStory } from "$lib/app-state.svelte";
import { configStore } from "$lib/config/config-store";
import { info, warn } from "@tauri-apps/plugin-log";

let autosaveInterval: ReturnType<typeof setInterval> | null = null;

export async function startAutosave(): Promise<void> {
	const config = await configStore.getConfig();

	if (!config.autosave.enabled) {
		stopAutosave();
		return;
	}

	// Clear any existing interval
	stopAutosave();

	const intervalMs = config.autosave.intervalMinutes * 60 * 1000;

	info(
		`Starting autosave with interval: ${config.autosave.intervalMinutes} minutes`,
	);

	autosaveInterval = setInterval(async () => {
		if (appState.selectedStory) {
			try {
				const success = await saveCurrentStory();
				if (success) {
					info(
						`Autosave completed for story: ${appState.selectedStory?.metadata.title}`,
					);
				} else {
					warn("Autosave failed");
				}
			} catch (error) {
				warn(
					`Autosave error: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
	}, intervalMs);
}

export function stopAutosave(): void {
	if (autosaveInterval) {
		clearInterval(autosaveInterval);
		autosaveInterval = null;
		info("Autosave stopped");
	}
}

export async function updateAutosaveSettings(): Promise<void> {
	await startAutosave();
}

// Initialize autosave when the module loads
configStore.getConfig().then(() => {
	startAutosave();
});

// Subscribe to config changes to update autosave
configStore.subscribe(() => {
	startAutosave();
});
