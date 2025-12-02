import { type } from "@tauri-apps/plugin-os";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const osType = type();

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function ctrlShortcut(key: string) {
	if (osType === "macos") {
		return `⌘ ${key}`;
	} else {
		return `Ctrl+${key}`;
	}
}

export function formatDate(date: Date | undefined): string {
	if (typeof date === "string") {
		date = new Date(date);
	}
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		return "Unknown date";
	}

	try {
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(date);
	} catch (error) {
		return "Invalid date";
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
	? Omit<T, "children">
	: T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};
