<script lang='ts'>
	import { getCurrentWindow } from '@tauri-apps/api/window'
	import Maximize2Icon from 'virtual:icons/lucide/maximize2'
	import MinusIcon from 'virtual:icons/lucide/minus'

	import XIcon from 'virtual:icons/lucide/x'
	import Button from './ui/button/button.svelte'

	const appWindow = getCurrentWindow()
</script>

<div class='flex items-center ml-auto z-100 pointer-events-auto'>
	<Button
		variant='ghost'
		size='icon-sm'
		class='rounded-full'
		onclick={() => appWindow.minimize()}
	>
		<MinusIcon />
	</Button>
	<Button
		variant='ghost'
		size='icon-sm'
		class='rounded-full'
		onclick={() => appWindow.toggleMaximize()}
	>
		<Maximize2Icon />
	</Button>
	<Button
		variant='ghost'
		size='icon-sm'
		class='hover:text-white hover:bg-red-400 dark:hover:bg-red-600 rounded-full'
		onclick={() => appWindow.close()}
	>
		<XIcon />
	</Button>
</div>
