<script lang="ts">
	import { saveCurrentStory } from "$lib/app-state.svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select";
	import type { Story } from "$lib/story";
	import { documentDir, join } from "@tauri-apps/api/path";
	import { save } from "@tauri-apps/plugin-dialog";
	import { toast } from "svelte-sonner";
	import { exporters } from "./exporters";

	interface Props {
		story: Story;
		onClose: () => void;
	}

	let { story, onClose }: Props = $props();

	let isOpen = $state(true);
	let selectedFormat = $state("story");

	async function handleExport() {
		if (!story) return;

		try {
			await saveCurrentStory();

			const exporter = exporters.find((e) => e.format === selectedFormat);
			if (!exporter) {
				throw new Error(`Unknown export format: ${selectedFormat}`);
			}

			const content = await exporter.export(story);
			const filterName = exporter.label.split(" ")[0] + " Files";

			const selectedPath = await save({
				title: "Export Story",
				defaultPath: await join(
					await documentDir(),
					`${story.metadata.title || "story"}.${selectedFormat}`,
				),
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

			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred";
			toast.error("Export failed", {
				description: errorMessage,
			});
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
							>{exporters.find((e) => e.format === selectedFormat)
								?.label || "Select export format"}</span
						>
					</Select.Trigger>
					<Select.Content>
						{#each exporters as exporter}
							<Select.Item value={exporter.format}>
								<div class="flex flex-col">
									<span>{exporter.label}</span>
									<span class="text-xs text-muted-foreground"
										>{exporter.description}</span
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
