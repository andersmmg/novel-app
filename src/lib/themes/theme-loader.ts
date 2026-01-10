const themeModules = import.meta.glob('$lib/themes/*.css', { query: '?raw', import: 'default' })

export async function loadTheme(themeName: string): Promise<void> {
	const themePath = `/src/lib/themes/${themeName}.css`

	if (!(themePath in themeModules)) {
		throw new Error(`Theme ${themeName} not found. Available themes: ${Object.keys(themeModules).join(', ')}`)
	}

	// Remove existing theme styles
	const existingStyle = document.getElementById('dynamic-theme')
	if (existingStyle) {
		existingStyle.remove()
	}

	try {
		// Load new theme CSS
		const cssContent = await themeModules[themePath]() as string

		// Apply to document
		const styleElement = document.createElement('style')
		styleElement.id = 'dynamic-theme'
		styleElement.textContent = cssContent
		document.head.appendChild(styleElement)

		// Update data-theme attribute
		document.documentElement.setAttribute('data-theme', themeName)
	}
	catch (error) {
		throw new Error(`Failed to load theme CSS for ${themeName}: ${error}`)
	}
}
