<script lang="ts">
	import AppMenubar from "$lib/components/app-menubar.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import { useSidebar } from "$lib/components/ui/sidebar";

	let { children } = $props();

	const sidebar = useSidebar();
	function toggleSidebar() {
		sidebar.toggle();
	}
</script>

<Sidebar.Provider>
	<AppMenubar />
	<div
		class="min-h-[calc(100svh-2.25rem)] max-h-[calc(100svh-2.25rem)] w-full flex overflow-y-hidden"
	>
		<AppSidebar />
		<Sidebar.Inset
			class="w-full overflow-y-auto max-h-full border-t-0 border-l-0 border-b border-r"
		>
			{@render children?.()}
		</Sidebar.Inset>
	</div>
</Sidebar.Provider>
