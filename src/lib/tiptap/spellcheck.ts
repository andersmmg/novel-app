import { configStore } from '$lib/config'
import { invoke } from '@tauri-apps/api/core'
import { resolveResource } from '@tauri-apps/api/path'
import { info } from '@tauri-apps/plugin-log'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Mapping } from '@tiptap/pm/transform'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		spellCheck: {
			/**
			 * @description Toggle spellcheck on/off.
			 */
			toggleSpellcheck: () => ReturnType
			/**
			 * @description Set spellcheck enabled state.
			 */
			setSpellcheckEnabled: (enabled: boolean) => ReturnType
		}
	}
	interface Storage {
		spellCheck: {
			errorCount: number
			customWords: string[]
			getSuggestions: (word: string) => Promise<string[]>
			addWord: (word: string) => void
			proofreader: Proofreader | null
			getAvailableLanguages: () => Promise<string[]>
			switchLanguage: (language: string) => Promise<void>
			enabled: boolean
		}
	}
}

export interface WordList {
	[word: string]: number
}

export interface ITextWithPosition {
	offset: number
	length: number
	word: string
}

export class Proofreader {
	private language: string
	private isInitialized: boolean = false
	private customWords: string[] = []

	constructor(language: string = 'en_US') {
		this.language = language
	}

	get initialized() {
		return this.isInitialized
	}

	get currentLanguage() {
		return this.language
	}

	setLanguage(language: string) {
		if (this.language !== language) {
			this.language = language
			this.isInitialized = false
		}
	}

	async getAvailableLanguages(): Promise<string[]> {
		try {
			return await invoke<string[]>('get_available_languages')
		}
		catch (e) {
			console.error('Failed to get available languages:', e)
			return ['en_US']
		}
	}

	async initialize(): Promise<void> {
		if (this.isInitialized)
			return

		try {
			const resourcePath = await resolveResource('dictionaries')
			const affPath = `${resourcePath}/${this.language}.aff`
			const dicPath = `${resourcePath}/${this.language}.dic`

			await this.loadCustomWords()

			await invoke('init_spell_check', {
				affPath,
				dicPath,
				customWords: this.customWords,
			})

			this.isInitialized = true
			info('Rust SpellCheck initialized')
		}
		catch (e) {
			console.error('Failed to init Rust spell check:', e)
			throw e
		}
	}

	async getSuggestions(word: string): Promise<string[]> {
		if (!this.isInitialized) {
			await this.initialize()
		}

		try {
			return await invoke<string[]>('get_suggestions', { word })
		}
		catch (e) {
			console.error('Failed to get suggestions:', e)
			return []
		}
	}

	normalizeTextForLanguage(text: string): string {
		return text.toLowerCase()
	}

	async proofreadText(sentence: string): Promise<ITextWithPosition[]> {
		if (!this.isInitialized) {
			await this.initialize()
		}

		try {
			const result = await invoke<
				{
					word: string
					index: number
					length: number
				}[]
			>('check_text', { text: sentence })

			return result.map(error => ({
				offset: error.index,
				length: error.length,
				word: error.word,
			}))
		}
		catch (e) {
			console.error('Failed to check text:', e)
			return []
		}
	}

	async addWord(word: string): Promise<void> {
		this.customWords.push(word)
		this.saveCustomWords()

		if (this.isInitialized) {
			try {
				await invoke('add_custom_word', { word })
			}
			catch (e) {
				console.error('Failed to add custom word:', e)
			}
		}
	}

	private async loadCustomWords(): Promise<void> {
		const savedWords = (await configStore.getConfig()).spellcheck.customWords
		if (savedWords) {
			try {
				this.customWords = savedWords
			}
			catch (e) {
				console.error('Failed to load custom words:', e)
				this.customWords = []
			}
		}
	}

	private async saveCustomWords(): Promise<void> {
		const currentConfig = (await configStore.getConfig()).spellcheck
		try {
			await configStore.updateConfig({
				spellcheck: {
					customWords: this.customWords,
					enabled: currentConfig.enabled,
					language: currentConfig.language,
				},
			})
		}
		catch (e) {
			console.error('Failed to save custom words:', e)
		}
	}
}

