import { appState } from "$lib/app-state.svelte";
import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
	if (!appState.selectedStory) {
		redirect(307, "/");
	}
};
