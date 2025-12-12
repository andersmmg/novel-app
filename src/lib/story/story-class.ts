import type { StoryFile, StoryFolder, StoryMetadata } from "./types";
import { countWords } from "./utils";

export class Story {
	metadata: StoryMetadata;
	chapters: StoryFile[];
	notes: StoryFolder[];
	rootNotes: StoryFile[];
	path: string;

	constructor(metadata: StoryMetadata = {}, path: string = "") {
		this.metadata = metadata;
		this.chapters = [];
		this.notes = [];
		this.rootNotes = [];
		this.path = path;
	}

	addChapter(file: StoryFile): void {
		if (file.order === undefined) {
			file.order = this.chapters.length;
		}
		this.chapters.push(file);
		this.sortChapters();
		this.updateWordCount();
	}

	private sortChapters(): void {
		this.chapters.sort((a, b) => {
			return (a.order ?? 0) - (b.order ?? 0);
		});
	}

	addRootNote(file: StoryFile): void {
		this.rootNotes.push(file);
		this.updateWordCount();
	}

	addNoteFolder(folder: StoryFolder): void {
		this.notes.push(folder);
		this.updateWordCount();
	}

	addNoteToFolder(folderPath: string, note: StoryFile): boolean {
		const folder = this.findNoteByPath(folderPath);
		if (folder && "children" in folder) {
			const filename = note.path.replace("notes/", "");
			note.path = folderPath + filename;
			note.name = filename;

			folder.children.push(note);
			this.updateWordCount();
			return true;
		}
		return false;
	}

	getChapterByPath(path: string): StoryFile | undefined {
		return this.chapters.find((chapter) => chapter.path === path);
	}

	getSortedChapters(): StoryFile[] {
		this.sortChapters();
		return [...this.chapters];
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
		const result = this.updateFileInArray(this.chapters, path, updates);
		if (result) {
			this.sortChapters();
			this.updateWordCount();
		}
		return result;
	}

	updateNote(path: string, updates: Partial<StoryFile>): boolean {
		// Check root notes first
		const rootNoteIndex = this.rootNotes.findIndex(
			(note) => note.path === path,
		);
		if (rootNoteIndex !== -1) {
			this.rootNotes[rootNoteIndex] = {
				...this.rootNotes[rootNoteIndex],
				...updates,
			};
			this.updateWordCount();
			return true;
		}

		// Search in note folders
		function updateInFolder(folder: StoryFolder): boolean {
			if (folder.path === path && "content" in folder) {
				// This shouldn't happen as folders don't have content, but just in case
				return false;
			}

			for (let i = 0; i < folder.children.length; i++) {
				const child = folder.children[i];
				if ("children" in child) {
					if (updateInFolder(child)) return true;
				} else if (child.path === path) {
					folder.children[i] = { ...child, ...updates };
					return true;
				}
			}
			return false;
		}

		for (const folder of this.notes) {
			if (updateInFolder(folder)) {
				this.updateWordCount();
				return true;
			}
		}
		return false;
	}

	updateFolder(path: string, updates: Partial<StoryFolder>): boolean {
		function updateInFolder(folder: StoryFolder): boolean {
			if (folder.path === path) {
				Object.assign(folder, updates);
				return true;
			}

			for (const child of folder.children) {
				if ("children" in child) {
					if (updateInFolder(child)) return true;
				}
			}
			return false;
		}

		for (const folder of this.notes) {
			if (updateInFolder(folder)) {
				this.updateWordCount();
				return true;
			}
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
		const result = this.deleteFileFromArray(this.chapters, path);
		if (result) {
			for (let i = 0; i < this.chapters.length; i++) {
				this.chapters[i].order = i;
				if (!this.chapters[i].metadata) {
					this.chapters[i].metadata = {};
				}
				this.chapters[i].metadata.order = i;
			}
			this.sortChapters();
			this.updateWordCount();
		}
		return result;
	}

	reorderChapters(newOrder: StoryFile[]): boolean {
		if (newOrder.length !== this.chapters.length) return false;
		
		for (let i = 0; i < newOrder.length; i++) {
			const chapter = this.chapters.find(c => c.path === newOrder[i].path);
			if (!chapter) return false;
			chapter.order = i;
			if (!chapter.metadata) {
				chapter.metadata = {};
			}
			chapter.metadata.order = i;
		}
		
		this.sortChapters();
		return true;
	}

	deleteNote(path: string): boolean {
		const rootIndex = this.rootNotes.findIndex(
			(note) => note.path === path,
		);
		if (rootIndex !== -1) {
			this.rootNotes.splice(rootIndex, 1);
			this.updateWordCount();
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
				this.updateWordCount();
				return true;
			}
			if (deleteFromFolder(folder)) {
				this.updateWordCount();
				return true;
			}
		}
		return false;
	}

	getAllFiles(): StoryFile[] {
		const allFiles: StoryFile[] = [...this.chapters, ...this.rootNotes];

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

	getWordCount(): number {
		let totalWords = 0;

		for (const chapter of this.chapters) {
			totalWords += countWords(chapter.content);
		}

		return totalWords;
	}

	getNotesWordCount(): number {
		let totalWords = 0;

		for (const note of this.rootNotes) {
			totalWords += countWords(note.content);
		}

		function countWordsInFolder(folder: StoryFolder): number {
			let folderWords = 0;
			for (const child of folder.children) {
				if ("children" in child) {
					folderWords += countWordsInFolder(child);
				} else {
					folderWords += countWords(child.content);
				}
			}
			return folderWords;
		}

		for (const folder of this.notes) {
			totalWords += countWordsInFolder(folder);
		}

		return totalWords;
	}

	updateWordCount(): void {
		this.metadata.wordCount = this.getWordCount();
	}
}
