<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Field from "$lib/components/ui/field";
	import Input from "$lib/components/ui/input/input.svelte";
	import { Label } from "$lib/components/ui/label";
	import type { StoryMetadata } from "$lib/story/types";
	import GoalIcon from "virtual:icons/lucide/goal"

	interface Props {
		metadata: StoryMetadata;
		onSave: (goals: StoryMetadata["goals"]) => void;
	}

	let { metadata, onSave }: Props = $props();

	let localGoals: StoryMetadata["goals"] = $state({
		words: { enabled: false, target: 10000 },
		chapters: { enabled: false, target: 20 },
		notes: { enabled: false, target: 50 },
		quotes: { enabled: false, target: 100 },
		paragraphs: { enabled: false, target: 200 },
	});

	let isOpen = $state(false);
	let isInitialized = $state(false);

	function handleSave() {
		onSave(localGoals);
		isOpen = false;
	}

	function handleCancel() {
		isOpen = false;
	}

	$effect(() => {
		if (!isInitialized && metadata.goals) {
			localGoals = { ...localGoals, ...metadata.goals };
			isInitialized = true;
		}
	});
</script>

<Dialog.Root bind:open={isOpen}>
	<Button
		variant="outline"
		size="icon-sm"
		title="Set Goals"
		onclick={() => (isOpen = true)}
	>
		<GoalIcon class="w-4 h-4" />
	</Button>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Story Goals</Dialog.Title>
			<Dialog.Description>
				Set targets for your story statistics. Progress bars will show
				in the story overview.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<Field.Field>
				<div class="flex items-center gap-3 pb-2">
					<Checkbox
						id="words-enabled"
						bind:checked={localGoals!.words!.enabled}
					/>
					<Label for="words-enabled">Words Target</Label>
				</div>
				{#if localGoals?.words?.enabled}
					<Input
						type="number"
						min="1"
						bind:value={localGoals.words!.target}
						placeholder="Enter word count target"
					/>
				{/if}
			</Field.Field>

			<Field.Field>
				<div class="flex items-center gap-3 pb-2">
					<Checkbox
						id="chapters-enabled"
						bind:checked={localGoals!.chapters!.enabled}
					/>
					<Label for="chapters-enabled">Chapters Target</Label>
				</div>
				{#if localGoals?.chapters?.enabled}
					<Input
						type="number"
						min="1"
						bind:value={localGoals.chapters!.target}
						placeholder="Enter chapter count target"
					/>
				{/if}
			</Field.Field>

			<Field.Field>
				<div class="flex items-center gap-3 pb-2">
					<Checkbox
						id="notes-enabled"
						bind:checked={localGoals!.notes!.enabled}
					/>
					<Label for="notes-enabled">Notes Target</Label>
				</div>
				{#if localGoals?.notes?.enabled}
					<Input
						type="number"
						min="1"
						bind:value={localGoals.notes!.target}
						placeholder="Enter note count target"
					/>
				{/if}
			</Field.Field>

			<Field.Field>
				<div class="flex items-center gap-3 pb-2">
					<Checkbox
						id="quotes-enabled"
						bind:checked={localGoals!.quotes!.enabled}
					/>
					<Label for="quotes-enabled">Quotes Target</Label>
				</div>
				{#if localGoals?.quotes?.enabled}
					<Input
						type="number"
						min="1"
						bind:value={localGoals.quotes!.target}
						placeholder="Enter quote count target"
					/>
				{/if}
			</Field.Field>

			<Field.Field>
				<div class="flex items-center gap-3 pb-2">
					<Checkbox
						id="paragraphs-enabled"
						bind:checked={localGoals!.paragraphs!.enabled}
					/>
					<Label for="paragraphs-enabled">Paragraphs Target</Label>
				</div>
				{#if localGoals?.paragraphs?.enabled}
					<Input
						type="number"
						min="1"
						bind:value={localGoals.paragraphs!.target}
						placeholder="Enter paragraph count target"
					/>
				{/if}
			</Field.Field>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleSave}>Save Goals</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
