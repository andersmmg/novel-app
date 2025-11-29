<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import * as Sidebar from "$lib/components/ui/sidebar";

  let { children } = $props();
  import "../app.css";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import AppMenubar from "$lib/components/app-menubar.svelte";

  let sidebarOpen = $state(true);
</script>

<ModeWatcher />
<AppMenubar bind:sidebarOpen />

<Sidebar.Provider open={sidebarOpen} class="min-h-[calc(100svh-2.25rem)]">
  <AppSidebar />
  <Sidebar.Inset class="w-full">
    {@render children?.()}
  </Sidebar.Inset>
</Sidebar.Provider>
