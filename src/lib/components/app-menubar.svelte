<script lang="ts">
	import { appState, saveCurrentStory } from "$lib/app-state.svelte";
	import * as Menubar from "$lib/components/ui/menubar";
	import { isTauriDesktop } from "$lib/is-tauri";
	import { ctrlShortcut } from "$lib/utils";
	import PanelLeftIcon from "@lucide/svelte/icons/panel-left";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { mode, resetMode, setMode } from "mode-watcher";
	import { onMount } from "svelte";
	import AppWindowcontrols from "./app-windowcontrols.svelte";
	import Button from "./ui/button/button.svelte";

	let { sidebarOpen = $bindable(true) } = $props();
	const appWindow = getCurrentWindow();

	async function handleSave() {
		if (appState.selectedStory) {
			await saveCurrentStory();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			handleSave();
		} else if ((e.ctrlKey || e.metaKey) && e.key === "q") {
			e.preventDefault();
			appWindow.close();
		}
	}

	onMount(() => {
		if (typeof window !== "undefined") {
			window.addEventListener("keydown", handleKeydown);
			return () => {
				window.removeEventListener("keydown", handleKeydown);
			};
		}
	});
</script>

<Menubar.Root class="rounded-none" data-tauri-drag-region>
	<div class="flex items-center">
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={() => (sidebarOpen = !sidebarOpen)}
		>
			<PanelLeftIcon />
		</Button>
		<Menubar.Menu>
			<Menubar.Trigger>File</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item
					disabled={!appState.selectedStory}
					onclick={handleSave}
				>
					Save Story <Menubar.Shortcut
						>{ctrlShortcut("S")}</Menubar.Shortcut
					>
				</Menubar.Item>
				<Menubar.Item>
					Exit <Menubar.Shortcut>{ctrlShortcut("Q")}</Menubar.Shortcut
					>
				</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>Edit</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item>
					Undo <Menubar.Shortcut>⌘Z</Menubar.Shortcut>
				</Menubar.Item>
				<Menubar.Item>
					Redo <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut>
				</Menubar.Item>
				<Menubar.Separator />
				<Menubar.Item>Cut</Menubar.Item>
				<Menubar.Item>Copy</Menubar.Item>
				<Menubar.Item>Paste</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>View</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Sub>
					<Menubar.SubTrigger>Theme</Menubar.SubTrigger>
					<Menubar.SubContent>
						<Menubar.CheckboxItem
							value="light"
							onclick={() => setMode("light")}
							checked={mode.current === "light"}
							>Light</Menubar.CheckboxItem
						>
						<Menubar.CheckboxItem
							value="dark"
							onclick={() => setMode("dark")}
							checked={mode.current === "dark"}
							>Dark</Menubar.CheckboxItem
						>
						<Menubar.CheckboxItem
							value="system"
							onclick={() => resetMode()}
							checked={mode.current === undefined}
							>System</Menubar.CheckboxItem
						>
					</Menubar.SubContent>
				</Menubar.Sub>
			</Menubar.Content>
		</Menubar.Menu>
	</div>
	{#if isTauriDesktop}
		<AppWindowcontrols />
	{/if}
</Menubar.Root>
