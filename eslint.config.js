import antfu from '@antfu/eslint-config'

export default antfu(
	{
		isInEditor: false,
		formatters: true,
		svelte: true,
		jsonc: true,
		stylistic: {
			indent: 'tab',
			quotes: 'single',
		},
	},
	{
		rules: {
			'regexp/no-super-linear-backtracking': 'off',
		},
	},
	{
		files: ['**/*.svelte*'],
		rules: {
			'no-unused-expressions': 'off',
		},
	},
)
