import type { Story } from "$lib/story";

export interface StoryExporter {
	format: string;
	label: string;
	description: string;
	export(story: Story): Promise<Uint8Array>;
}