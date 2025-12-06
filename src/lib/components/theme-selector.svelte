<script lang="ts">
	import { configStore } from "$lib/config/config-store";
	import { loadTheme } from "$lib/themes/theme-loader";
	import { updateConfig, saveConfig } from "$lib/config";
	import { Button } from "$lib/components/ui/button";

	const themes = [
		{ name: "default", label: "Modern" },
		{ name: "vintage-paper", label: "Vintage Paper" },
		{ name: "sci-fi", label: "Sci-Fi" },
		{ name: "kodama", label: "Kodama" },
		{ name: "mocha", label: "Mocha" },
		{ name: "nature", label: "Nature" },
		{ name: "perpetuity", label: "Perpetuity" },
	];

	let selectedTheme = $state("default");

	async function switchTheme(themeName: string) {
		try {
			await loadTheme(themeName);
			await updateConfig({ theme: themeName });
			await saveConfig();
			selectedTheme = themeName;
		} catch (error) {
			console.error("Failed to switch theme:", error);
		}
	}

	// Load current theme on mount
	(async () => {
		const config = await configStore.getConfig();
		selectedTheme = config.theme || "default";
	})();
</script>

<div class="flex items-center gap-2">
	{#each themes as theme}
		<Button
			variant={selectedTheme === theme.name ? "default" : "outline"}
			size="sm"
			onclick={() => switchTheme(theme.name)}
		>
			{theme.label}
		</Button>
	{/each}
</div>
