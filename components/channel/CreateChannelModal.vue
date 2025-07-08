<script setup lang="ts">
import { toast } from 'vue-sonner';

import type { Doc } from '~/convex/_generated/dataModel';
import slugify from '~/lib/slugify';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';

const { open, onSuccess } = defineProps<{ open: boolean; onSuccess?: (channel: Doc<'channels'>) => Promise<void> | void }>()
const emit = defineEmits(['on-post-success', 'on-close'])

const workspaceData = injectWorkspaceData()

// Modal states
const error = ref('')
const processing = ref(false)

// Slugify channel name on blur
const slugifyInput = (e: Event) => {
    const elm = e.currentTarget as HTMLInputElement
    elm.value = slugify(elm.value)
}

const toggleModal = () => emit('on-close')

const handleSubmit = (e: Event) => {
    processing.value = true

    const formElm = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElm)

    const name = String(formData.get('name'))

    $fetch(
        `/api/workspace/${workspaceData.workspace.value?.workspace?._id}/channel/create`,
        { method: 'POST', body: { name } }
    )
        .catch((e) => {
            error.value = e.message || 'Failed to create new channel'
        })
        .then(async (res) => {
            const { channel } = (res || { channel: null }) as { channel: Doc<'channels'> | null }
            if (channel) {
                await onSuccess?.(channel)
                emit('on-post-success', channel, name)
                toast.success('Channel created')
            }
        })
        .finally(() => processing.value = false)
}
</script>

<template>
    <Dialog :open="open" @update:open="toggleModal">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add a channel</DialogTitle>
            </DialogHeader>
            <div v-if="error"
                class="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                <Icon name="lucide:triangle-alert" size="16px" class="size-4" />
                <p>{{ error || '123' }}</p>
            </div>
            <form @submit.prevent="handleSubmit">
                <fieldset :disabled="processing" class="space-y-4">
                    <Input name="name" required autofocus minlength="3" maxlength="80" placeholder="e.g. plan-budget"
                        @blur="slugifyInput" />
                    <div class="flex justify-end">
                        <Button type="submit" class="w-20 h-9">
                            <template v-if="processing">
                                <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                            </template>
                            <template v-else>Create</template>
                        </Button>
                    </div>
                </fieldset>
            </form>
        </DialogContent>
    </Dialog>
</template>