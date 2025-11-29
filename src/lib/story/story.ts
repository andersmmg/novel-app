export interface StoryFile {
	name: string;
	path: string;
	content: string;
	title?: string;
	created?: Date;
	edited?: Date;
	metadata?: any;
}

export interface StoryFolder {
	name: string;
	path: string;
	title?: string;
	metadata?: any;
	children: (StoryFile | StoryFolder)[];
}

export interface StoryMetadata {
	title?: string;
	author?: string;
	genre?: string;
	description?: string;
	created?: Date;
	edited?: Date;
	[key: string]: any;
}

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

	updateChapter(path: string, updates: Partial<StoryFile>): boolean {
		const index = this.chapters.findIndex(
			(chapter) => chapter.path === path,
		);
		if (index !== -1) {
			this.chapters[index] = { ...this.chapters[index], ...updates };
			return true;
		}
		return false;
	}

	updateCharacter(path: string, updates: Partial<StoryFile>): boolean {
		const index = this.characters.findIndex(
			(character) => character.path === path,
		);
		if (index !== -1) {
			this.characters[index] = { ...this.characters[index], ...updates };
			return true;
		}
		return false;
	}

	updateMetadata(updates: Partial<StoryMetadata>): void {
		this.metadata = { ...this.metadata, ...updates };
	}

	deleteChapter(path: string): boolean {
		const index = this.chapters.findIndex(
			(chapter) => chapter.path === path,
		);
		if (index !== -1) {
			this.chapters.splice(index, 1);
			return true;
		}
		return false;
	}

	deleteCharacter(path: string): boolean {
		const index = this.characters.findIndex(
			(character) => character.path === path,
		);
		if (index !== -1) {
			this.characters.splice(index, 1);
			return true;
		}
		return false;
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
