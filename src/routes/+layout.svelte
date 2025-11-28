<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import * as Sidebar from "$lib/components/ui/sidebar";

  let { children } = $props();
  import "../app.css";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import AppMenubar from "$lib/components/app-menubar.svelte";
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  let sidebarOpen = $state(true);
  let sidebarPane: ReturnType<typeof Resizable.Pane>;

  $effect(() => {
    if (sidebarOpen) {
      sidebarPane?.expand();
    } else {
      sidebarPane?.collapse();
    }
  });
</script>

<ModeWatcher />
  <AppMenubar bind:sidebarOpen />

  <main class="w-full h-[calc(100svh-2.5rem)]">
    <Resizable.PaneGroup direction="horizontal">
      <Resizable.Pane
        defaultSize={25}
        collapsible={true}
        bind:this={sidebarPane}
        onCollapse={() => (sidebarOpen = false)}
        onExpand={() => (sidebarOpen = true)}
      >
        <AppSidebar />
      </Resizable.Pane>
      <Resizable.Handle />
      <Resizable.Pane defaultSize={75} class="overflow-y-auto">
        {@render children?.()}
      </Resizable.Pane>
    </Resizable.PaneGroup>
  </main>
