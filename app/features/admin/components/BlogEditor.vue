<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const model = defineModel<string>({ default: '' })

const editor = useEditor({
  content: model.value,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
  ],
  onUpdate({ editor: e }) {
    model.value = e.getHTML()
  },
})

watch(model, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function setLink() {
  const url = window.prompt('URL del enlace:')
  if (!url) {
    editor.value?.chain().focus().unsetLink().run()
    return
  }
  editor.value?.chain().focus().setLink({ href: url }).run()
}
</script>

<template>
  <ClientOnly>
    <div class="blog-editor">
      <div v-if="editor" class="blog-editor__toolbar btn-toolbar mb-0" role="toolbar" aria-label="Formato de texto">
        <div class="btn-group btn-group-sm me-2" role="group">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('bold') }"
            title="Negrita"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('italic') }"
            title="Cursiva"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <em>I</em>
          </button>
        </div>

        <div class="btn-group btn-group-sm me-2" role="group">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('heading', { level: 2 }) }"
            title="Título H2"
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          >
            H2
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('heading', { level: 3 }) }"
            title="Título H3"
            @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          >
            H3
          </button>
        </div>

        <div class="btn-group btn-group-sm me-2" role="group">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('bulletList') }"
            title="Lista"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            &#8226; Lista
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('orderedList') }"
            title="Lista numerada"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            1. Lista
          </button>
        </div>

        <div class="btn-group btn-group-sm me-2" role="group">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('blockquote') }"
            title="Cita"
            @click="editor.chain().focus().toggleBlockquote().run()"
          >
            &ldquo; Cita
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: editor.isActive('link') }"
            title="Enlace"
            @click="setLink"
          >
            Link
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            title="Línea horizontal"
            @click="editor.chain().focus().setHorizontalRule().run()"
          >
            ─
          </button>
        </div>
      </div>

      <EditorContent v-if="editor" :editor="editor" class="blog-editor__content form-control" />
    </div>

    <template #fallback>
      <div class="form-control" style="min-height: 300px; opacity: 0.5;">
        Cargando editor...
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped lang="scss">
.blog-editor {
  &__toolbar {
    padding: 0.5rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-bottom: 0;
    border-radius: 0.375rem 0.375rem 0 0;
    flex-wrap: wrap;
    gap: 0.25rem;

    .btn.active {
      background-color: #0d6efd;
      color: #fff;
      border-color: #0d6efd;
    }
  }

  &__content {
    min-height: 300px;
    border-radius: 0 0 0.375rem 0.375rem;
    padding: 1rem;

    :deep(.tiptap) {
      outline: none;
      min-height: 280px;

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
      }

      p {
        margin-bottom: 0.75rem;
      }

      ul, ol {
        padding-left: 1.5rem;
        margin-bottom: 0.75rem;
      }

      blockquote {
        border-left: 4px solid #14b8a6;
        padding-left: 1rem;
        margin-left: 0;
        color: #6b7280;
        font-style: italic;
      }

      a {
        color: #0d6efd;
        text-decoration: underline;
      }

      hr {
        border: none;
        border-top: 2px solid #e5e7eb;
        margin: 1.5rem 0;
      }
    }
  }
}
</style>