function extractTextWithMap(doc: any) {
	info('Extracting text and mapping nodes')
	let text = ''
	const map: { from: number, to: number, offset: number, length: number }[]
		= []

	doc.descendants((node: any, pos: number) => {
		if (node.isText) {
			map.push({
				from: pos,
				to: pos + node.nodeSize,
				offset: text.length,
				length: node.text.length,
			})
			text += node.text
		}
		else if (node.isBlock) {
			if (text.length > 0 && !text.endsWith('\n')) {
				text += '\n'
			}
		}
		else if (node.isInline) {
			if (node.type.name === 'hardBreak') {
				text += '\n'
			}
			else {
				text += ' '
			}
		}
	})

	return { text, map }
}

export const SpellCheck = Extension.create({
	name: 'spellCheck',

	addOptions() {
		return {
			language: 'en_US',
			dictionaryPath: 'dictionaries',
			enabled: true,
		}
	},

	addStorage() {
		return {
			errorCount: 0,
			customWords: [] as string[],
			getSuggestions: (_word: string) => Promise.resolve([] as string[]),
			addWord: (_word: string) => {},
			proofreader: null as Proofreader | null,
			getAvailableLanguages: () => Promise.resolve([] as string[]),
			switchLanguage: (_language: string) => Promise.resolve(),
			enabled: true,
		}
	},

	addCommands() {
		return {
			toggleSpellcheck:
				() =>
					({ editor }) => {
						const storage = editor.storage.spellCheck
						storage.enabled = !storage.enabled

						if (storage.enabled) {
						// Re-initialize spellchecking when enabled
							const { view } = editor
							const requestId = Date.now().toString()
							const { text, map } = extractTextWithMap(
								view.state.doc,
							)
							view.dispatch(
								view.state.tr.setMeta('spellCheckStart', requestId),
							)

							if (storage.proofreader) {
								storage.proofreader
									.proofreadText(text)
									.then((result: any) => {
										view.dispatch(
											view.state.tr.setMeta(
												'spellCheckResult',
												{
													id: requestId,
													errors: result.map(
														(err: any) => ({
															word: err.word,
															index: err.offset,
															length: err.length,
														}),
													),
													textMap: map,
												},
											),
										)
										storage.errorCount = result.length
									})
							}
						}
						else {
						// Clear decorations when disabled
							const { view } = editor
							view.dispatch(
								view.state.tr.setMeta('spellCheckResult', {
									id: Date.now().toString(),
									errors: [],
									textMap: [],
									clearDecorations: true,
								}),
							)
							storage.errorCount = 0
						}

						return true
					},
			setSpellcheckEnabled:
				(enabled: boolean) =>
					({ editor }) => {
						const storage = editor.storage.spellCheck
						if (storage.enabled !== enabled) {
							storage.enabled = enabled

							if (enabled) {
							// Re-initialize spellchecking when enabled
								const { view } = editor
								const requestId = Date.now().toString()
								const { text, map } = extractTextWithMap(
									view.state.doc,
								)
								view.dispatch(
									view.state.tr.setMeta(
										'spellCheckStart',
										requestId,
									),
								)

								if (storage.proofreader) {
									storage.proofreader
										.proofreadText(text)
										.then((result: any) => {
											view.dispatch(
												view.state.tr.setMeta(
													'spellCheckResult',
													{
														id: requestId,
														errors: result.map(
															(err: any) => ({
																word: err.word,
																index: err.offset,
																length: err.length,
															}),
														),
														textMap: map,
													},
												),
											)
											storage.errorCount = result.length
										})
								}
							}
							else {
							// Clear decorations when disabled
								const { view } = editor
								view.dispatch(
									view.state.tr.setMeta('spellCheckResult', {
										id: Date.now().toString(),
										errors: [],
										textMap: [],
										clearDecorations: true,
									}),
								)
								storage.errorCount = 0
							}
						}

						return true
					},
		}
	},

	addProseMirrorPlugins() {
		let debounceTimeout: any
		let requestIdCounter = 0
		const pluginKey = new PluginKey('spellCheck')

		return [
			new Plugin({
				key: pluginKey,
				state: {
					init() {
						return {
							decorations: DecorationSet.empty,
							pendingRequests: new Map<string, Mapping>(),
						}
					},
					apply(tr, oldState) {
						let { decorations, pendingRequests } = oldState

						decorations = decorations.map(tr.mapping, tr.doc)

						const newPendingRequests = new Map(pendingRequests)
						if (tr.docChanged) {
							newPendingRequests.forEach((mapping, id) => {
								const newMapping = mapping.slice(0)
								tr.steps.forEach(step =>
									newMapping.appendMap(step.getMap()),
								)
								newPendingRequests.set(id, newMapping)
							})
						}

						const startId = tr.getMeta('spellCheckStart')
						if (startId) {
							newPendingRequests.set(startId, new Mapping())
						}

						const result = tr.getMeta('spellCheckResult')
						if (result) {
							const { id, errors, textMap, clearDecorations }
								= result
							const mapping = newPendingRequests.get(id)

							if (clearDecorations) {
								// Force clear all decorations
								decorations = DecorationSet.empty
								newPendingRequests.clear()
							}
							else if (mapping) {
								newPendingRequests.delete(id)
								const decos: Decoration[] = []

								errors.forEach(
									(err: {
										word: string
										index: number
										length: number
									}) => {
										const mappingEntry = textMap.find(
											(m: any) =>
												err.index >= m.offset
												&& err.index < m.offset + m.length,
										)
										if (mappingEntry) {
											const relativeStart
												= err.index - mappingEntry.offset
											const originalFrom
												= mappingEntry.from
													+ relativeStart
											const originalTo
												= originalFrom + err.length

											const from
												= mapping.map(originalFrom)
											const to = mapping.map(originalTo)

											if (to > from) {
												decos.push(
													Decoration.inline(
														from,
														to,
														{
															'class': 'spell-error',
															'data-word':
																err.word,
															'data-from':
																from.toString(),
															'data-to':
																to.toString(),
														},
													),
												)
											}
										}
									},
								)

								decorations = DecorationSet.create(
									tr.doc,
									decos,
								)
							}
						}

						return {
							decorations,
							pendingRequests: newPendingRequests,
						}
					},
				},
				props: {
					decorations(state) {
						return pluginKey.getState(state)?.decorations
					},
				},
				view: (view) => {
					// Set initial enabled state from options
					this.storage.enabled = this.options.enabled

					if (!this.storage.proofreader) {
						info(`SpellCheck language option: ${this.options.language}`)
						this.storage.proofreader = new Proofreader(
							this.options.language,
						)
					}

					const initBackend = async () => {
						try {
							await this.storage.proofreader.initialize()
							info('Initializing spellcheck backend')

							if (this.storage.enabled) {
								const requestId
									= (requestIdCounter++).toString()
								const { text, map } = extractTextWithMap(
									view.state.doc,
								)
								view.dispatch(
									view.state.tr.setMeta(
										'spellCheckStart',
										requestId,
									),
								)

								const result
									= await this.storage.proofreader.proofreadText(
										text,
									)
								view.dispatch(
									view.state.tr.setMeta('spellCheckResult', {
										id: requestId,
										errors: result.map((err: any) => ({
											word: err.word,
											index: err.offset,
											length: err.length,
										})),
										textMap: map,
									}),
								)
								this.storage.errorCount = result.length
							}
						}
						catch (e) {
							console.error(
								'Failed to init Rust spell check:',
								e,
							)
						}
					}

					if (!this.storage.proofreader.initialized) {
						initBackend()
					}

					this.storage.getSuggestions = async (word: string) => {
						try {
							return await this.storage.proofreader.getSuggestions(
								word,
							)
						}
						catch (e) {
							console.error('Failed to get suggestions:', e)
							return []
						}
					}

					this.storage.addWord = async (word: string) => {
						this.storage.customWords.push(word)
						try {
							await this.storage.proofreader.addWord(word)
							const requestId = (requestIdCounter++).toString()
							const { text, map } = extractTextWithMap(
								view.state.doc,
							)
							view.dispatch(
								view.state.tr.setMeta(
									'spellCheckStart',
									requestId,
								),
							)

							const result
								= await this.storage.proofreader.proofreadText(
									text,
								)
							view.dispatch(
								view.state.tr.setMeta('spellCheckResult', {
									id: requestId,
									errors: result.map((err: any) => ({
										word: err.word,
										index: err.offset,
										length: err.length,
									})),
									textMap: map,
								}),
							)
							this.storage.errorCount = result.length
						}
						catch (e) {
							console.error('Failed to add custom word:', e)
						}
					}

					this.storage.getAvailableLanguages = async () => {
						return await this.storage.proofreader.getAvailableLanguages()
					}

					this.storage.switchLanguage = async (language: string) => {
						try {
							this.storage.proofreader.setLanguage(language)
							await this.storage.proofreader.initialize()

							const requestId = (requestIdCounter++).toString()
							const { text, map } = extractTextWithMap(
								view.state.doc,
							)
							view.dispatch(
								view.state.tr.setMeta(
									'spellCheckStart',
									requestId,
								),
							)

							const result
								= await this.storage.proofreader.proofreadText(
									text,
								)
							view.dispatch(
								view.state.tr.setMeta('spellCheckResult', {
									id: requestId,
									errors: result.map((err: any) => ({
										word: err.word,
										index: err.offset,
										length: err.length,
									})),
									textMap: map,
								}),
							)
							this.storage.errorCount = result.length
							info(
								`Switched spellcheck language to: ${language}`,
							)
						}
						catch (e) {
							console.error('Failed to switch language:', e)
						}
					}

					return {
						update: async (view, prevState) => {
							const docChanged = !view.state.doc.eq(
								prevState.doc,
							)

							if (docChanged && this.storage.enabled) {
								if (debounceTimeout)
									clearTimeout(debounceTimeout)

								debounceTimeout = setTimeout(async () => {
									const requestId
										= (requestIdCounter++).toString()
									const { text, map } = extractTextWithMap(
										view.state.doc,
									)

									view.dispatch(
										view.state.tr.setMeta(
											'spellCheckStart',
											requestId,
										),
									)

									try {
										const result
											= await this.storage.proofreader.proofreadText(
												text,
											)
										view.dispatch(
											view.state.tr.setMeta(
												'spellCheckResult',
												{
													id: requestId,
													errors: result.map(
														(err: any) => ({
															word: err.word,
															index: err.offset,
															length: err.length,
														}),
													),
													textMap: map,
												},
											),
										)
										this.storage.errorCount = result.length
									}
									catch (e) {
										console.error('Check text failed:', e)
									}
								}, 300)
							}
						},
						destroy: () => {
							if (debounceTimeout)
								clearTimeout(debounceTimeout)
						},
					}
				},
			}),
		]
	},
})

