import type { StoryFile, StoryFolder, StoryMetadata } from "./types";

export class Story {
	metadata: StoryMetadata;
	chapters: StoryFile[];
	characters: StoryFile[];
	notes: StoryFolder[];
	rootNotes: StoryFile[];

	constructor(metadata: StoryMetadata = {}) {
		this.metadata = metadata;
		this.chapters = [];
		this.characters = [];
		this.notes = [];
		this.rootNotes = [];
	}

	addChapter(file: StoryFile): void {
		this.chapters.push(file);
	}

	addCharacter(file: StoryFile): void {
		this.characters.push(file);
	}

	addRootNote(file: StoryFile): void {
		this.rootNotes.push(file);
	}

	addNoteFolder(folder: StoryFolder): void {
		this.notes.push(folder);
	}

	getChapterByPath(path: string): StoryFile | undefined {
		return this.chapters.find((chapter) => chapter.path === path);
	}

	getCharacterByPath(path: string): StoryFile | undefined {
		return this.characters.find((character) => character.path === path);
	}

	findNoteByPath(path: string): StoryFile | StoryFolder | undefined {
		const rootNote = this.rootNotes.find((note) => note.path === path);
		if (rootNote) return rootNote;

		function searchInFolder(
			folder: StoryFolder,
		): StoryFile | StoryFolder | undefined {
			if (folder.path === path) return folder;
			for (const child of folder.children) {
				if ("children" in child) {
					const result = searchInFolder(child);
					if (result) return result;
				} else if (child.path === path) {
					return child;
				}
			}
			return undefined;
		}

		for (const folder of this.notes) {
			const result = searchInFolder(folder);
			if (result) return result;
		}
		return undefined;
	}

	private updateFileInArray(
		array: StoryFile[],
		path: string,
		updates: Partial<StoryFile>,
	): boolean {
		const index = array.findIndex((file) => file.path === path);
		if (index !== -1) {
			array[index] = { ...array[index], ...updates };
			return true;
		}
		return false;
	}

	updateChapter(path: string, updates: Partial<StoryFile>): boolean {
		return this.updateFileInArray(this.chapters, path, updates);
	}

	updateCharacter(path: string, updates: Partial<StoryFile>): boolean {
		return this.updateFileInArray(this.characters, path, updates);
	}

	updateNote(path: string, updates: Partial<StoryFile>): boolean {
		// Check root notes first
		const rootNoteIndex = this.rootNotes.findIndex((note) => note.path === path);
		if (rootNoteIndex !== -1) {
			this.rootNotes[rootNoteIndex] = { ...this.rootNotes[rootNoteIndex], ...updates };
			return true;
		}

		// Search in note folders
		function updateInFolder(folder: StoryFolder): boolean {
			if (folder.path === path && 'content' in folder) {
				// This shouldn't happen as folders don't have content, but just in case
				return false;
			}

			for (let i = 0; i < folder.children.length; i++) {
				const child = folder.children[i];
				if ('children' in child) {
					if (updateInFolder(child)) return true;
				} else if (child.path === path) {
					folder.children[i] = { ...child, ...updates };
					return true;
				}
			}
			return false;
		}

		for (const folder of this.notes) {
			if (updateInFolder(folder)) return true;
		}

		return false;
	}

	updateMetadata(updates: Partial<StoryMetadata>): void {
		this.metadata = { ...this.metadata, ...updates };
	}

	private deleteFileFromArray(array: StoryFile[], path: string): boolean {
		const index = array.findIndex((file) => file.path === path);
		if (index !== -1) {
			array.splice(index, 1);
			return true;
		}
		return false;
	}

	deleteChapter(path: string): boolean {
		return this.deleteFileFromArray(this.chapters, path);
	}

	deleteCharacter(path: string): boolean {
		return this.deleteFileFromArray(this.characters, path);
	}

	deleteNote(path: string): boolean {
		const rootIndex = this.rootNotes.findIndex(
			(note) => note.path === path,
		);
		if (rootIndex !== -1) {
			this.rootNotes.splice(rootIndex, 1);
			return true;
		}

		function deleteFromFolder(folder: StoryFolder): boolean {
			const index = folder.children.findIndex((child) => {
				if ("children" in child) {
					return child.path === path || deleteFromFolder(child);
				}
				return child.path === path;
			});

			if (index !== -1) {
				folder.children.splice(index, 1);
				return true;
			}
			return false;
		}

		for (const folder of this.notes) {
			if (folder.path === path) {
				const folderIndex = this.notes.indexOf(folder);
				this.notes.splice(folderIndex, 1);
				return true;
			}
			if (deleteFromFolder(folder)) {
				return true;
			}
		}
		return false;
	}

	getAllFiles(): StoryFile[] {
		const allFiles: StoryFile[] = [
			...this.chapters,
			...this.characters,
			...this.rootNotes,
		];

		function collectFilesFromFolder(folder: StoryFolder) {
			for (const child of folder.children) {
				if ("children" in child) {
					collectFilesFromFolder(child);
				} else {
					allFiles.push(child);
				}
			}
		}

		for (const folder of this.notes) {
			collectFilesFromFolder(folder);
		}
		return allFiles;
	}
}
