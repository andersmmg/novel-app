<script lang="ts">
  import * as Menubar from "$lib/components/ui/menubar";
  import { mode, resetMode, setMode } from "mode-watcher";
  import PanelLeftIcon from "@lucide/svelte/icons/panel-left";
  import Button from "./ui/button/button.svelte";
  import AppWindowcontrols from "./app-windowcontrols.svelte";
  import { isTauriDesktop } from "$lib/is-tauri";

  let { sidebarOpen = $bindable(true) } = $props();
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
        <Menubar.Item>
          New Tab <Menubar.Shortcut>⌘T</Menubar.Shortcut>
        </Menubar.Item>
        <Menubar.Item>
          New Window <Menubar.Shortcut>⌘N</Menubar.Shortcut>
        </Menubar.Item>
        <Menubar.Item>New Incognito Window</Menubar.Item>
        <Menubar.Separator />
        <Menubar.Item>
          Print... <Menubar.Shortcut>⌘P</Menubar.Shortcut>
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
        <Menubar.Sub>
          <Menubar.SubTrigger>Find</Menubar.SubTrigger>
          <Menubar.SubContent>
            <Menubar.Item>Search the web</Menubar.Item>
            <Menubar.Separator />
            <Menubar.Item>Find...</Menubar.Item>
            <Menubar.Item>Find Next</Menubar.Item>
            <Menubar.Item>Find Previous</Menubar.Item>
          </Menubar.SubContent>
        </Menubar.Sub>
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
              checked={mode.current === "light"}>Light</Menubar.CheckboxItem
            >
            <Menubar.CheckboxItem
              value="dark"
              onclick={() => setMode("dark")}
              checked={mode.current === "dark"}>Dark</Menubar.CheckboxItem
            >
            <Menubar.CheckboxItem
              value="system"
              onclick={() => resetMode()}
              checked={mode.current === undefined}>System</Menubar.CheckboxItem
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
