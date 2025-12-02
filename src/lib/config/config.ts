import { appConfigDir } from "@tauri-apps/api/path";
import {
	BaseDirectory,
	exists,
	mkdir,
	readTextFile,
	writeTextFile,
} from "@tauri-apps/plugin-fs";
import { info, warn } from "@tauri-apps/plugin-log";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export interface AppConfig {
	edited: Date;
	test_name: string;
	autosave: {
		enabled: boolean;
		intervalMinutes: number;
	};
}

const CONFIG_PATH = "config.yml";
const DEFAULT_CONFIG: AppConfig = {
	edited: new Date(),
	test_name: "",
	autosave: {
		enabled: true,
		intervalMinutes: 5,
	},
};

export async function loadConfig(): Promise<AppConfig> {
	try {
		await ensureConfigDir();
		let loadedConfig: AppConfig = { ...DEFAULT_CONFIG };

		const configContent = await readTextFile(CONFIG_PATH, {
			baseDir: BaseDirectory.AppConfig,
		});
		const configData = parseYaml(configContent);

		info(`Loaded raw config from file: ${JSON.stringify(configData)}`);

		if (typeof configData === "object" && configData !== null) {
			if (configData.edited && typeof configData.edited === "string") {
				configData.edited = new Date(configData.edited);
			}

			loadedConfig = { ...DEFAULT_CONFIG, ...configData };
		} else {
			warn(
				`Parsed config data is not an object or is null, skipping merge: ${JSON.stringify(configData)}`,
			);
		}

		info(`Final merged config: ${JSON.stringify(loadedConfig)}`);

		return loadedConfig;
	} catch (error) {
		warn(`Failed to load config, using defaults: ${error}`);
		return { ...DEFAULT_CONFIG };
	}
}

export async function saveConfig(config: AppConfig): Promise<void> {
	try {
		await ensureConfigDir();

		const configData: any = {};
		for (const [key, value] of Object.entries(config)) {
			if (value instanceof Date) {
				configData[key] = value.toISOString();
			} else {
				configData[key] = value;
			}
		}

		await writeTextFile(CONFIG_PATH, stringifyYaml(configData), {
			baseDir: BaseDirectory.AppConfig,
		});

		info(`Saved config to file: ${CONFIG_PATH}`);
	} catch (error) {
		warn(`Failed to save config: ${error}`);
		throw error;
	}
}

export async function getConfigDir(): Promise<string> {
	return await appConfigDir();
}

export async function ensureConfigDir(): Promise<void> {
	try {
		const configDirExists = await exists("", {
			baseDir: BaseDirectory.AppConfig,
		});
		if (!configDirExists) {
			await mkdir("", { baseDir: BaseDirectory.AppConfig });
		}
	} catch (error) {
		console.error("Failed to ensure config directory:", error);
		throw error;
	}
}

export async function checkConfigExists(): Promise<boolean> {
	try {
		return await exists(CONFIG_PATH, { baseDir: BaseDirectory.AppConfig });
	} catch (error) {
		console.error("Error checking if config exists:", error);
		return false;
	}
}

export async function updateLastOpened(): Promise<void> {
	const config = await loadConfig();
	config.edited = new Date();
	await saveConfig(config);
}
