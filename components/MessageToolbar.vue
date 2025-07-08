<script setup lang="ts">
const { openEmojiDialog } = defineProps<{
    isAuthor: boolean;
    isPending: boolean;
    hideThreadButton: boolean;
    openEmojiDialog: () => void
}>()

const emit = defineEmits(['on-set-editing', 'on-open-thread-panel', 'on-delete'])
</script>

<template>
    <div class="absolute top-0 right-5">
        <div class="flex items-center transition-opacity border bg-white rounded-md shadow-sm">
            <Button variant="ghost" size="iconSm" :disabled="isPending" @click="openEmojiDialog">
                <Icon name="lucide:smile" size="16px" class="size-4" />
            </Button>
            <Button v-if="!hideThreadButton" variant="ghost" size="iconSm" :disabled="isPending"
                @click="emit('on-open-thread-panel')">
                <Icon name="lucide:message-square-text" size="16px" class="size-4" />
            </Button>
            <Button v-if="isAuthor" variant="ghost" size="iconSm" :disabled="isPending" @click="emit('on-set-editing')">
                <Icon name="lucide:pencil" size="16px" class="size-4" />
            </Button>
            <Button v-if="isAuthor" variant="ghost" size="iconSm" :disabled="isPending" @click="emit('on-delete')">
                <Icon name="lucide:trash" size="16px" class="size-4" />
            </Button>
        </div>
    </div>
</template>