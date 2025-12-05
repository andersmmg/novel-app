<script lang="ts" module>
	class InputPromptDialogState {
		open = $state(false);
		inputText = $state('');
		options = $state<InputPromptOptions | null>(null);
		loading = $state(false);

		constructor() {
			this.confirm = this.confirm.bind(this);
			this.cancel = this.cancel.bind(this);
		}

		newInputPrompt(options: InputPromptOptions) {
			this.reset();
			this.options = options;
			this.inputText = options.input?.initialValue ?? '';
			this.open = true;
		}

		reset() {
			this.open = false;
			this.inputText = '';
			this.options = null;
		}

		confirm() {
			if (this.inputText.trim().length === 0) return;

			this.loading = true;
			this.options
				?.onConfirm(this.inputText)
				.then(() => {
					this.open = false;
				})
				.finally(() => {
					this.loading = false;
				});
		}

		cancel() {
			this.options?.onCancel?.();
			this.open = false;
		}
	}

	const dialogState = new InputPromptDialogState();

	export type InputPromptOptions = {
		title: string;
		description: string;
		input?: {
			initialValue: string;
			placeholder?: string;
		};
		confirm?: {
			text?: string;
		};
		cancel?: {
			text?: string;
		};
		onConfirm: (value: string) => Promise<unknown>;
		onCancel?: () => void;
	};

	export function inputPrompt(options: InputPromptOptions) {
		dialogState.newInputPrompt(options);
	}
</script>

<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Input } from '$lib/components/ui/input';
</script>

<AlertDialog.Root bind:open={dialogState.open}>
	<AlertDialog.Content>
		<form
			method="POST"
			onsubmit={(e) => {
				e.preventDefault();
				dialogState.confirm();
			}}
			class="flex flex-col gap-4"
		>
			<AlertDialog.Header>
				<AlertDialog.Title>
					{dialogState.options?.title}
				</AlertDialog.Title>
				<AlertDialog.Description>
					{dialogState.options?.description}
				</AlertDialog.Description>
			</AlertDialog.Header>
				<Input
					bind:value={dialogState.inputText}
					placeholder={dialogState.options?.input?.placeholder ?? ''}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							// for some reason without this the form will submit and the dialog will close immediately
							e.preventDefault();
							dialogState.confirm();
						}
					}}
				/>
			<AlertDialog.Footer>
				<AlertDialog.Cancel type="button" onclick={dialogState.cancel}>
					{dialogState.options?.cancel?.text ?? 'Cancel'}
				</AlertDialog.Cancel>
				<AlertDialog.Action
					type="submit"
					loading={dialogState.loading}
					disabled={dialogState.inputText.trim().length === 0}
				>
					{dialogState.options?.confirm?.text ?? 'Confirm'}
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</form>
	</AlertDialog.Content>
</AlertDialog.Root>
