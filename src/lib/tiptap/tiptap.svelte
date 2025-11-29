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
          class: "p-4 outline-none",
        },
      },
      content: `
        <h1>Hello Svelte! 🌍️ </h1>
        <p>This editor is running in Svelte.</p>
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

<div class="flex flex-col h-full w-full">
  {#if editorState.editor}
    <div class="p-2 bg-background flex gap-2 items-center border-b">
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

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (only a mouse ux improvement) -->
  <div
    bind:this={element}
    class="flex-1 min-h-[400px] w-full prose **:text-foreground cursor-text max-w-none"
    onclick={() => {
      if (editorState.editor) {
        if (!editorState.editor.isFocused)
          editorState.editor.chain().focus('end').run();
      }
    }}
  ></div>
</div>
