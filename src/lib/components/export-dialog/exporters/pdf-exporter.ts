import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { separateFrontmatter } from "$lib/story/utils";
import type { Story } from "$lib/story";
import type { StoryExporter } from "./types";

interface TextSegment {
	text: string;
	font: any;
	size: number;
	width: number;
}

interface ListContext {
	items: string[];
	isOrdered: boolean;
}

class PdfRenderer {
	private pdfDoc!: PDFDocument;
	private font!: any;
	private boldFont!: any;
	private italicFont!: any;
	private underlineFont!: any;
	private currentPage!: any;
	private currentY!: number;
	private fontSize = 12;
	private lineHeight = this.fontSize * 1.5;
	private margin = 50;
	private pageWidth = 595;
	private pageHeight = 842;
	private contentWidth: number;

	constructor() {
		this.contentWidth = this.pageWidth - 2 * this.margin;
	}

	async initialize(): Promise<void> {
		this.pdfDoc = await PDFDocument.create();
		this.font = await this.pdfDoc.embedFont(StandardFonts.TimesRoman);
		this.boldFont = await this.pdfDoc.embedFont(StandardFonts.TimesRomanBold);
		this.italicFont = await this.pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
		
		// Create underline font by modifying regular font (for now, use regular)
		this.underlineFont = this.font;
		
		this.currentPage = this.pdfDoc.addPage([this.pageWidth, this.pageHeight]);
		this.currentY = this.pageHeight - this.margin;
	}

	private addNewPage(): void {
		this.currentPage = this.pdfDoc.addPage([this.pageWidth, this.pageHeight]);
		this.currentY = this.pageHeight - this.margin;
	}

	private addTextLine(text: string, font: any = this.font, size: number = this.fontSize): void {
		if (this.currentY < this.margin + this.lineHeight) {
			this.addNewPage();
		}

		this.currentPage.drawText(text, {
			x: this.margin,
			y: this.currentY,
			size: size,
			font: font,
			color: rgb(0, 0, 0)
		});
		this.currentY -= this.lineHeight;
	}

	private wrapAndRenderText(text: string, font: any = this.font, size: number = this.fontSize): void {
		const words = text.split(' ');
		let currentLine = '';
		
		for (const word of words) {
			const testLine = currentLine ? `${currentLine} ${word}` : word;
			const textWidth = font.widthOfTextAtSize(testLine, size);
			
			if (textWidth > this.contentWidth && currentLine) {
				this.addTextLine(currentLine, font, size);
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		}
		
		if (currentLine) {
			this.addTextLine(currentLine, font, size);
		}
	}

	private parseMarkdownSegments(text: string): TextSegment[] {
		const segments: TextSegment[] = [];
		let currentIndex = 0;
		
		while (currentIndex < text.length) {
			const remainingText = text.substring(currentIndex);
			
			// Find next formatting marker
			let nextBold = remainingText.indexOf('**');
			let nextItalic = remainingText.indexOf('*');
			let nextUnderline = remainingText.indexOf('++');
			
			// Filter out asterisks that are part of bold
			if (nextItalic !== -1 && nextItalic > 0) {
				const nextBoldCheck = remainingText.substring(0, nextItalic).includes('**');
				if (nextBoldCheck) {
					nextItalic = -1; // Skip this asterisk, it's part of a potential bold
				}
			}
			
			// Find the earliest valid match
			const matches: Array<{index: number, type: string, content: string, fullMatch: string}> = [];
			
			if (nextBold !== -1 && nextBold >= 0) {
				const endBold = remainingText.indexOf('**', nextBold + 2);
				if (endBold !== -1) {
					matches.push({
						index: nextBold,
						type: 'bold',
						content: remainingText.substring(nextBold + 2, endBold),
						fullMatch: remainingText.substring(nextBold, endBold + 2)
					});
				}
			}
			
			if (nextItalic !== -1 && nextItalic >= 0) {
				// Make sure it's not part of bold and not followed by another asterisk immediately
				const prevChar = nextItalic > 0 ? remainingText[nextItalic - 1] : '';
				const nextChar = remainingText[nextItalic + 1];
				
				if (prevChar !== '*' && nextChar !== '*') {
					const endItalic = remainingText.indexOf('*', nextItalic + 1);
					if (endItalic !== -1) {
						matches.push({
							index: nextItalic,
							type: 'italic',
							content: remainingText.substring(nextItalic + 1, endItalic),
							fullMatch: remainingText.substring(nextItalic, endItalic + 1)
						});
					}
				}
			}
			
			if (nextUnderline !== -1 && nextUnderline >= 0) {
				const endUnderline = remainingText.indexOf('++', nextUnderline + 2);
				if (endUnderline !== -1) {
					matches.push({
						index: nextUnderline,
						type: 'underline',
						content: remainingText.substring(nextUnderline + 2, endUnderline),
						fullMatch: remainingText.substring(nextUnderline, endUnderline + 2)
					});
				}
			}
			
			if (matches.length === 0) {
				// No more formatting, add remaining text
				const plainText = text.substring(currentIndex);
				if (plainText) {
					segments.push({
						text: plainText,
						font: this.font,
						size: this.fontSize,
						width: this.font.widthOfTextAtSize(plainText, this.fontSize)
					});
				}
				break;
			}
			
			// Sort matches by index to find the first one
			matches.sort((a, b) => a.index - b.index);
			const firstMatch = matches[0];
			
			// Add plain text before the match
			if (firstMatch.index > currentIndex) {
				const plainBefore = text.substring(currentIndex, currentIndex + firstMatch.index);
				if (plainBefore) {
					segments.push({
						text: plainBefore,
						font: this.font,
						size: this.fontSize,
						width: this.font.widthOfTextAtSize(plainBefore, this.fontSize)
					});
				}
			}
			
			// Add the formatted segment
			let font: any = this.font;
			switch (firstMatch.type) {
				case 'bold':
					font = this.boldFont;
					break;
				case 'italic':
					font = this.italicFont;
					break;
				case 'underline':
					font = this.underlineFont;
					break;
			}
			
			segments.push({
				text: firstMatch.content,
				font: font,
				size: this.fontSize,
				width: font.widthOfTextAtSize(firstMatch.content, this.fontSize)
			});
			
			currentIndex += firstMatch.fullMatch.length;
		}
		
		return segments;	
	}



	private renderListItems(items: string[], isOrdered: boolean = false): void {
		for (let i = 0; i < items.length; i++) {
			const bullet = isOrdered ? `${i + 1}.` : '•';
			const itemText = items[i].trim();
			
			if (itemText) {
				if (this.currentY < this.margin + this.lineHeight) {
					this.addNewPage();
				}

				// Draw bullet
				this.currentPage.drawText(bullet + ' ', {
					x: this.margin,
					y: this.currentY,
					size: this.fontSize,
					font: this.font,
					color: rgb(0, 0, 0)
				});

				// Render text with inline formatting
				const bulletWidth = this.font.widthOfTextAtSize(bullet + ' ', this.fontSize);
				const segments = this.parseMarkdownSegments(itemText);
				let currentX = this.margin + bulletWidth;
				
				for (const segment of segments) {
					if (currentX + segment.width > this.pageWidth - this.margin) {
						this.currentY -= this.lineHeight;
						currentX = this.margin + bulletWidth + 20; // Indent continued lines
						
						if (this.currentY < this.margin + this.lineHeight) {
							this.addNewPage();
							currentX = this.margin + bulletWidth + 20;
						}
					}
					
					this.currentPage.drawText(segment.text, {
						x: currentX,
						y: this.currentY,
						size: segment.size,
						font: segment.font,
						color: rgb(0, 0, 0)
					});
					currentX += segment.width;
				}
				
				this.currentY -= this.lineHeight;
			}
		}
	}

	addTitlePage(title: string, author: string): void {
		if (title) {
			this.wrapAndRenderText(title, this.boldFont, this.fontSize + 8);
			this.currentY -= this.lineHeight * 3;
		}

		if (author) {
			this.wrapAndRenderText(`By ${author}`, this.font, this.fontSize);
			this.currentY -= this.lineHeight * 2;
		}

		// Force page break after title page
		this.addNewPage();
	}

	addChapter(title: string): void {
		this.wrapAndRenderText(title, this.boldFont, this.fontSize + 4);
		this.currentY -= this.lineHeight;
	}

	private addStyledText(text: string): void {
		// Strip formatting and use reliable existing method to fix text wrapping issues
		const plainText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/\+\+(.*?)\+\+/g, '$1');
		this.wrapAndRenderText(plainText);
	}

