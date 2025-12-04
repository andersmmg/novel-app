import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { StoryMetadata } from "./types";

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
	metadata?: any;
}): string {
	const hasDates = file.created || file.edited;
	const hasMetadata = file.metadata && Object.keys(file.metadata).length > 0;

	if (!hasDates && !hasMetadata) {
		return file.content;
	}

	if (file.content.startsWith("---\n")) {
		return file.content;
	}

	const metadata: any = { ...file.metadata };
	if (file.created) metadata.created = file.created;
	if (file.edited) metadata.edited = file.edited;

	const frontmatter = stringifyYaml(convertDatesToStrings(metadata));
	return `---\n${frontmatter}\n---\n\n${file.content}`;
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
	const matches = content.match(/\b\w+\b/g);
	return matches ? matches.length : 0;
}

/**
 * Formats word count for display (e.g., 1500 -> "1.5k", 1500000 -> "1.5M")
 */
export function formatWordCount(count: number): string {
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
