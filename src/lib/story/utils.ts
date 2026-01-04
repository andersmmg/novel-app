import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { StoryMetadata, StoryFile } from "./types";
import type { Story } from "./story-class";
import { configStore } from "../config/config-store";

const frontmatterCache = new Map<
	string,
	{
		frontmatter: string;
		content: string;
		metadata: any;
	}
>();

/**
 * Converts string dates in objects to Date instances
 */
export function convertDates(obj: any): any {
	if (!obj || typeof obj !== "object") return obj;

	if (Array.isArray(obj)) {
		return obj.map(convertDates);
	}

	const result: any = {};
	for (const [key, value] of Object.entries(obj)) {
		if (
			(key === "created" || key === "edited") &&
			typeof value === "string"
		) {
			const date = new Date(value);
			result[key] = isNaN(date.getTime()) ? new Date() : date;
		} else if (typeof value === "object") {
			result[key] = convertDates(value);
		} else {
			result[key] = value;
		}
	}

	return result;
}

/**
 * Converts Date instances in objects to ISO strings
 */
export function convertDatesToStrings(obj: any): any {
	if (!obj || typeof obj !== "object") return obj;

	if (Array.isArray(obj)) {
		return obj.map(convertDatesToStrings);
	}

	const result: any = {};
	for (const [key, value] of Object.entries(obj)) {
		if ((key === "created" || key === "edited") && value instanceof Date) {
			result[key] = value.toISOString();
		} else if (typeof value === "object") {
			result[key] = convertDatesToStrings(value);
		} else {
			result[key] = value;
		}
	}

	return result;
}

/**
 * Extracts title from content with frontmatter or YAML
 */
export function extractTitle(content: string): string {
	const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
	if (frontmatterMatch) {
		const frontmatter = frontmatterMatch[1];
		const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
		if (titleMatch) {
			const title = titleMatch[1].trim();
			return title;
		}
	}

	try {
		const yamlData = parseYaml(content);
		if (yamlData?.title) {
			return yamlData.title;
		}
	} catch (e) {
		// YAML parse error, continue
	}

	return "";
}

/**
 * Parses metadata from content with frontmatter or YAML
 */
export function parseMetadata(content: string): StoryMetadata | undefined {
	const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
	if (frontmatterMatch) {
		try {
			return convertDates(parseYaml(frontmatterMatch[1])) || {};
		} catch (e) {
			return {};
		}
	}

	try {
		return convertDates(parseYaml(content)) || {};
	} catch (e) {
		return {};
	}
}

/**
 * Adds frontmatter to content if metadata exists
 */
export function addFrontmatterIfNeeded(file: {
	content: string;
	created?: Date;
	edited?: Date;
	order?: number;
	metadata?: any;
}): string {
	const hasDates = file.created || file.edited;
	const hasMetadata = file.metadata && Object.keys(file.metadata).length > 0;
	const hasOrder = file.order !== undefined;

	if (!hasDates && !hasMetadata && !hasOrder) {
		return file.content;
	}

	// Parse existing frontmatter if present
	let existingMetadata: any = {};
	let contentWithoutFrontmatter = file.content;

	if (file.content.startsWith("---\n")) {
		const frontmatterMatch = file.content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
		if (frontmatterMatch) {
			try {
				existingMetadata = parseYaml(frontmatterMatch[1]) || {};
				contentWithoutFrontmatter = file.content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "").trim();
			} catch (e) {
				// If parsing fails, treat as plain content
				contentWithoutFrontmatter = file.content;
			}
		}
	}

	// Merge metadata (new values override existing ones)
	const mergedMetadata: any = { ...existingMetadata, ...file.metadata };
	if (file.created) mergedMetadata.created = file.created;
	if (file.edited) mergedMetadata.edited = file.edited;
	if (file.order !== undefined) mergedMetadata.order = file.order;

	const frontmatter = stringifyYaml(convertDatesToStrings(mergedMetadata));
	return `---\n${frontmatter}\n---\n\n${contentWithoutFrontmatter}`;
}

/**
 * Separates frontmatter from content with caching
 */
export function separateFrontmatter(content: string): {
	frontmatter: string;
	content: string;
	metadata: any;
} {
	// Check cache first
	const cached = frontmatterCache.get(content);
	if (cached) {
		return cached;
	}

	const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);

	let result: {
		frontmatter: string;
		content: string;
		metadata: any;
	};

	if (frontmatterMatch) {
		try {
			const metadata = convertDates(parseYaml(frontmatterMatch[1])) || {};
			const cleanContent = content
				.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "")
				.trim();
			result = {
				frontmatter: frontmatterMatch[1],
				content: cleanContent,
				metadata,
			};
		} catch (e) {
			// If YAML parsing fails, treat as plain content
			result = {
				frontmatter: "",
				content: content.trim(),
				metadata: {},
			};
		}
	} else {
		// No frontmatter found
		result = {
			frontmatter: "",
			content: content.trim(),
			metadata: {},
		};
	}

	// Cache the result (limit cache size to prevent memory issues)
	if (frontmatterCache.size > 100) {
		const firstKey = frontmatterCache.keys().next().value;
		if (firstKey) {
			frontmatterCache.delete(firstKey);
		}
	}
	frontmatterCache.set(content, result);

	return result;
}

