export interface StoryFile {
	id: string;
	name: string;
	path: string;
	content: string;
	title?: string;
	created?: Date;
	edited?: Date;
	order?: number;
	metadata?: any;
}

export interface StoryFolder {
	id: string;
	name: string;
	path: string;
	title?: string;
	metadata?: any;
	children: (StoryFile | StoryFolder)[];
}

export interface StoryGoal {
	enabled: boolean;
	target: number;
}

export interface StoryMetadata {
	title?: string;
	author?: string;
	genre?: string;
	description?: string;
	created?: Date;
	edited?: Date;
	wordCount?: number;
	quoteCount?: number;
	paragraphCount?: number;
	goals?: {
		words?: StoryGoal;
		chapters?: StoryGoal;
		notes?: StoryGoal;
		quotes?: StoryGoal;
		paragraphs?: StoryGoal;
	};
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
	wordCount?: number;
	quoteCount?: number;
	paragraphCount?: number;
}

export interface StoryData {
	stories: StoryListItem[];
	storiesMap: Map<string, Story>;
}
