<script lang='ts'>
	import { Button } from '$lib/components/ui/button'
	import { saveConfig, updateConfig } from '$lib/config'
	import { configStore } from '$lib/config/config-store'
	import { loadTheme } from '$lib/themes/theme-loader'

	const themes = [
		{ name: 'default', label: 'Modern' },
		{ name: 'vintage-paper', label: 'Vintage Paper' },
		{ name: 'sci-fi', label: 'Sci-Fi' },
		{ name: 'kodama', label: 'Kodama' },
		{ name: 'mocha', label: 'Mocha' },
		{ name: 'nature', label: 'Nature' },
		{ name: 'perpetuity', label: 'Perpetuity' },
	]

	let selectedTheme = $state('default')

	async function switchTheme(themeName: string) {
		try {
			await loadTheme(themeName)
			await updateConfig({ theme: themeName })
			await saveConfig()
			selectedTheme = themeName
		}
		catch (error) {
			console.error('Failed to switch theme:', error)
		}
	}

	// Load current theme on mount
	(async () => {
		const config = await configStore.getConfig()
		selectedTheme = config.theme || 'default'
	})()
</script>

<div class='flex items-start gap-2 flex-wrap'>
	{#each themes as theme}
		<Button
			variant={selectedTheme === theme.name ? 'default' : 'outline'}
			size='sm'
			onclick={() => switchTheme(theme.name)}
		>
			{theme.label}
		</Button>
	{/each}
</div>
