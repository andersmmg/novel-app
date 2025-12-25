<script lang="ts">
	import { goto } from "$app/navigation";
	import { appState, saveCurrentStory } from "$lib/app-state.svelte";
	import { startAutosave } from "$lib/autosave";
	import * as Menubar from "$lib/components/ui/menubar";
	import { useSidebar } from "$lib/components/ui/sidebar";
	import { isTauriDesktop } from "$lib/is-tauri";
	import { ctrlShortcut } from "$lib/utils";
	import PanelLeftIcon from "@lucide/svelte/icons/panel-left";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { onMount } from "svelte";
	import Time from "svelte-time/Time.svelte";
	import AppWindowcontrols from "./app-windowcontrols.svelte";
	import ExportDialog from "./export-dialog/export-dialog.svelte";
	import Button from "./ui/button/button.svelte";

	const sidebar = useSidebar();
	const appWindow = getCurrentWindow();

	async function handleSave() {
		if (appState.selectedStory) {
			await saveCurrentStory();
			startAutosave();
		}
	}

	let showExportDialog = $state(false);

	async function handleExport() {
		if (!appState.selectedStory) return;
		showExportDialog = true;
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			handleSave();
		} else if ((e.ctrlKey || e.metaKey) && e.key === "e") {
			e.preventDefault();
			handleExport();
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

<Menubar.Root class="rounded-none select-none" data-tauri-drag-region>
	<div class="flex items-center">
		<Button variant="ghost" size="icon-sm" onclick={() => sidebar.toggle()}>
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
				<Menubar.Item
					disabled={!appState.selectedStory}
					onclick={handleExport}
				>
					Export Story <Menubar.Shortcut
						>{ctrlShortcut("E")}</Menubar.Shortcut
					>
				</Menubar.Item>
				<Menubar.Item>
					Exit <Menubar.Shortcut>{ctrlShortcut("Q")}</Menubar.Shortcut
					>
				</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>Debug</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item onclick={() => goto("/test")}>
					Test Pages
				</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		{#if appState.selectedStory}
			<span class="ml-2 flex items-center gap-2 pointer-none">
				<span
					class="inline-block w-2 h-2 rounded-full ml-1"
					class:bg-yellow-500={appState.isDirty}
					class:bg-green-500={!appState.isDirty}
					data-tauri-drag-region
				></span>
				<span
					class="text-xs text-muted-foreground"
					data-tauri-drag-region
				>
					saved <Time
						data-tauri-drag-region
						relative
						title=""
						live={1 * 1_000}
						timestamp={appState.lastSavedAt}
					/></span
				>
			</span>
		{/if}
	</div>
	{#if isTauriDesktop}
		<AppWindowcontrols />
	{/if}

	{#if showExportDialog && appState.selectedStory}
		<ExportDialog
			story={appState.selectedStory}
			onClose={() => (showExportDialog = false)}
		/>
	{/if}
</Menubar.Root>
