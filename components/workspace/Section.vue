<script setup lang="ts">
const { label, hint, isAdmin, handleNew } = defineProps<{
    label: string;
    hint: string;
    isAdmin: boolean;
    handleNew?: () => void
}>()

const hideChannels = ref(false)
const toggleChannels = () => hideChannels.value = !hideChannels.value
</script>

<template>
    <div class="flex flex-col px-2 mt-3">
        <div class="flex items-center px-3.5 group">
            <Button variant="transparent" @click="toggleChannels"
                class="p-0.5 text-sm text-[#f9edffcc] shrink-0 size-6">
                <Icon name="lucide:chevron-down" size="16px" :data-hidechannels="hideChannels"
                    class="size-4 data-[hidechannels=true]:-rotate-90 transition-transform" />
            </Button>
            <Button variant="transparent" size="sm"
                class="group px-1.5 text-sm text-[#f9edffcc] h-[28px] justify-start items-center overflow-hidden">
                <span class="truncate">{{ label }}</span>
            </Button>
            <Hint v-if="isAdmin && handleNew" :label="hint" side="top" align="center">
                <Button @click="handleNew" variant="transparent" size="iconSm"
                    class="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-0.5 text-sm text-[#f9edffcc] size-6 shrink-0">
                    <Icon name="lucide:plus" size="20px" class="size-5" />
                </Button>
            </Hint>
        </div>
        <div v-show="!hideChannels">
            <slot></slot>
        </div>
    </div>
</template>