	addContent(content: string): void {
		const lines = content.split('\n');
		let listContext: ListContext | null = null;

		for (const line of lines) {
			const trimmedLine = line.trim();
			
			// Check for list items
			const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
			const unorderedListMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
			
			if (orderedListMatch || (unorderedListMatch && unorderedListMatch[1])) {
				const itemText = orderedListMatch ? orderedListMatch[1] : (unorderedListMatch ? unorderedListMatch[1] : '');
				
				if (!listContext) {
					// Start new list
					listContext = {
						items: [itemText],
						isOrdered: !!orderedListMatch
					};
				} else if (listContext.isOrdered === !!orderedListMatch) {
					// Continue same list type
					listContext.items.push(itemText);
				} else {
					// List type changed, render previous list
					this.renderListItems(listContext.items, listContext.isOrdered);
					listContext = {
						items: [itemText],
						isOrdered: !!orderedListMatch
					};
				}
			} else {
				// Not a list item
				if (listContext) {
					// Render pending list
					this.renderListItems(listContext.items, listContext.isOrdered);
					listContext = null;
				}
				
				if (trimmedLine) {
					this.addStyledText(trimmedLine);
				} else {
					// Empty line - add spacing
					this.currentY -= this.lineHeight;
				}
			}
		}
		
		// Render any remaining list
		if (listContext) {
			this.renderListItems(listContext.items, listContext.isOrdered);
		}
	}

	async save(): Promise<Uint8Array> {
		const pdfBytes = await this.pdfDoc.save();
		return new Uint8Array(pdfBytes);
	}

	async addPageBreak(): Promise<void> {
		this.addNewPage();
	}
}

export const pdfExporter: StoryExporter = {
	format: "pdf",
	label: "PDF Document (.pdf)",
	description: "Portable Document Format for easy sharing",
	
	async export(story: Story): Promise<Uint8Array> {
		const renderer = new PdfRenderer();
		await renderer.initialize();

		// Add title page
		renderer.addTitlePage(
			story.metadata.title || '',
			story.metadata.author ? `By ${story.metadata.author}` : ''
		);

		// Add chapters
		const sortedChapters = [...story.chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

		for (let i = 0; i < sortedChapters.length; i++) {
			const chapter = sortedChapters[i];
			const chapterTitle = chapter.metadata?.title || `Chapter ${chapter.order ? chapter.order + 1 : 1}`;
			const { content: chapterContent } = separateFrontmatter(chapter.content || "");

			if (i > 0) {
				await renderer.addPageBreak();
			}

			renderer.addChapter(chapterTitle);
			renderer.addContent(chapterContent);
		}

		return await renderer.save();
	}
};