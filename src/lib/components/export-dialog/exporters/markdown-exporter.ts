import { separateFrontmatter } from "$lib/story/utils";
import type { Story } from "$lib/story";
import type { StoryExporter } from "./types";

export const markdownExporter: StoryExporter = {
	format: "md",
	label: "Markdown (.md)",
	description: "Plain text format for chapter content",
	
	async export(story: Story): Promise<Uint8Array> {
		const lines: string[] = [];

		if (story.metadata.title) {
			lines.push(`# ${story.metadata.title}`);
		}
		if (story.metadata.author) {
			lines.push(`*By ${story.metadata.author}*`);
		}
		lines.push("");

		const sortedChapters = [...story.chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

		for (const chapter of sortedChapters) {
			const chapterTitle = chapter.metadata?.title || `Chapter ${chapter.order ? chapter.order + 1 : 1}`;
			const { content: chapterContent } = separateFrontmatter(chapter.content || "");
			lines.push(`## ${chapterTitle}`);
			lines.push("");
			lines.push(chapterContent);
			lines.push("");
		}

		const markdown = lines.join('\n');
		return new TextEncoder().encode(markdown);
	}
};