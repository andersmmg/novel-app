<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import { StarterKit } from "@tiptap/starter-kit";
  import { Button } from "$lib/components/ui/button";
  import * as ButtonGroup from "$lib/components/ui/button-group";
  import {
    BoldIcon,
    Heading1Icon,
    Heading2Icon,
    ItalicIcon,
    Pilcrow,
  } from "@lucide/svelte";
  import { TrailingNode } from "@tiptap/extensions/trailing-node";

  let element = $state<HTMLElement>();
  let editorState = $state({ editor: null as Editor | null });
  onMount(() => {
    editorState.editor = new Editor({
      element: element,
      extensions: [
        StarterKit.configure({
          horizontalRule: {
            HTMLAttributes: {
              class: "border-t border-border",
            },
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: "p-4",
        },
      },
      content: `
        <h1>Hello Svelte! 🌍️ </h1>
        <p>This editor is running in Svelte.</p>
        <p>Select some text to see the bubble menu popping up.</p>
      `,
      onTransaction: ({ editor }) => {
        // Increment the state signal to force a re-render
        editorState = { editor };
      },
    });
  });
  onDestroy(() => {
    editorState.editor?.destroy();
  });
</script>

{#if editorState.editor}
  <div class="p-2 bg-background flex gap-2 items-center">
    <!-- Headings -->
    <ButtonGroup.Root>
      <Button
        size="sm"
        variant="outline"
        onclick={() =>
          editorState.editor!.chain().focus().toggleHeading({ level: 1 }).run()}
        ><Heading1Icon /></Button
      >
      <Button
        size="sm"
        variant="outline"
        onclick={() =>
          editorState.editor!.chain().focus().toggleHeading({ level: 2 }).run()}
        ><Heading2Icon /></Button
      >
      <Button
        size="sm"
        variant="outline"
        onclick={() => editorState.editor!.chain().focus().setParagraph().run()}
        ><Pilcrow /></Button
      >
    </ButtonGroup.Root>
    <!-- Formatting -->
    <ButtonGroup.Root>
      <Button
        size="sm"
        variant={editorState.editor.isActive("bold") ? "default" : "outline"}
        onclick={() => editorState.editor!.chain().focus().toggleBold().run()}
        ><BoldIcon /></Button
      >
      <Button
        size="sm"
        variant={editorState.editor.isActive("italic") ? "default" : "outline"}
        onclick={() => editorState.editor!.chain().focus().toggleItalic().run()}
        ><ItalicIcon /></Button
      >
    </ButtonGroup.Root>
  </div>
{/if}

<div
  bind:this={element}
  class="min-h-[400px] h-full w-full border prose **:text-foreground"
></div>
