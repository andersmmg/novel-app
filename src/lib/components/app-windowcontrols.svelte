<script lang="ts">
	import { Maximize2Icon, MinusIcon, XIcon } from "@lucide/svelte";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import Button from "./ui/button/button.svelte";

	const appWindow = getCurrentWindow();
</script>

<div class="flex items-center ml-auto z-100 pointer-events-auto">
	<Button
		variant="ghost"
		size="icon-sm"
		class="rounded-full"
		onclick={() => appWindow.minimize()}
	>
		<MinusIcon />
	</Button>
	<Button
		variant="ghost"
		size="icon-sm"
		class="rounded-full"
		onclick={() => appWindow.toggleMaximize()}
	>
		<Maximize2Icon />
	</Button>
	<Button
		variant="ghost"
		size="icon-sm"
		class="hover:text-white hover:bg-red-400 dark:hover:bg-red-600 rounded-full"
		onclick={() => appWindow.close()}
	>
		<XIcon />
	</Button>
</div>