/**
 * Combines frontmatter and content
 */
export function combineFrontmatter(
	frontmatter: string,
	content: string,
): string {
	if (!frontmatter.trim()) {
		return content;
	}
	return `---\n${frontmatter}\n---\n\n${content}`;
}

/**
 * Counts words in text content, excluding frontmatter
 */
export function countWords(text: string): number {
	const { content } = separateFrontmatter(text);
	const matches = content.match(/\b\S+\b/g);
	return matches ? matches.length : 0;
}

/**
 * Counts quotes in text content, excluding frontmatter
 */
export function countQuotes(text: string): number {
	const { content } = separateFrontmatter(text);
	const matches = content.match(/"[^"]*"/g);
	return matches ? matches.length : 0;
}

/**
 * Counts paragraphs in text content, excluding frontmatter
 * A paragraph is defined as a block of text separated by newlines with at least minWordsPerParagraph words
 */
export function countParagraphs(text: string, minWords: number = 1): number {
	const { content } = separateFrontmatter(text);

	// Split by double newlines (paragraph breaks) and filter out empty lines
	const paragraphs = content
		.split(/\n\s*\n/)
		.map(p => p.trim())
		.filter(p => p.length > 0);

	// Count paragraphs that meet the minimum word count requirement
	let validParagraphs = 0;
	for (const paragraph of paragraphs) {
		const wordCount = paragraph.match(/\b\w+\b/g);
		if (wordCount && wordCount.length >= minWords) {
			validParagraphs++;
		}
	}

	return validParagraphs;
}

/**
 * Formats word count for display (e.g., 1500 -> "1.5k", 1500000 -> "1.5M")
 */
export function formatCount(count: number): string {
	if (count < 1000) {
		return count.toString();
	} else if (count < 1000000) {
		return `${(count / 1000).toFixed(1)}k`;
	} else {
		return `${(count / 1000000).toFixed(1)}M`;
	}
}

/**
 * Sanitizes filename by removing invalid characters
 */
export function sanitizeFilename(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim();
}

/**
 * Determines file type from path
 */
export function getFileTypeFromPath(
	path: string,
): "chapter" | "note" | "folder" | "unknown" {
	if (path.startsWith("chapters/")) return "chapter";
	if (path.startsWith("notes/")) return "note";
	return "unknown";
}

/**
 * Determines if a path represents a folder (ends with /)
 */
export function isFolderPath(path: string): boolean {
	return path.endsWith("/");
}

/**
 * Renames a StoryFile and updates the story accordingly
 */
export function renameStoryFile(
	story: Story,
	filePath: string,
	newTitle: string,
): boolean {
	if (!story || !filePath) return false;

	const fileType = getFileTypeFromPath(filePath);
	if (fileType === "unknown") return false;

	const now = new Date();
	const updatedMetadata = {
		title: newTitle,
		edited: now,
	};

	// Update the file based on type
	if (fileType === "chapter") {
		return story.updateChapter(filePath, {
			title: newTitle,
			metadata: updatedMetadata,
			edited: now,
		});
	} else if (fileType === "note") {
		return story.updateNote(filePath, {
			title: newTitle,
			metadata: updatedMetadata,
			edited: now,
		});
	}

	return false;
}

/**
 * Updates StoryFile content and updates the story accordingly
 */
export function updateStoryFileContent(
	story: Story,
	filePath: string,
	newContent: string,
): boolean {
	if (!story || !filePath) return false;

	const fileType = getFileTypeFromPath(filePath);
	if (fileType === "unknown") return false;

	const now = new Date();

	// Update the file based on type
	if (fileType === "chapter") {
		const existingChapter = story.getChapterByPath(filePath);
		return story.updateChapter(filePath, {
			content: newContent,
			edited: now,
			order: existingChapter?.order,
			metadata: existingChapter?.metadata,
		});
	} else if (fileType === "note") {
		const existingNote = story.findNoteByPath(filePath);
		if (existingNote && !("children" in existingNote)) {
			return story.updateNote(filePath, {
				content: newContent,
				edited: now,
				metadata: existingNote.metadata,
			});
		}
	}

	return false;
}

/**
 * Renames a StoryFolder and updates the story accordingly
 */
export function renameStoryFolder(
	story: Story,
	folderPath: string,
	newTitle: string,
): boolean {
	if (!story || !folderPath || !isFolderPath(folderPath)) return false;

	const now = new Date();
	const updatedMetadata = {
		title: newTitle,
		edited: now,
	};

	return story.updateFolder(folderPath, {
		title: newTitle,
		metadata: updatedMetadata,
	});
}

/**
 * Unified rename function for both files and folders
 */
export function renameStoryItem(
	story: Story,
	itemPath: string,
	newTitle: string,
): boolean {
	if (!story || !itemPath) return false;

	if (isFolderPath(itemPath)) {
		return renameStoryFolder(story, itemPath, newTitle);
	} else {
		return renameStoryFile(story, itemPath, newTitle);
	}
}
