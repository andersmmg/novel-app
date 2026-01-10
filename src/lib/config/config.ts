import { appConfigDir } from '@tauri-apps/api/path'
import {
	BaseDirectory,
	exists,
	mkdir,
	readTextFile,
	writeTextFile,
} from '@tauri-apps/plugin-fs'
import { info, warn } from '@tauri-apps/plugin-log'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

export function deepMerge<T extends Record<string, any>>(
	target: T,
	source: Partial<T>,
): T {
	const result = { ...target }

	for (const key in source) {
		if (source[key] !== undefined) {
			if (
				typeof source[key] === 'object'
				&& source[key] !== null
				&& !Array.isArray(source[key])
				&& typeof result[key] === 'object'
				&& result[key] !== null
				&& !Array.isArray(result[key])
			) {
				result[key] = deepMerge(result[key], source[key] as any)
			}
			else {
				result[key] = source[key] as any
			}
		}
	}

	return result
}

export interface AppConfig {
	edited: Date
	chapterOpenPosition: 'start' | 'end'
	noteOpenPosition: 'start' | 'end'
	autosave: {
		enabled: boolean
		intervalMinutes: number
	}
	theme: string
	themeMode: 'dark' | 'light' | 'system'
	fonts: {
		ui: string
		editor: string
	}
	spellcheck: {
		enabled: boolean
		language: string
		customWords: string[]
	}
	editor: {
		expandWidth: boolean
		fontSize: number
		toolbarItems: {
			heading1: boolean
			heading2: boolean
			paragraph: boolean
			bold: boolean
			italic: boolean
			underline: boolean
			list: boolean
			numberedList: boolean
			taskList: boolean
			top: boolean
			bottom: boolean
			find: boolean
			fontSize: boolean
			expandWidth: boolean
		}
		hemingway: {
			enabled: boolean
			allowAdditions: boolean
			spellcheck: boolean
		}
	}
	stats: {
		minWordsPerParagraph: number
		display: {
			chapters: boolean
			paragraphs: boolean
			words: boolean
			quotes: boolean
			notes: boolean
		}
	}
}

const CONFIG_PATH = 'config.yml'
const DEFAULT_CONFIG: AppConfig = {
	edited: new Date(),
	chapterOpenPosition: 'end',
	noteOpenPosition: 'start',
	autosave: {
		enabled: true,
		intervalMinutes: 5,
	},
	theme: 'vintage-paper',
	themeMode: 'system',
	fonts: {
		ui: 'system-ui',
		editor: 'courier-prime',
	},
	spellcheck: {
		enabled: true,
		language: 'en_US',
		customWords: [],
	},
	editor: {
		expandWidth: false,
		fontSize: 16,
		toolbarItems: {
			heading1: true,
			heading2: true,
			paragraph: true,
			bold: true,
			italic: true,
			underline: true,
			list: true,
			numberedList: true,
			taskList: true,
			top: true,
			bottom: true,
			find: true,
			fontSize: true,
			expandWidth: true,
		},
		hemingway: {
			enabled: false,
			allowAdditions: true,
			spellcheck: false,
		},
	},
	stats: {
		minWordsPerParagraph: 1,
		display: {
			chapters: true,
			paragraphs: true,
			words: true,
			quotes: true,
			notes: false,
		},
	},
}

export async function loadConfig(): Promise<AppConfig> {
	try {
		await ensureConfigDir()
		let loadedConfig: AppConfig = { ...DEFAULT_CONFIG }

		const configContent = await readTextFile(CONFIG_PATH, {
			baseDir: BaseDirectory.AppConfig,
		})
		const configData = parseYaml(configContent)

		info(`Loaded raw config from file: ${JSON.stringify(configData)}`)

		if (typeof configData === 'object' && configData !== null) {
			if (configData.edited && typeof configData.edited === 'string') {
				configData.edited = new Date(configData.edited)
			}

			loadedConfig = deepMerge(DEFAULT_CONFIG, configData)
		}
		else {
			warn(
				`Parsed config data is not an object or is null, skipping merge: ${JSON.stringify(configData)}`,
			)
		}

		info(`Final merged config: ${JSON.stringify(loadedConfig)}`)

		return loadedConfig
	}
	catch (error) {
		warn(`Failed to load config, using defaults: ${error}`)
		return { ...DEFAULT_CONFIG }
	}
}

export async function saveConfig(config: AppConfig): Promise<void> {
	try {
		await ensureConfigDir()

		const configData: any = {}
		for (const [key, value] of Object.entries(config)) {
			if (value instanceof Date) {
				configData[key] = value.toISOString()
			}
			else {
				configData[key] = value
			}
		}

		await writeTextFile(CONFIG_PATH, stringifyYaml(configData), {
			baseDir: BaseDirectory.AppConfig,
		})

		info(`Saved config to file: ${CONFIG_PATH}`)
	}
	catch (error) {
		warn(`Failed to save config: ${error}`)
		throw error
	}
}

export async function getConfigDir(): Promise<string> {
	return await appConfigDir()
}

export async function ensureConfigDir(): Promise<void> {
	try {
		const configDirExists = await exists('', {
			baseDir: BaseDirectory.AppConfig,
		})
		if (!configDirExists) {
			await mkdir('', { baseDir: BaseDirectory.AppConfig })
		}
	}
	catch (error) {
		console.error('Failed to ensure config directory:', error)
		throw error
	}
}

export async function checkConfigExists(): Promise<boolean> {
	try {
		return await exists(CONFIG_PATH, { baseDir: BaseDirectory.AppConfig })
	}
	catch (error) {
		console.error('Error checking if config exists:', error)
		return false
	}
}

export async function updateLastOpened(): Promise<void> {
	const config = await loadConfig()
	config.edited = new Date()
	await saveConfig(config)
}
