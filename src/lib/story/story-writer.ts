import JSZip from "jszip";
import { stringify as stringifyYaml } from "yaml";
import { Story } from "./story";
import type { StoryFile, StoryFolder } from "./story";

function convertDatesToStrings(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToStrings);
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if ((key === 'created' || key === 'edited') && value instanceof Date) {
      result[key] = value.toISOString();
    } else if (typeof value === 'object') {
      result[key] = convertDatesToStrings(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

export async function saveStory(story: Story): Promise<Blob> {
  const zip = new JSZip();

  if (story.metadata && Object.keys(story.metadata).length > 0) {
    const updatedMetadata = {
      ...story.metadata,
      edited: new Date()
    };
    zip.file("story.yml", stringifyYaml(convertDatesToStrings(updatedMetadata)));
  }

  for (const chapter of story.chapters) {
    zip.file(chapter.path, addFrontmatterIfNeeded(chapter));
  }

  for (const character of story.characters) {
    zip.file(character.path, addFrontmatterIfNeeded(character));
  }

  saveNotesToZip(zip, story.notes, story.rootNotes);

  return await zip.generateAsync({ type: "blob" });
}

function saveNotesToZip(
  zip: JSZip,
  folders: StoryFolder[],
  rootFiles: StoryFile[],
): void {
  for (const file of rootFiles) {
    zip.file(file.path, addFrontmatterIfNeeded(file));
  }

  for (const folder of folders) {
    saveFolderToZip(zip, folder);
  }
}

function saveFolderToZip(zip: JSZip, folder: StoryFolder): void {
  if (folder.metadata && Object.keys(folder.metadata).length > 0) {
    zip.file(folder.path + "folder.yml", stringifyYaml(folder.metadata));
  }

  for (const child of folder.children) {
    if ("children" in child) {
      saveFolderToZip(zip, child);
    } else {
      zip.file(child.path, addFrontmatterIfNeeded(child));
    }
  }
}

function addFrontmatterIfNeeded(file: StoryFile): string {
  const hasDates = file.created || file.edited;
  const hasMetadata = file.metadata && Object.keys(file.metadata).length > 0;
  
  if (!hasDates && !hasMetadata) {
    return file.content;
  }

  if (file.content.startsWith("---\n")) {
    return file.content;
  }

  const metadata: any = { ...file.metadata };
  if (file.created) metadata.created = file.created;
  if (file.edited) metadata.edited = file.edited;

  const frontmatter = stringifyYaml(convertDatesToStrings(metadata));
  return `---\n${frontmatter}\n---\n\n${file.content}`;
}

export async function downloadStory(
  story: Story,
  filename?: string,
): Promise<void> {
  const blob = await saveStory(story);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${story.metadata.title || "story"}.story`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function createEmptyStory(title?: string): Story {
  const now = new Date();
  return new Story({
    title: title || "Untitled Story",
    author: "",
    genre: "",
    description: "",
    created: now,
    edited: now,
  });
}

export function createChapter(title: string, content: string = ""): StoryFile {
  const filename = sanitizeFilename(title) + ".md";
  const path = `chapters/${filename}`;
  const now = new Date();

  return {
    name: filename,
    path,
    content,
    title,
    created: now,
    edited: now,
    metadata: {
      title,
    },
  };
}

export function createCharacter(
  name: string,
  description: string = "",
): StoryFile {
  const filename = sanitizeFilename(name) + ".md";
  const path = `characters/${filename}`;
  const now = new Date();

  return {
    name: filename,
    path,
    content: description,
    title: name,
    created: now,
    edited: now,
    metadata: {
      title: name,
    },
  };
}

export function createNote(title: string, content: string = ""): StoryFile {
  const filename = sanitizeFilename(title) + ".md";
  const path = `notes/${filename}`;
  const now = new Date();

  return {
    name: filename,
    path,
    content,
    title,
    created: now,
    edited: now,
    metadata: {
      title,
    },
  };
}

export function createNoteFolder(title: string, name?: string): StoryFolder {
  const folderName = name || sanitizeFilename(title);
  const path = `notes/${folderName}/`;

  return {
    name: folderName,
    path,
    title,
    metadata: {
      title,
      created: new Date(),
    },
    children: [],
  };
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
