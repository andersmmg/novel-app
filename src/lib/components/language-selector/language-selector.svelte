<script lang="ts">
	import * as Select from "$lib/components/ui/select";

	let {
		availableLanguages = ["en_US", "tok"],
		currentLanguage = "en_US",
		onLanguageChange,
		id = "spellcheck-language",
	}: {
		availableLanguages?: string[];
		currentLanguage?: string;
		onLanguageChange: (newLang: string) => void;
		id?: string;
	} = $props();

	const languageMap: Record<string, { name: string; nativeName?: string }> = {
		en_US: { name: "English (US)", nativeName: "English" },
		tok: { name: "Toki Pona", nativeName: "Toki Pona" },
	};

	const languages = $derived(
		availableLanguages
			.map((code) => ({
				code,
				...languageMap[code],
			}))
			.filter(Boolean),
	);

	function handleLanguageChange(language: string) {
		onLanguageChange(language);
	}
</script>

<Select.Root
	type="single"
	onValueChange={(value) => handleLanguageChange(value)}
>
	<Select.Trigger class="w-45" {id}>
		<span
			>{languages.find((l) => l.code === currentLanguage)?.nativeName ||
				languages.find((l) => l.code === currentLanguage)?.name ||
				currentLanguage}</span
		>
	</Select.Trigger>
	<Select.Content>
		{#each languages as language}
			<Select.Item value={language.code}
				>{language.nativeName || language.name}</Select.Item
			>
		{/each}
	</Select.Content>
</Select.Root>
