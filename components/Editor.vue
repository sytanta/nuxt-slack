<script setup lang="ts">
import Quill, { Delta, Op } from 'quill'
import 'quill/dist/quill.snow.css'

import type { EditorValue } from '~/lib/types';
import hasTextContent from '~/lib/quill/hasTextContent';

const {
    variant = 'create',
    defaultValue = [],
    placeholder = 'Write something...',
    disabled = false,
    onSubmit,
    onCancel,
    cleanupAfterSubmit = true
} = defineProps<{
    variant?: 'create' | 'update',
    defaultValue?: Delta | Op[];
    placeholder?: string;
    disabled?: boolean;
    onSubmit: (params: EditorValue) => void,
    onCancel?: () => void,
    cleanupAfterSubmit?: boolean
}>()

const containerRef = useTemplateRef('editor-container')
const imageInputRef = useTemplateRef('image-input')
const imageTooltipComponentRef = useTemplateRef('image-tooltip')

const isToolbarVisible = ref(true)
const content = ref('')
const image = ref<File | null>(null)
const imagePreviewURL = computed(() => image.value ? URL.createObjectURL(image.value) : '')
const isEmpty = computed(() => !image.value && !hasTextContent(content.value))

let editor: Quill | null = null
const onTextChange = () => content.value = editor?.getText() || ''

onMounted(() => {
    if (!import.meta.browser) return

    editor = new Quill(containerRef.value!.querySelector('#editor')! as HTMLElement, {
        // debug: 'info',
        modules: {
            toolbar: [
                ['bold', 'italic', 'strike'],
                ['link'],
                [{ list: 'ordered' }, { list: 'bullet' }]
            ],
            keyboard: {
                bindings: {
                    enter: { // Send message
                        key: 'Enter',
                        handler: () => {
                            const text = editor?.getText() ?? ''
                            const image = imageInputRef.value?.files?.[0] ?? null

                            const isEmpty = !image && !hasTextContent(text)
                            if (isEmpty) return

                            const message = JSON.stringify(editor?.getContents())
                            onSubmit({ message, image })
                            cleanupAfterSubmit && cleanup()
                        }
                    },
                    shift_enter: { // Shift + Enter to add a new line
                        key: 'Enter',
                        shiftKey: true,
                        handler: () => {
                            editor?.insertText(editor.getSelection()?.index ?? 0, '\n')
                        }
                    }
                }
            }
        },
        theme: 'snow',
        placeholder
    });

    editor.on(Quill.events.TEXT_CHANGE, onTextChange)

    editor.setContents(defaultValue || '123')
    content.value = editor.getText()

    editor.focus()
})

defineExpose({
    editor
})

onUnmounted(() => {
    editor?.off(Quill.events.TEXT_CHANGE, onTextChange)
    editor = null
})

// Show/hide editor toolbar
const toggleToolbar = () => {
    const toolbarElm = containerRef.value?.querySelector('.ql-toolbar')
    if (toolbarElm) toolbarElm.classList.toggle('hidden')
    isToolbarVisible.value = !isToolbarVisible.value
}

// Handle emoji select
const onEmojiSelect = (emoji: { native: string }) => {
    editor?.insertText(editor.getSelection()?.index ?? 0, emoji.native)
}

// Handle image select
const openImageSelectWindow = () => {
    imageInputRef.value?.click()
    setTimeout(() => imageTooltipComponentRef.value?.closeTooltip(), 150)
}

const onImageSelect = (e: Event) => {
    image.value = (e.currentTarget as HTMLInputElement).files?.[0] ?? null
}

const clearSelectedImage = () => {
    image.value = null
}

// Handle submit/send message
const handleSubmit = () => {
    onSubmit({
        message: JSON.stringify(editor?.getContents()),
        image: image.value
    })

    cleanupAfterSubmit && cleanup()
}

const cleanup = () => {
    editor?.setContents([])
    clearSelectedImage()
}
</script>

<template>
    <div class="flex flex-col">
        <input type="file" accept="image/*" @change="onImageSelect" ref="image-input" class="hidden" />
        <div class="flex flex-col border bg-white border-slate-200 rounded-md overflow-hidden">
            <div ref="editor-container" class="h-full ql-custom">
                <div id="editor"></div>
            </div>
            <div v-if="image" class="p-2">
                <div class="relative size-[62px] flex items-center justify-center group/image">
                    <Hint label="Remove image">
                        <button @click="clearSelectedImage"
                            class="hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] border-2 border-white items-center justify-center">
                            <Icon name="lucide:x" size="14px" class="size-3.5" />
                        </button>
                    </Hint>
                    <img :src="imagePreviewURL" alt="Uploaded image" fill
                        class="rounded-xl overflow-hidden border object-cover" />
                </div>
            </div>
            <div class="flex px-2 pb-2 z-[5]">
                <Hint :label="isToolbarVisible ? 'Hide formatting' : 'Show formatting'">
                    <Button variant="ghost" size="iconSm" @click="toggleToolbar" :disabled="disabled">
                        <Icon name="lucide:case-sensitive" size="20px" class="size-5" />
                    </Button>
                </Hint>
                <EmojiPopover :onEmojiSelect="onEmojiSelect">
                    <Button variant="ghost" size="iconSm" :disabled="disabled">
                        <Icon name="lucide:smile" size="20px" class="size-5" />
                    </Button>
                </EmojiPopover>
                <Hint v-if="variant === 'create'" label="Image" ref="image-tooltip">
                    <Button variant="ghost" size="iconSm" :disabled="disabled" @click="openImageSelectWindow">
                        <Icon name="lucide:image" size="20px" class="size-5" />
                    </Button>
                </Hint>
                <Button v-if="variant === 'create'" :data-show="!isEmpty" size="iconSm" :disabled="disabled || isEmpty"
                    @click="handleSubmit"
                    class="ml-auto bg-[#007a5a] text-white hover:bg-[#007a5a]/80 opacity-0 transition-all data-[show=true]:opacity-100 disabled:bg-white hover:disabled:bg-white disabled:text-muted-foreground">
                    <Icon name="lucide:send-horizontal" size="20px" class="size-5" />
                </Button>
                <div v-else class="ml-auto flex items-center gap-x-2">
                    <Button variant="outline" size="sm" :disabled="disabled" @click="onCancel">Cancel</Button>
                    <Button size="sm" class="bg-[#007a5a] text-white hover:bg-[#007a5a]/80" :disabled="disabled"
                        @click="handleSubmit">Save</Button>
                </div>
            </div>
        </div>

        <div v-if="variant === 'create'" class="p-2 text-[10px] text-muted-foreground flex justify-end">
            <p>
                <strong>Shift + Return</strong> to add a new line
            </p>
        </div>
    </div>
</template>