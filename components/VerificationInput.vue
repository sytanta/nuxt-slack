<script setup lang="ts">
import { Input } from '@/components/ui/input';

const { name, disabled } = defineProps<{ name?: string, disabled?: Ref<boolean> | boolean }>()
const emit = defineEmits(['on-complete'])

const code = reactive(['', '', '', '', '', '']);
const inputRefs: Ref<(ComponentPublicInstance | null)[]> = ref([]);

const finalInputValue = computed(() => code.join(''))

watch(finalInputValue, (newValue) => {
    if (newValue.length === 6) emit('on-complete', newValue)
})

const handleInput = (index: number, event: Event & { currentTarget: HTMLInputElement }) => {
    if (event.currentTarget?.value && index < code.length - 1) {
        inputRefs.value[index + 1]?.$el?.focus?.();
    }
};

const handleBackspace = (index: number, event: Event & { currentTarget: HTMLInputElement }) => {
    if (!event.currentTarget?.value && index > 0) {
        inputRefs.value[index - 1]?.$el?.focus?.();
    }
};

const handleArrowLeft = (index: number) => {
    if (index > 0) {
        inputRefs.value[index - 1]?.$el?.focus?.();
    }
}

const handleArrowRight = (index: number) => {
    if (index < code.length - 1) {
        inputRefs.value[index + 1]?.$el?.focus?.();
    }
};

const handlePaste = (index: number, event: ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData('text/plain') ?? ''
    let textIndex = 0
    let inputIndex = index

    for (; inputIndex < 6; ++inputIndex) {
        code[inputIndex] = pastedText[textIndex] ?? ''
        textIndex++
    }

    inputRefs.value[inputIndex - 1]?.$el?.focus?.();
}
</script>

<template>
    <div class="flex space-x-2">
        <input type="hidden" :name="name" :value="finalInputValue" />
        <Input v-for="(digit, index) in code" :key="index" v-model="code[index]" maxlength="1" :autofocus="index === 0"
            @input="handleInput(index, $event)" @keydown.backspace="handleBackspace(index, $event)"
            @keydown.left="handleArrowLeft(index)" @keydown.right="handleArrowRight(index)"
            @paste.prevent="handlePaste(index, $event)" :ref="(el) => inputRefs[index] = el as ComponentPublicInstance"
            :disabled="disabled" placeholder="&middot;"
            class="w-10 text-center uppercase rounded-md border border-gray-300 flex items-center justify-center text-lg font-medium text-gray-500 bg-muted focus-within:bg-white focus-within:text-black not-empty:bg-white not-empty:text-black" />
    </div>
</template>