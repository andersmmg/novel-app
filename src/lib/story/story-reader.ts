import JSZip from "jszip";
import { parse as parseYaml } from "yaml";
import { Story } from "./story";
import type { StoryFile, StoryFolder } from "./story";

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
  } catch (e) {}

  return "";
}

function parseMetadata(content: string): any {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (frontmatterMatch) {
    try {
      return convertDates(parseYaml(frontmatterMatch[1]));
    } catch (e) {
      return {};
    }
  }

  try {
    return convertDates(parseYaml(content));
  } catch (e) {
    return {};
  }
}

function convertDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(convertDates);
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if ((key === 'created' || key === 'edited') && typeof value === 'string') {
      result[key] = new Date(value);
    } else if (typeof value === 'object') {
      result[key] = convertDates(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

function buildFolderStructure(
  files: (StoryFile & { isDirectory: boolean })[],
  basePath: string,
): { folders: StoryFolder[]; rootFiles: StoryFile[] } {
  const rootFolder: StoryFolder = {
    name: "",
    path: basePath,
    children: [],
  };

  const notesFiles = files.filter(
    (f) => f.path.startsWith(basePath) && !f.isDirectory,
  );

  for (const file of notesFiles) {
    const relativePath = file.path.substring(basePath.length);
    const parts = relativePath.split("/").filter((p) => p);

    if (parts.length <= 1) continue;

    let currentFolder = rootFolder;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      let nextFolder = currentFolder.children.find(
        (child) => "children" in child && child.name === part,
      ) as StoryFolder;

      if (!nextFolder) {
        nextFolder = {
          name: part,
          path: basePath + parts.slice(0, i + 1).join("/") + "/",
          children: [],
        };
        currentFolder.children.push(nextFolder);
      }

      currentFolder = nextFolder;
    }
  }

  for (const file of notesFiles) {
    const relativePath = file.path.substring(basePath.length);
    const parts = relativePath.split("/").filter((p) => p);

    if (parts.length === 0) continue;

    if (parts.length === 1) {
      if (!parts[0].endsWith(".yml")) {
        rootFolder.children.push(file);
      }
      continue;
    }

    let currentFolder = rootFolder;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      currentFolder = currentFolder.children.find(
        (child) => "children" in child && child.name === part,
      ) as StoryFolder;
    }

    const lastPart = parts[parts.length - 1];

    if (lastPart.endsWith(".yml")) {
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
      const aIsFolder = "children" in a;
      const bIsFolder = "children" in b;

      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;

      return a.name.localeCompare(b.name);
    });

    for (const child of folder.children) {
      if ("children" in child) {
        sortChildren(child);
      }
    }
  }

  sortChildren(rootFolder);

  // Separate root files from folders
  const rootFiles: StoryFile[] = [];
  const folders: StoryFolder[] = [];

  for (const child of rootFolder.children) {
    if ("children" in child) {
      folders.push(child);
    } else {
      rootFiles.push(child);
    }
  }

  return { folders, rootFiles };
}

export async function readStoryFile(file: File): Promise<Story> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  const files: (StoryFile & { isDirectory: boolean })[] = [];
  let storyMetadata = null;

  for (const [relativePath, zipObject] of Object.entries(zipContent.files)) {
    if (zipObject.dir) {
      files.push({
        name: relativePath.split("/").pop() || relativePath,
        path: relativePath,
        content: "",
        isDirectory: true,
      } as StoryFile & { isDirectory: boolean });
    } else {
      const content = await zipObject.async("text");
      const title = extractTitle(content);
      const metadata = parseMetadata(content);

      const fileData: StoryFile & { isDirectory: boolean } = {
        name: relativePath.split("/").pop() || relativePath,
        path: relativePath,
        content,
        isDirectory: false,
        title,
        metadata,
        created: metadata.created || metadata.edited ? new Date(metadata.created || metadata.edited) : undefined,
        edited: metadata.edited ? new Date(metadata.edited) : undefined,
      };

      files.push(fileData);

      if (relativePath === "story.yml") {
        try {
          storyMetadata = parseYaml(content);
        } catch (e) {
          console.error("Failed to parse story.yml:", e);
        }
      }
    }
  }

  const story = new Story(storyMetadata);

  // Add chapters
  const chapters = files.filter(
    (f) => f.path.startsWith("chapters/") && !f.isDirectory,
  );
  for (const chapter of chapters) {
    const { isDirectory, ...chapterFile } = chapter;
    story.addChapter(chapterFile);
  }

  // Add characters
  const characters = files.filter(
    (f) => f.path.startsWith("characters/") && !f.isDirectory,
  );
  for (const character of characters) {
    const { isDirectory, ...characterFile } = character;
    story.addCharacter(characterFile);
  }

  // Build and add notes structure
  const { folders: noteFolders, rootFiles: rootNotes } = buildFolderStructure(
    files,
    "notes/",
  );
  for (const folder of noteFolders) {
    story.addNoteFolder(folder);
  }
  for (const rootNote of rootNotes) {
    story.addRootNote(rootNote);
  }

  return story;
}
