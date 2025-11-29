import JSZip from 'jszip';
import { parse as parseYaml } from 'yaml';

export interface StoryFile {
	name: string;
	path: string;
	content: string;
	isDirectory: boolean;
	title?: string;
	metadata?: any;
}

export interface StoryFolder {
	name: string;
	path: string;
	title?: string;
	metadata?: any;
	children: (StoryFile | StoryFolder)[];
}

export interface StoryData {
	story: any;
	files: StoryFile[];
	chapters: StoryFile[];
	characters: StoryFile[];
	notes: StoryFolder[];
}

function extractTitle(content: string): string {
	const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
	if (frontmatterMatch) {
		const frontmatter = frontmatterMatch[1];
		const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
		if (titleMatch) {
			return titleMatch[1].trim();
		}
	}

	try {
		const yamlData = parseYaml(content);
		if (yamlData?.title) {
			return yamlData.title;
		}
	} catch (e) {
		// Not valid YAML
	}

	return '';
}

function parseMetadata(content: string): any {
	const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
	if (frontmatterMatch) {
		try {
			return parseYaml(frontmatterMatch[1]);
		} catch (e) {
			return {};
		}
	}

	try {
		return parseYaml(content);
	} catch (e) {
		return {};
	}
}

function buildFolderStructure(files: StoryFile[], basePath: string): StoryFolder[] {
	const rootFolder: StoryFolder = {
		name: '',
		path: basePath,
		children: []
	};

	const notesFiles = files.filter(f => f.path.startsWith(basePath) && !f.isDirectory);
	
	for (const file of notesFiles) {
		const relativePath = file.path.substring(basePath.length);
		const parts = relativePath.split('/').filter(p => p);

		if (parts.length <= 1) continue;

		let currentFolder = rootFolder;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			
			let nextFolder = currentFolder.children.find(child => 
				'children' in child && child.name === part
			) as StoryFolder;
			
			if (!nextFolder) {
				nextFolder = {
					name: part,
					path: basePath + parts.slice(0, i + 1).join('/') + '/',
					children: []
				};
				currentFolder.children.push(nextFolder);
			}
			
			currentFolder = nextFolder;
		}
	}

	for (const file of notesFiles) {
		const relativePath = file.path.substring(basePath.length);
		const parts = relativePath.split('/').filter(p => p);

		if (parts.length === 0) continue;

		if (parts.length === 1) {
			if (!parts[0].endsWith('.yml')) {
				rootFolder.children.push(file);
			}
			continue;
		}

		let currentFolder = rootFolder;
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			
			currentFolder = currentFolder.children.find(child => 
				'children' in child && child.name === part
			) as StoryFolder;
		}

		const lastPart = parts[parts.length - 1];
		
		if (lastPart.endsWith('.yml')) {
			if (currentFolder !== rootFolder) {
				currentFolder.title = extractTitle(file.content);
				currentFolder.metadata = parseMetadata(file.content);
			}
		} else {
			currentFolder.children.push(file);
		}
	}

	function sortChildren(folder: StoryFolder) {
		folder.children.sort((a, b) => {
			const aIsFolder = 'children' in a;
			const bIsFolder = 'children' in b;
			
			if (aIsFolder && !bIsFolder) return -1;
			if (!aIsFolder && bIsFolder) return 1;
			
			return a.name.localeCompare(b.name);
		});
		
		for (const child of folder.children) {
			if ('children' in child) {
				sortChildren(child);
			}
		}
	}
	
	sortChildren(rootFolder);
	
	return rootFolder.children as StoryFolder[];
}

export async function readStoryFile(file: File): Promise<StoryData> {
	const zip = new JSZip();
	const zipContent = await zip.loadAsync(file);

	const files: StoryFile[] = [];
	let storyData = null;

	for (const [relativePath, zipObject] of Object.entries(zipContent.files)) {
		if (zipObject.dir) {
			files.push({
				name: relativePath.split('/').pop() || relativePath,
				path: relativePath,
				content: '',
				isDirectory: true
			});
		} else {
			const content = await zipObject.async('text');
			const title = extractTitle(content);
			const metadata = parseMetadata(content);

			const fileData = {
				name: relativePath.split('/').pop() || relativePath,
				path: relativePath,
				content,
				isDirectory: false,
				title,
				metadata
			};

			files.push(fileData);

			if (relativePath === 'story.yml') {
				try {
					storyData = parseYaml(content);
				} catch (e) {
					console.error('Failed to parse story.yml:', e);
				}
			}
		}
	}

	const chapters = files.filter(f => f.path.startsWith('chapters/') && !f.isDirectory);
	const characters = files.filter(f => f.path.startsWith('characters/') && !f.isDirectory);
	const notes = buildFolderStructure(files, 'notes/');

	return {
		story: storyData,
		files,
		chapters,
		characters,
		notes
	};
}
