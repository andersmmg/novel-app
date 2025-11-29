<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import {
		Book,
		FileText,
		Users,
		Settings,
		PenTool,
		Bookmark,
		Search,
		House,
		Folder,
		FolderOpen,
		File,
	} from "@lucide/svelte";

	let notesOpen = false;
	let subFolder1Open = false;
	let subFolder2Open = false;
	let subFolder3Open = false;

	function toggleNotes() {
		notesOpen = !notesOpen;
	}

	function toggleSubFolder1() {
		subFolder1Open = !subFolder1Open;
	}

	function toggleSubFolder2() {
		subFolder2Open = !subFolder2Open;
	}

	function toggleSubFolder3() {
		subFolder3Open = !subFolder3Open;
	}
</script>

<Sidebar.Root class="mt-9 max-h-[calc(100svh-2.25rem)]">
	<Sidebar.Content class="border-l border-b  overflow-x-hidden">
		<!-- My Novels -->
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="/" {...props}>
									<Book class="size-4" />
									<span>My Novels</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- Story Elements Group -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>Story Elements</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="/test" {...props}>
									<FileText class="size-4" />
									<span>Chapters</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="/characters" {...props}>
									<Users class="size-4" />
									<span>Characters</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<button
							class="w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-sidebar-accent rounded-md"
							onclick={toggleNotes}
						>
							{#if notesOpen}
								<FolderOpen class="size-4" />
							{:else}
								<Folder class="size-4" />
							{/if}
							<span>Notes</span>
						</button>
					</Sidebar.MenuItem>
				</Sidebar.Menu>

				{#if notesOpen}
					<Sidebar.Menu class="ml-2">
						<Sidebar.MenuItem>
							<Sidebar.MenuButton size="sm">
								{#snippet child({ props })}
									<a href="/editor" {...props}>
										<FileText class="size-4" />
										<span>Ideas</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>

						<Sidebar.MenuItem>
							<button
								class="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-sidebar-accent rounded-md"
								onclick={toggleSubFolder1}
							>
								{#if subFolder1Open}
									<FolderOpen class="size-4" />
								{:else}
									<Folder class="size-4" />
								{/if}
								<span>Magic</span>
							</button>
						</Sidebar.MenuItem>

						{#if subFolder1Open}
							<Sidebar.Menu class="ml-4">
								<Sidebar.MenuItem>
									<Sidebar.MenuButton size="sm">
										{#snippet child({ props })}
											<a href="#" {...props}>
												<FileText class="size-4" />
												<span>Spells</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>

								<Sidebar.MenuItem>
									<button
										class="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-sidebar-accent rounded-md"
										onclick={toggleSubFolder2}
									>
										{#if subFolder2Open}
											<FolderOpen class="size-4" />
										{:else}
											<Folder class="size-4" />
										{/if}
										<span>Elements</span>
									</button>
								</Sidebar.MenuItem>

								{#if subFolder2Open}
									<Sidebar.Menu class="ml-4">
										<Sidebar.MenuItem>
											<Sidebar.MenuButton size="sm">
												{#snippet child({ props })}
													<a href="#" {...props}>
														<FileText
															class="size-4"
														/>
														<span>Earth</span>
													</a>
												{/snippet}
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									</Sidebar.Menu>
								{/if}
							</Sidebar.Menu>
						{/if}

						<Sidebar.MenuItem>
							<button
								class="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-sidebar-accent rounded-md"
								onclick={toggleSubFolder3}
							>
								{#if subFolder3Open}
									<FolderOpen class="size-4" />
								{:else}
									<Folder class="size-4" />
								{/if}
								<span>Locations</span>
							</button>
						</Sidebar.MenuItem>

						{#if subFolder3Open}
							<Sidebar.Menu class="ml-4">
								<Sidebar.MenuItem>
									<Sidebar.MenuButton size="sm">
										{#snippet child({ props })}
											<a href="#" {...props}>
												<FileText class="size-4" />
												<span>House</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						{/if}
					</Sidebar.Menu>
				{/if}
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- Writing Tools -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>Writing Tools</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="/editor" {...props}>
									<PenTool class="size-4" />
									<span>Editor</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="/search" {...props}>
									<Search class="size-4" />
									<span>Search</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="/bookmarks" {...props}>
									<Bookmark class="size-4" />
									<span>Bookmarks</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- System -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>System</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="/settings" {...props}>
									<Settings class="size-4" />
									<span>Settings</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Footer>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<span
						class="text-xs text-muted-foreground p-2 cursor-default"
						>v{__APP_VERSION__}</span
					>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Footer>
	</Sidebar.Content>
</Sidebar.Root>
