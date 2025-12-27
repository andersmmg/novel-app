import { separateFrontmatter } from "$lib/story/utils";
import { convertMarkdownToDocx } from "@mohtasham/md-to-docx";
import type { Story } from "$lib/story";
import type { StoryExporter } from "./types";

export const docxExporter: StoryExporter = {
	format: "docx",
	label: "Word Document (.docx)",
	description: "Microsoft Word format with proper formatting",
	
	async export(story: Story): Promise<Uint8Array> {
		const markdownLines: string[] = [];

		if (story.metadata.title) {
			markdownLines.push(`# ${story.metadata.title}`);
		}

		if (story.metadata.author) {
			markdownLines.push('\n');
			markdownLines.push(`*By ${story.metadata.author}*`);
		}

		markdownLines.push('\n\n\\pagebreak\n\n');

		const sortedChapters = [...story.chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

		for (const chapter of sortedChapters) {
			const chapterTitle = chapter.metadata?.title || `Chapter ${chapter.order ? chapter.order + 1 : 1}`;
			const { content: chapterContent } = separateFrontmatter(chapter.content || "");

			markdownLines.push(`## ${chapterTitle}\n`);

			if (chapterContent.trim()) {
				markdownLines.push(chapterContent);
			}

			markdownLines.push('\n\n\\pagebreak\n\n');
		}

		const markdownContent = markdownLines.join('');
		const blob = await convertMarkdownToDocx(markdownContent);
		const arrayBuffer = await blob.arrayBuffer();
		return new Uint8Array(arrayBuffer);
	}
};