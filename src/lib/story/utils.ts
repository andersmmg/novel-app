import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { StoryMetadata } from './types';

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
		if ((key === "created" || key === "edited") && typeof value === "string") {
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
	console.log('extractTitle: Input content:', content);
	const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
	console.log('extractTitle: Frontmatter match:', frontmatterMatch);
	if (frontmatterMatch) {
		const frontmatter = frontmatterMatch[1];
		console.log('extractTitle: Frontmatter content:', frontmatter);
		const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
		console.log('extractTitle: Title match:', titleMatch);
		if (titleMatch) {
			const title = titleMatch[1].trim();
			console.log('extractTitle: Found title in frontmatter:', title);
			return title;
		}
	}

	try {
		const yamlData = parseYaml(content);
		console.log('extractTitle: Parsed YAML data:', yamlData);
		if (yamlData?.title) {
			console.log('extractTitle: Found title in YAML:', yamlData.title);
			return yamlData.title;
		}
	} catch (e) {
		console.log('extractTitle: YAML parse error:', e);
	}

	console.log('extractTitle: No title found, returning empty string');
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
export function addFrontmatterIfNeeded(file: { content: string; created?: Date; edited?: Date; metadata?: any }): string {
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
 * Separates frontmatter from content
 */
export function separateFrontmatter(content: string): { frontmatter: string; content: string; metadata: any } {
	const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
	
	if (frontmatterMatch) {
		try {
			const metadata = convertDates(parseYaml(frontmatterMatch[1])) || {};
			const cleanContent = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '').trim();
			return {
				frontmatter: frontmatterMatch[1],
				content: cleanContent,
				metadata
			};
		} catch (e) {
			// If YAML parsing fails, treat as plain content
			return {
				frontmatter: '',
				content: content.trim(),
				metadata: {}
			};
		}
	}
	
	// No frontmatter found
	return {
		frontmatter: '',
		content: content.trim(),
		metadata: {}
	};
}

/**
 * Combines frontmatter and content
 */
export function combineFrontmatter(frontmatter: string, content: string): string {
	if (!frontmatter.trim()) {
		return content;
	}
	return `---\n${frontmatter}\n---\n\n${content}`;
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