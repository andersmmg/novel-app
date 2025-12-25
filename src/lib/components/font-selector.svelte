<script lang="ts">
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select";
	import { availableFonts } from "$lib/fonts/font-manager";
	import { updateFontSetting } from "$lib/fonts/font-settings";

	interface Props {
		category: "ui" | "editor";
		label: string;
		value: string;
	}

	let { category, label, value = $bindable() }: Props = $props();

	const categoryFonts = availableFonts.filter((font) =>
		font.categories.includes(category),
	);

	async function handleFontChange(fontName: string) {
		try {
			await updateFontSetting(category, fontName);
		} catch (error) {
			console.error(
				`FontSelector: Failed to update ${category} font:`,
				error,
			);
		}
	}

	function getFontDisplayName(fontName: string): string {
		const font = availableFonts.find((f) => f.name === fontName);
		return font?.displayName || fontName;
	}
</script>

<div class="space-y-2">
	<Label for="font-{category}">{label}</Label>
	<Select.Root type="single" bind:value onValueChange={handleFontChange}>
		<Select.Trigger class="w-full" id="font-{category}">
			<span>{getFontDisplayName(value)}</span>
		</Select.Trigger>
		<Select.Content>
			{#each categoryFonts as font}
				<Select.Item value={font.name}>
					{font.displayName}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
