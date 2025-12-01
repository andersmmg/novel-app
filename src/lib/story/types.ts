export interface StoryFile {
	name: string;
	path: string;
	content: string;
	title?: string;
	created?: Date;
	edited?: Date;
	metadata?: any;
}

export interface StoryFolder {
	name: string;
	path: string;
	title?: string;
	metadata?: any;
	children: (StoryFile | StoryFolder)[];
}

export interface StoryMetadata {
	title?: string;
	author?: string;
	genre?: string;
	description?: string;
	created?: Date;
	edited?: Date;
	[key: string]: any;
}

import type { Story } from "./story-class";

export interface StoryListItem {
	title: string;
	author?: string;
	genre?: string;
	description?: string;
	created: Date;
	edited: Date;
	path: string;
	id: string;
	isDirectory: boolean;
}

export interface StoryData {
	stories: StoryListItem[];
	storiesMap: Map<string, Story>;
}
