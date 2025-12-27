import { saveStory } from "$lib/story";
import type { Story } from "$lib/story";
import type { StoryExporter } from "./types";

export const storyExporter: StoryExporter = {
	format: "story",
	label: "Story Format (.story)",
	description: "Native app format with all metadata",
	
	async export(story: Story): Promise<Uint8Array> {
		const storyBlob = await saveStory(story);
		const arrayBuffer = await storyBlob.arrayBuffer();
		return new Uint8Array(arrayBuffer);
	}
};