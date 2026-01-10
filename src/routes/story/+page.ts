import type { PageLoad } from './$types'
import { appState } from '$lib/app-state.svelte'
import { redirect } from '@sveltejs/kit'

export const load: PageLoad = () => {
	if (!appState.selectedStory) {
		redirect(307, '/')
	}
}
