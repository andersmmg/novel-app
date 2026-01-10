import {
	generateFontFace,
	generateFontStack,
	getFontFamily,
} from './font-manager'

const loadedFonts = new Set<string>()
let styleElement: HTMLStyleElement | null = null

export async function loadFont(fontName: string): Promise<void> {
	if (loadedFonts.has(fontName)) {
		return
	}

	const font = getFontFamily(fontName)
	if (!font || !font.fonts.regular) {
		loadedFonts.add(fontName)
		return
	}

	try {
		const fontFaceCSS = generateFontFace(font)

		if (!styleElement) {
			styleElement = document.createElement('style')
			styleElement.id = 'dynamic-fonts'
			document.head.appendChild(styleElement)
		}

		styleElement.textContent += fontFaceCSS
		loadedFonts.add(fontName)
	}
	catch (error) {
		console.error(`Failed to load font ${fontName}:`, error)
	}
}

export async function loadFonts(fontNames: string[]): Promise<void> {
	await Promise.all(fontNames.map(loadFont))
}

export function getFontStack(fontName: string): string {
	const font = getFontFamily(fontName)
	if (!font) {
		return fontName
	}
	return generateFontStack(font)
}
