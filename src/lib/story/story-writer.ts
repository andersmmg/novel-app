import JSZip from "jszip";
import { nanoid } from "nanoid";
import { stringify as stringifyYaml } from "yaml";
import { Story } from "./story-class";
import type { StoryFile, StoryFolder } from "./types";
import {
	addFrontmatterIfNeeded,
	convertDatesToStrings,
	sanitizeFilename,
} from "./utils";

export async function saveStory(story: Story): Promise<Blob> {
	const zip = new JSZip();

	if (story.metadata && Object.keys(story.metadata).length > 0) {
		const updatedMetadata = {
			...story.metadata,
			edited: new Date(),
		};
		zip.file(
			"story.yml",
			stringifyYaml(convertDatesToStrings(updatedMetadata)),
		);
	}

	for (const chapter of story.chapters) {
		zip.file(chapter.path, addFrontmatterIfNeeded(chapter));
	}

	saveNotesToZip(zip, story.notes, story.rootNotes);

	return await zip.generateAsync({ type: "blob" });
}

function saveNotesToZip(
	zip: JSZip,
	folders: StoryFolder[],
	rootFiles: StoryFile[],
): void {
	for (const file of rootFiles) {
		zip.file(file.path, addFrontmatterIfNeeded(file));
	}

	for (const folder of folders) {
		saveFolderToZip(zip, folder);
	}
}

function saveFolderToZip(zip: JSZip, folder: StoryFolder): void {
	if (folder.metadata && Object.keys(folder.metadata).length > 0) {
		zip.file(folder.path + "folder.yml", stringifyYaml(folder.metadata));
	}

	for (const child of folder.children) {
		if ("children" in child) {
			saveFolderToZip(zip, child);
		} else {
			zip.file(child.path, addFrontmatterIfNeeded(child));
		}
	}
}

export async function downloadStory(
	story: Story,
	filename?: string,
): Promise<void> {
	const blob = await saveStory(story);
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = filename || `${story.metadata.title || "story"}.story`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

export function createEmptyStory(title?: string): Story {
	const now = new Date();
	return new Story(
		{
			title: title || "Untitled Story",
			author: "",
			genre: "",
			description: "",
			created: now,
			edited: now,
		},
		`${nanoid()}.story`,
	);
}

export function createChapter(title: string, content: string = ""): StoryFile {
	const filename = sanitizeFilename(title) + ".md";
	const path = `chapters/${filename}`;
	const now = new Date();

	return {
		name: filename,
		path,
		content,
		title,
		created: now,
		edited: now,
		metadata: {
			title,
		},
	};
}

export function createNote(title: string, content: string = ""): StoryFile {
	const filename = sanitizeFilename(title) + ".md";
	const path = `notes/${filename}`;
	const now = new Date();

	return {
		name: filename,
		path,
		content,
		title,
		created: now,
		edited: now,
		metadata: {
			title,
		},
	};
}

export function createNoteFolder(title: string, name?: string): StoryFolder {
	const folderName = name || sanitizeFilename(title);
	const path = `notes/${folderName}/`;

	return {
		name: folderName,
		path,
		title,
		metadata: {
			title,
			created: new Date(),
		},
		children: [],
	};
}
