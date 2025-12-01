import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type } from "@tauri-apps/plugin-os";

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
