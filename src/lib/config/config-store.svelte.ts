import { configStore, type AppConfig } from "./config-store";
import { writable, type Writable } from "svelte/store";

export const config: Writable<AppConfig | null> = writable(null);

configStore.getConfig().then((initialConfig) => {
	config.set(initialConfig);
});

configStore.subscribe((newConfig) => {
	config.set(newConfig);
});

export async function updateConfig(updates: Partial<AppConfig>): Promise<void> {
	await configStore.updateConfig(updates);
}

export async function saveConfig(): Promise<void> {
	await configStore.saveConfig();
}
