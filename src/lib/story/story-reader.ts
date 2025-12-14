import JSZip from "jszip";
import { parse as parseYaml } from "yaml";
import { Story } from "./story-class";
import { type StoryFile, type StoryFolder, type StoryMetadata } from "./types";
import { extractTitle, parseMetadata } from "./utils";

export function parseStoryYaml(content: string): StoryMetadata {
	try {
		const parsed = parseYaml(content);

		return {
			title: parsed.title,
			author: parsed.author,
			genre: parsed.genre,
			description: parsed.description,
			created: parsed.created ? new Date(parsed.created) : undefined,
			edited: parsed.edited ? new Date(parsed.edited) : undefined,
			...parsed,
		};
	} catch (e) {
		console.error("Failed to parse story YAML:", e);
		throw new Error("Invalid YAML format in story.yml");
	}
}

function buildFolderStructure(
	files: (StoryFile & { isDirectory: boolean })[],
	basePath: string,
): { folders: StoryFolder[]; rootFiles: StoryFile[] } {
	const rootFolder: StoryFolder = {
		id: "",
		name: "",
		path: basePath,
		children: [],
	};

	const notesFiles = files.filter(
		(f) => f.path.startsWith(basePath) && !f.isDirectory,
	);

	for (const file of notesFiles) {
		const relativePath = file.path.substring(basePath.length);
		const parts = relativePath.split("/").filter((p) => p);

		if (parts.length <= 1) continue;

		let currentFolder = rootFolder;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];

			let nextFolder = currentFolder.children.find(
				(child) => "children" in child && child.name === part,
			) as StoryFolder;

			if (!nextFolder) {
				nextFolder = {
					id: part,
					name: part,
					path: basePath + parts.slice(0, i + 1).join("/") + "/",
					children: [],
				};
				currentFolder.children.push(nextFolder);
			}

			currentFolder = nextFolder;
		}
	}

	for (const file of notesFiles) {
		const relativePath = file.path.substring(basePath.length);
		const parts = relativePath.split("/").filter((p) => p);

		if (parts.length === 0) continue;

		if (parts.length === 1) {
			if (!parts[0].endsWith(".yml")) {
				rootFolder.children.push(file);
			}
			continue;
		}

		let currentFolder = rootFolder;
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];

			currentFolder = currentFolder.children.find(
				(child) => "children" in child && child.name === part,
			) as StoryFolder;
		}

		const lastPart = parts[parts.length - 1];

		if (lastPart.endsWith(".yml")) {
			if (currentFolder !== rootFolder) {
				currentFolder.title = extractTitle(file.content);
				currentFolder.metadata = parseMetadata(file.content);
			}
		} else {
			currentFolder.children.push(file);
		}
	}

	function sortChildren(folder: StoryFolder) {
		folder.children.sort((a, b) => {
			const aIsFolder = "children" in a;
			const bIsFolder = "children" in b;

			if (aIsFolder && !bIsFolder) return -1;
			if (!aIsFolder && bIsFolder) return 1;

			return a.name.localeCompare(b.name);
		});

		for (const child of folder.children) {
			if ("children" in child) {
				sortChildren(child);
			}
		}
	}

	sortChildren(rootFolder);

	// Separate root files from folders
	const rootFiles: StoryFile[] = [];
	const folders: StoryFolder[] = [];

	for (const child of rootFolder.children) {
		if ("children" in child) {
			folders.push(child);
		} else {
			rootFiles.push(child);
		}
	}

	return { folders, rootFiles };
}

export async function readStoryFileMetadata(
	file: File,
): Promise<StoryMetadata | null> {
	const zip = new JSZip();
	const zipContent = await zip.loadAsync(file);

	const storyYamlObject = zipContent.files["story.yml"];

	if (storyYamlObject && !storyYamlObject.dir) {
		const content = await storyYamlObject.async("text");
		try {
			return parseStoryYaml(content);
		} catch (e) {
			console.error("Failed to parse story.yml for metadata:", e);
		}
	}

	return null;
}

export async function readStoryFile(
	file: File,
	path: string = "",
): Promise<Story> {
	const zip = new JSZip();
	const zipContent = await zip.loadAsync(file);

	const files: (StoryFile & { isDirectory: boolean })[] = [];
	let storyMetadata: StoryMetadata | null = null;

	for (const [relativePath, zipObject] of Object.entries(zipContent.files)) {
		if (zipObject.dir) {
			files.push({
				name: relativePath.split("/").pop() || relativePath,
				path: relativePath,
				content: "",
				isDirectory: true,
			} as StoryFile & { isDirectory: boolean });
		} else {
			const content = await zipObject.async("text");
			const title = extractTitle(content);
			const metadata = parseMetadata(content);

			const fileData: StoryFile & { isDirectory: boolean } = {
				id:
					relativePath
						.split("/")
						.pop()
						?.replace(/\.[^/.]+$/, "") || "",
				name: relativePath.split("/").pop() || relativePath,
				path: relativePath,
				content,
				isDirectory: false,
				title,
				metadata,
				order: metadata?.order,
				created:
					metadata?.created || metadata?.edited
						? new Date(metadata.created || metadata.edited!)
						: undefined,
				edited: metadata?.edited
					? new Date(metadata.edited)
					: undefined,
			};

			files.push(fileData);

			if (relativePath === "story.yml") {
				try {
					storyMetadata = parseStoryYaml(content);
				} catch (e) {
					console.error("Failed to parse story.yml:", e);
				}
			}
		}
	}

	const story = new Story(storyMetadata || {}, path);

	// Add chapters
	const chapters = files.filter(
		(f) => f.path.startsWith("chapters/") && !f.isDirectory,
	);

	chapters.sort((a, b) => {
		const aOrder = a.order ?? a.metadata?.order;
		const bOrder = b.order ?? b.metadata?.order;

		if (aOrder !== undefined && bOrder !== undefined) {
			return aOrder - bOrder;
		}
		if (aOrder !== undefined) return -1;
		if (bOrder !== undefined) return 1;

		return a.name.localeCompare(b.name);
	});

	for (let i = 0; i < chapters.length; i++) {
		const chapter = chapters[i];
		if (
			chapter.order === undefined &&
			chapter.metadata?.order === undefined
		) {
			chapter.order = i;
		} else if (
			chapter.order === undefined &&
			chapter.metadata?.order !== undefined
		) {
			chapter.order = chapter.metadata.order;
		}

		const { isDirectory, ...chapterFile } = chapter;
		story.addChapter(chapterFile);
	}

	// Build and add notes structure
	const { folders: noteFolders, rootFiles: rootNotes } = buildFolderStructure(
		files,
		"notes/",
	);
	for (const folder of noteFolders) {
		story.addNoteFolder(folder);
	}
	for (const rootNote of rootNotes) {
		story.addRootNote(rootNote);
	}

	story.updateWordCount();

	return story;
}
