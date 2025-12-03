import type { Story, StoryFile, StoryListItem } from "$lib/story";
import { readStoryFile, readStoryFileMetadata } from "$lib/story/story-reader";
import { saveStory } from "$lib/story/story-writer";
import {
	BaseDirectory,
	exists,
	mkdir,
	readDir,
	readFile,
	writeFile,
} from "@tauri-apps/plugin-fs";
import { info, error as logError } from "@tauri-apps/plugin-log";
import { toast } from "svelte-sonner";

const STORIES_DIR = "stories";

interface AppState {
	selectedStory: Story | null;
	availableStories: StoryListItem[];
	currentEditedFile: StoryFile | null;
	isDirty: boolean;
	lastSavedAt: Date | null;
}

const appState = $state<AppState>({
	selectedStory: null,
	availableStories: [],
	currentEditedFile: null,
	isDirty: false,
	lastSavedAt: null,
});

export async function ensureStoriesDir(): Promise<boolean> {
	try {
		if (!(await exists(STORIES_DIR, { baseDir: BaseDirectory.AppData }))) {
			console.log("Creating stories directory in AppData");
			await mkdir(STORIES_DIR, { baseDir: BaseDirectory.AppData });
		}
		return true;
	} catch (error) {
		console.error("Failed to ensure stories directory exists:", error);
		return false;
	}
}

export async function loadAvailableStories() {
	console.log("AppState: Loading available stories...");
	appState.availableStories = [];

	try {
		// Ensure the stories directory exists
		if (!(await ensureStoriesDir())) {
			return;
		}

		const entries = await readDir(STORIES_DIR, {
			baseDir: BaseDirectory.AppData,
		});
		const storyFiles: StoryListItem[] = [];

		for (const entry of entries) {
			// Only process .story files (not directories for now)
			if (entry.name.endsWith(".story") && !entry.isDirectory) {
				try {
					const fileData = await readFileAsFile(entry.name);

					if (fileData) {
						const metadata = await readStoryFileMetadata(fileData);
						if (metadata) {
							const storyItem: StoryListItem = {
								title:
									metadata.title ||
									entry.name.replace(".story", ""),
								author: metadata.author,
								genre: metadata.genre,
								description: metadata.description,
								created:
									metadata.created instanceof Date
										? metadata.created
										: new Date(
												metadata.created || Date.now(),
											),
								edited:
									metadata.edited instanceof Date
										? metadata.edited
										: new Date(
												metadata.edited || Date.now(),
											),
								path: `${STORIES_DIR}/${entry.name}`,
								id: entry.name,
								isDirectory: false,
							};
							storyFiles.push(storyItem);
						}
					}
				} catch (e) {
					logError(
						`Failed to load story metadata for ${entry.name}: ${e}`,
					);
				}
			}
		}

		// Sort stories by edited date (most recent first)
		storyFiles.sort((a, b) => {
			const aTime =
				a.edited instanceof Date
					? a.edited.getTime()
					: new Date(a.edited).getTime();
			const bTime =
				b.edited instanceof Date
					? b.edited.getTime()
					: new Date(b.edited).getTime();
			return bTime - aTime;
		});

		appState.availableStories = storyFiles;
		info(`AppState: Loaded ${storyFiles.length} stories`);
	} catch (e) {
		logError(`Failed to load available stories: ${e}`);
	}
}

async function readFileAsFile(fileName: string): Promise<File | null> {
	try {
		const contents = await readFile(`${STORIES_DIR}/${fileName}`, {
			baseDir: BaseDirectory.AppData,
		});

		// Convert Uint8Array to File
		const blob = new Blob([contents]);
		return new File([blob], fileName, { type: "application/zip" });
	} catch (error) {
		console.error(`Failed to read file ${fileName}:`, error);
		return null;
	}
}

export async function selectStoryById(storyId: string) {
	info(`AppState: Selecting story by ID: ${storyId}`);
	const storyPath = `${STORIES_DIR}/${storyId}`;
	// Check if story is already loaded
	if (appState.selectedStory && appState.selectedStory.path === storyPath) {
		info(`Story ${storyId} is already loaded`);
		return;
	}
	// If there is a story loaded, save it before loading a new one
	if (appState.selectedStory) {
		await saveCurrentStory();
	}
	// Load story data as Story class
	const storyFile = await readFileAsFile(storyId);
	if (!storyFile) {
		logError(`Failed to load story file ${storyId}`);
		return;
	}
	const story = await readStoryFile(storyFile, storyPath);
	appState.selectedStory = story;
	appState.lastSavedAt = new Date();
	appState.isDirty = false;
}

export function setCurrentEditedFile(file: StoryFile | null) {
	appState.currentEditedFile = file;
}

export async function saveCurrentStory(): Promise<boolean> {
	if (!appState.selectedStory) {
		return false;
	}

	try {
		info(`Saving story: ${appState.selectedStory.metadata.title}`);

		const storyBlob = await saveStory(appState.selectedStory);
		const arrayBuffer = await storyBlob.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		const storyPath = appState.selectedStory.path;
		if (!storyPath) {
			logError("Story has no path, cannot save");
			return false;
		}

		await writeFile(storyPath, uint8Array, {
			baseDir: BaseDirectory.AppData,
		});

		info(`Story saved successfully to: ${storyPath}`);
		toast.success("Story saved!");
		appState.lastSavedAt = new Date();
		appState.isDirty = false;
		return true;
	} catch (error) {
		logError(
			`Failed to save story: ${error instanceof Error ? error.message : String(error)}`,
		);
		return false;
	}
}

export function clearSelection() {
	appState.selectedStory = null;
	appState.currentEditedFile = null;
}

export { appState, type AppState };