export function setupSuggestions(editor: any) {
	function showSuggestions(e: MouseEvent) {
		if (!editor)
			return

		const target = e.target as HTMLElement
		if (!target.classList.contains('spell-error'))
			return

		const from = Number.parseInt(target.dataset.from || '0')
		const to = Number.parseInt(target.dataset.to || '0')
		const word = target.dataset.word || ''

		const storage = editor.storage as any
		const suggestions = storage.spellCheck?.getSuggestions
		if (!suggestions)
			return

		suggestions(word).then((suggs: string[]) => {
			const limitedSuggestions = suggs.slice(0, 5)

			const box = document.createElement('div')
			box.id = 'suggestions-box'

			const ul = document.createElement('ul')

			if (limitedSuggestions.length === 0) {
				const unknownLi = document.createElement('li')
				unknownLi.textContent = 'Unknown word'
				unknownLi.style.opacity = '0.6'
				unknownLi.style.cursor = 'default'
				unknownLi.style.pointerEvents = 'none'
				ul.appendChild(unknownLi)
			}
			else {
				limitedSuggestions.forEach((suggestion) => {
					const li = document.createElement('li')
					li.classList.add('suggestion-item')
					li.textContent = suggestion
					li.onclick = () => replaceWord(suggestion, from, to)
					ul.appendChild(li)
				})
			}

			const addLi = document.createElement('li')
			addLi.textContent = 'Add to dictionary'
			addLi.onclick = () => addToDictionary(word)
			ul.appendChild(addLi)

			box.appendChild(ul)

			const rect = target.getBoundingClientRect()
			box.style.position = 'fixed'
			box.style.top = `${rect.bottom + window.scrollY}px`
			box.style.left = `${rect.left + window.scrollX}px`
			box.style.zIndex = '1000'

			const existingBox = document.getElementById('suggestions-box')
			if (existingBox)
				existingBox.remove()

			document.body.appendChild(box)

			setTimeout(() => {
				const closeHandler = (e: MouseEvent) => {
					if (!box.contains(e.target as Node)) {
						box.remove()
						document.removeEventListener('click', closeHandler)
					}
				}
				document.addEventListener('click', closeHandler)
			}, 100)
		})
	}

	function replaceWord(suggestion: string, from: number, to: number) {
		if (!editor)
			return

		editor
			.chain()
			.focus()
			.deleteRange({ from, to })
			.insertContentAt(from, suggestion)
			.run()

		const box = document.getElementById('suggestions-box')
		if (box)
			box.remove()
	}

	function addToDictionary(word: string) {
		if (!editor)
			return

		const storage = editor.storage as any
		const addWord = storage.spellCheck?.addWord
		if (addWord) {
			addWord(word)
		}

		const box = document.getElementById('suggestions-box')
		if (box)
			box.remove()
	}

	return {
		showSuggestions,
		replaceWord,
		addToDictionary,
	}
}
