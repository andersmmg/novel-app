<script lang="ts">
	import { saveCurrentStory } from "$lib/app-state.svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select";
	import type { Story } from "$lib/story";
	import { saveStory } from "$lib/story";
	import { separateFrontmatter } from "$lib/story/utils";
	import { save } from "@tauri-apps/plugin-dialog";
	import { toast } from "svelte-sonner";

	interface Props {
		story: Story;
		onClose: () => void;
	}

	let { story, onClose }: Props = $props();

	let isOpen = $state(true);
	let selectedFormat = $state("story");

	async function exportStoryAsMarkdown(story: Story): Promise<Uint8Array> {
		const lines: string[] = [];

		if (story.metadata.title) {
			lines.push(`# ${story.metadata.title}`);
		}
		if (story.metadata.author) {
			lines.push(`*By ${story.metadata.author}*`);
		}
		lines.push("");

		const sortedChapters = [...story.chapters].sort(
			(a, b) => (a.order ?? 0) - (b.order ?? 0),
		);

		for (const chapter of sortedChapters) {
			const chapterOrder = (chapter.order ?? 0) + 1;
			const chapterTitle =
				chapter.metadata?.title || `Chapter ${chapterOrder}`;
			lines.push(`## ${chapterTitle}`);
			lines.push("");

			const { content: chapterContent } = separateFrontmatter(
				chapter.content || "",
			);
			lines.push(chapterContent);
			lines.push("");
		}

		const markdown = lines.join("\n");
		return new TextEncoder().encode(markdown);
	}

	const exportFormats = [
		{
			value: "story",
			label: "Story Format (.story)",
			description: "Native app format with all metadata",
		},
		{
			value: "md",
			label: "Markdown (.md)",
			description: "Plain text format for chapter content",
		},
	];

	async function handleExport() {
		if (!story) return;

		try {
			await saveCurrentStory();

			let content: Uint8Array;
			let filterName: string;

			if (selectedFormat === "md") {
				content = await exportStoryAsMarkdown(story);
				filterName = "Markdown Files";
			} else {
				const storyBlob = await saveStory(story);
				const arrayBuffer = await storyBlob.arrayBuffer();
				content = new Uint8Array(arrayBuffer);
				filterName = "Story Files";
			}

			const selectedPath = await save({
				title: "Export Story",
				defaultPath: `${story.metadata.title || "story"}.${selectedFormat}`,
				filters: [
					{
						name: filterName,
						extensions: [selectedFormat] as string[],
					},
				],
			});

			if (selectedPath) {
				const { writeFile } = await import("@tauri-apps/plugin-fs");
				await writeFile(selectedPath, content);

				const filename = selectedPath.split(/[/\\]/).pop() || "file";
				toast.success(`Successfully exported "${filename}"`, {
					description: "Your story has been saved successfully.",
				});

				onClose();
			}
		} catch (error) {
			console.error("Export failed:", error);
		}
	}
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Export Story</Dialog.Title>
			<Dialog.Description>
				Choose export format and save your story.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-6 py-4">
			<div class="space-y-2">
				<Label for="format">Export Format</Label>
				<Select.Root bind:value={selectedFormat} type="single">
					<Select.Trigger id="format" class="w-full">
						<span
							>{exportFormats.find(
								(f) => f.value === selectedFormat,
							)?.label || "Select export format"}</span
						>
					</Select.Trigger>
					<Select.Content>
						{#each exportFormats as format}
							<Select.Item value={format.value}>
								<div class="flex flex-col">
									<span>{format.label}</span>
									<span class="text-xs text-muted-foreground"
										>{format.description}</span
									>
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label>Preview</Label>
				<div
					class="text-sm text-muted-foreground bg-muted p-3 rounded-md"
				>
					<p>
						Will export as: <strong class="text-foreground"
							>{story.metadata.title ||
								"story"}.{selectedFormat}</strong
						>
					</p>
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={onClose}>Cancel</Button>
			<Button onclick={handleExport}>Export</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
