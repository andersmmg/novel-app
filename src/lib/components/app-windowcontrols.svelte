<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import Button from "./ui/button/button.svelte";
  import { Maximize2Icon, Minimize2, MinusIcon, XIcon } from "@lucide/svelte";

  const appWindow = getCurrentWindow();
</script>

<div class="flex items-center ml-auto">
  <Button variant="ghost" size="icon-sm" onclick={() => appWindow.minimize()}>
    <MinusIcon />
  </Button>
  <Button
    variant="ghost"
    size="icon-sm"
    onclick={() => appWindow.toggleMaximize()}
  >
    <Maximize2Icon />
  </Button>
  <Button
    variant="ghost"
    size="icon-sm"
    class="hover:text-white hover:bg-red-400 dark:hover:bg-red-500"
    onclick={() => appWindow.close()}
  >
    <XIcon />
  </Button>
</div>
