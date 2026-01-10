import { configStore } from '$lib/config/config-store'
import { info } from '@tauri-apps/plugin-log'
import { getFontStack, loadFont, loadFonts } from './font-loader'

export async function applyFontSettings(): Promise<void> {
	const config = await configStore.getConfig()
	const { fonts } = config

	// Load custom fonts
	await loadFonts([fonts.ui, fonts.editor])

	// Apply font stacks to CSS custom properties
	const root = document.documentElement
	const uiFontStack = getFontStack(fonts.ui)
	const editorFontStack = getFontStack(fonts.editor)

	root.style.setProperty('--font-ui', uiFontStack)
	root.style.setProperty('--font-editor', editorFontStack)

	info(
		`Applied fonts - UI: ${fonts.ui} (${uiFontStack}), Editor: ${fonts.editor} (${editorFontStack})`,
	)
}

export async function updateFontSetting(
	category: 'ui' | 'editor',
	fontName: string,
): Promise<void> {
	const config = await configStore.getConfig()
	config.fonts[category] = fontName

	// Apply font immediately
	await loadFont(fontName)
	const fontStack = getFontStack(fontName)
	document.documentElement.style.setProperty(`--font-${category}`, fontStack)

	info(`Updated ${category} font to: ${fontName} (${fontStack})`)
}
