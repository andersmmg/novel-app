export interface FontFamily {
	name: string;
	displayName: string;
	categories: ("ui" | "editor")[];
	fonts: {
		regular?: string;
		italic?: string;
		bold?: string;
		semiBold?: string;
		boldItalic?: string;
		variable?: string;
		variableItalic?: string;
	};
	fallbacks: string[];
}

export const availableFonts: FontFamily[] = [
	{
		name: "system-ui",
		displayName: "System UI",
		categories: ["ui", "editor"],
		fonts: {},
		fallbacks: [
			"system-ui",
			"-apple-system",
			"BlinkMacSystemFont",
			"Segoe UI",
			"sans-serif",
		],
	},
	{
		name: "jua",
		displayName: "Jua",
		categories: ["ui"],
		fonts: {
			regular: "/fonts/Jua.ttf",
		},
		fallbacks: ["Jua", "system-ui", "sans-serif"],
	},
	{
		name: "noto-sans",
		displayName: "Noto Sans",
		categories: ["ui", "editor"],
		fonts: {
			regular: "/fonts/NotoSans-Regular.ttf",
			italic: "/fonts/NotoSans-Italic.ttf",
			bold: "/fonts/NotoSans-Bold.ttf",
			semiBold: "/fonts/NotoSans-Medium.ttf",
			boldItalic: "/fonts/NotoSans-BoldItalic.ttf",
		},
		fallbacks: ["Noto Sans", "system-ui", "sans-serif"],
	},
	{
		name: "noto-serif",
		displayName: "Noto Serif",
		categories: ["ui", "editor"],
		fonts: {
			variable: "/fonts/NotoSerif.ttf",
		},
		fallbacks: ["Noto Serif", "Georgia", "serif"],
	},
	{
		name: "nunito",
		displayName: "Nunito",
		categories: ["ui", "editor"],
		fonts: {
			regular: "/fonts/Nunito.ttf",
			italic: "/fonts/Nunito-Italic.ttf",
		},
		fallbacks: ["Nunito", "system-ui", "sans-serif"],
	},
	{
		name: "courier-prime",
		displayName: "Courier Prime",
		categories: ["ui", "editor"],
		fonts: {
			regular: "/fonts/CourierPrime-Regular.ttf",
			italic: "/fonts/CourierPrime-Italic.ttf",
			bold: "/fonts/CourierPrime-Bold.ttf",
			boldItalic: "/fonts/CourierPrime-BoldItalic.ttf",
		},
		fallbacks: ["Courier Prime", "Courier New", "monospace"],
	},
	{
		name: "patrick-hand",
		displayName: "Patrick Hand",
		categories: ["ui", "editor"],
		fonts: {
			regular: "/fonts/PatrickHand-Regular.ttf",
		},
		fallbacks: ["Patrick Hand", "sans-serif"],
	},
	{
		name: "opendyslexic",
		displayName: "OpenDyslexic",
		categories: ["ui", "editor"],
		fonts: {
			regular: "/fonts/OpenDyslexic-Regular.ttf",
			bold: "/fonts/OpenDyslexic-Bold.ttf",
			italic: "/fonts/OpenDyslexic-Italic.ttf",
			boldItalic: "/fonts/OpenDyslexic-BoldItalic.ttf",
		},
		fallbacks: ["OpenDyslexic", "sans-serif"],
	},
];

export function getFontFamily(fontName: string): FontFamily | undefined {
	return availableFonts.find((font) => font.name === fontName);
}

export function generateFontFace(font: FontFamily): string {
	let css = "";

	if (font.fonts.variable) {
		css += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.fonts.variable}') format('truetype');
  font-weight: 400 500 700;
}
`;
	}

	if (font.fonts.variableItalic) {
		css += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.fonts.variableItalic}') format('truetype');
  font-weight: 400 500 700;
  font-style: italic;
}
`;
	}

	if (font.fonts.regular) {
		css += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.fonts.regular}') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: auto;
}
`;
	}

	if (font.fonts.italic) {
		css += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.fonts.italic}') format('truetype');
  font-weight: 400;
  font-style: italic;
  font-display: auto;
}
`;
	}

	if (font.fonts.bold) {
		css += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.fonts.bold}') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: auto;
}
`;
	}

	if (font.fonts.semiBold) {
		css += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.fonts.semiBold}') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: auto;
}
`;
	}

	if (font.fonts.boldItalic) {
		css += `
@font-face {
  font-family: '${font.name}';
  src: url('${font.fonts.boldItalic}') format('truetype');
  font-weight: 700;
  font-style: italic;
  font-display: auto;
}
`;
	}

	return css;
}

export function generateFontStack(font: FontFamily): string {
	return `'${font.name}', ${font.fallbacks.join(", ")}`;
}
