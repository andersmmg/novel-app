<script lang="ts">
	import { saveCurrentStory } from "$lib/app-state.svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select";
	import type { Story } from "$lib/story";
	import { saveStory } from "$lib/story";
	import { save } from "@tauri-apps/plugin-dialog";

	interface Props {
		story: Story;
		onClose: () => void;
	}

	let { story, onClose }: Props = $props();

	let isOpen = $state(true);
	let selectedFormat = $state("story");

	const exportFormats = [
		{
			value: "story",
			label: "Story Format (.story)",
			description: "Native app format with all metadata",
		},
	];

	async function handleExport() {
		if (!story) return;

		try {
			await saveCurrentStory();

			const storyBlob = await saveStory(story);
			const arrayBuffer = await storyBlob.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);

			const selectedPath = await save({
				title: "Export Story",
				defaultPath: `${story.metadata.title || "story"}.${selectedFormat}`,
				filters: [
					{
						name: "Story Files",
						extensions: [selectedFormat] as string[],
					},
				],
			});

			if (selectedPath) {
				const { writeFile } = await import("@tauri-apps/plugin-fs");
				await writeFile(selectedPath, uint8Array);
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
