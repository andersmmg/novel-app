import type { StoryListItem, Story, StoryFile } from "$lib/story";
import { readStoryFile, readStoryFileMetadata } from "$lib/story/story-reader";
import {
	readDir,
	exists,
	readFile,
	mkdir,
	BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { error, info } from "@tauri-apps/plugin-log";

const STORIES_DIR = "stories";

interface AppState {
	selectedStory: Story | null;
	availableStories: StoryListItem[];
	currentEditedFile: StoryFile | null;
}

const appState = $state<AppState>({
	selectedStory: null,
	availableStories: [],
	currentEditedFile: null,
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
			// Only process .story files (not directories)
			if (entry.name.endsWith(".story") && !entry.isDirectory) {
				try {
					// Read the file as File object to use existing metadata reader
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
								created: metadata.created || new Date(),
								edited: metadata.edited || new Date(),
								path: `${STORIES_DIR}/${entry.name}`,
								id: entry.name,
								isDirectory: false,
							};
							storyFiles.push(storyItem);
						}
					}
				} catch (e) {
					error(
						`Failed to load story metadata for ${entry.name}: ${e}`,
					);
				}
			}
		}

		// Sort stories by edited date (most recent first)
		storyFiles.sort((a, b) => b.edited.getTime() - a.edited.getTime());

		appState.availableStories = storyFiles;
		info(`AppState: Loaded ${storyFiles.length} stories`);
	} catch (e) {
		error(`Failed to load available stories: ${e}`);
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
	// Load story data as Story class
	const storyFile = await readFileAsFile(storyId);
	if (!storyFile) {
		error(`Failed to load story file ${storyId}`);
		return;
	}
	const story = await readStoryFile(storyFile);
	appState.selectedStory = story;
}

export function setCurrentEditedFile(file: StoryFile | null) {
	appState.currentEditedFile = file;
}

export function clearSelection() {
	appState.selectedStory = null;
	appState.currentEditedFile = null;
}

export { appState, type AppState };
