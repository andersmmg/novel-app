import {
	deepMerge,
	loadConfig,
	saveConfig as saveConfigFile,
	type AppConfig,
} from "./config";

class ConfigStore {
	private config: AppConfig | null = null;
	private promise: Promise<AppConfig> | null = null;
	private listeners: Set<(config: AppConfig) => void> = new Set();
	private saveTimeout: ReturnType<typeof setTimeout> | null = null;

	async getConfig(): Promise<AppConfig> {
		if (this.config) {
			return this.config;
		}

		if (this.promise) {
			return this.promise;
		}

		this.promise = this.loadConfigInternal();
		return this.promise;
	}

	private async loadConfigInternal(): Promise<AppConfig> {
		try {
			this.config = await loadConfig();
			this.notifyListeners();
			return this.config;
		} finally {
			this.promise = null;
		}
	}

	async updateConfig(updates: Partial<AppConfig>): Promise<void> {
		const config = await this.getConfig();
		this.config = deepMerge(config, updates);
		this.notifyListeners();
		this.debouncedSave();
	}

	private debouncedSave() {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
		this.saveTimeout = setTimeout(async () => {
			if (this.config) {
				await saveConfigFile(this.config);
			}
		}, 500);
	}

	async saveConfig(): Promise<void> {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}
		if (!this.config) {
			throw new Error("No config loaded to save");
		}
		await saveConfigFile(this.config);
	}

	subscribe(listener: (config: AppConfig) => void): () => void {
		this.listeners.add(listener);

		if (this.config) {
			listener(this.config);
		}

		return () => {
			this.listeners.delete(listener);
		};
	}

	private notifyListeners(): void {
		if (this.config) {
			this.listeners.forEach((listener) => listener(this.config!));
		}
	}

	async ensureLoaded(): Promise<void> {
		await this.getConfig();
	}
}

export const configStore = new ConfigStore();

export async function updateConfig(updates: Partial<AppConfig>): Promise<void> {
	await configStore.updateConfig(updates);
}

export async function saveConfig(): Promise<void> {
	await configStore.saveConfig();
}

export type { AppConfig };
