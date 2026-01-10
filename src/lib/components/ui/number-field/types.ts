import type { UseRampOptions } from '$lib/hooks/use-ramp.svelte'
import type { WithElementRef } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLInputAttributes } from 'svelte/elements'
import type { ButtonProps } from '../button'

export interface NumberFieldRootProps {
	value?: number
	step?: number
	min?: number
	max?: number
	rampSettings?: Omit<UseRampOptions, 'increment' | 'canRamp'>
	children: Snippet
}

export type NumberFieldButtonProps = Omit<ButtonProps, 'disabled'> & {
	disabled?: boolean
}

export type NumberFieldInputProps = WithElementRef<
	Omit<HTMLInputAttributes, 'min' | 'max' | 'value' | 'type'>
>
