import { storyExporter } from "./story-exporter";
import { markdownExporter } from "./markdown-exporter";
import { docxExporter } from "./docx-exporter";
import { pdfExporter } from "./pdf-exporter";
import type { StoryExporter } from "./types";

export const exporters: StoryExporter[] = [
	storyExporter,
	markdownExporter,
	docxExporter,
	pdfExporter
];

export type { StoryExporter } from "./types";