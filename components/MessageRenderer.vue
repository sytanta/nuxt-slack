<script setup lang="ts">
import Quill from 'quill'

import type { Message } from '~/lib/types';
import hasTextContent from '~/lib/quill/hasTextContent';

const { data } = defineProps<{ data: Message }>()

const containerRef = useTemplateRef('message-container')
const isEmpty = ref(true)

watch([containerRef, data], ([container, data]) => {
    if (!container || !data) return

    const editorElm = document.createElement('div')
    const editor = new Quill(editorElm, {
        theme: 'snow',
        readOnly: true
    });
    editor.setContents(JSON.parse(data.message || ''))

    isEmpty.value = !hasTextContent(editor.getText())

    if (!isEmpty.value) containerRef.value!.innerHTML = editor.root.innerHTML
})
</script>

<template>
    <div ref="message-container" class="ql-editor ql-renderer"></div>
</template>