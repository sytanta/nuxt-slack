<script setup lang="ts">
import { toast } from 'vue-sonner';

const { open } = defineProps<{ open: boolean }>()
const emit = defineEmits(['on-create', 'on-close'])

// Modal states
const error = ref('')
const processing = ref(false)

const toggleModal = () => emit('on-close')

const handleSubmit = (e: Event) => {
    processing.value = true

    const formElm = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElm)

    const name = String(formData.get('name'))

    $fetch('/api/workspace/create', { method: 'POST', body: { name } }).catch((e) => {
        error.value = e.message || 'Failed to create new workspace'
    }).then(async (res) => {
        if (res?.id) {
            emit('on-create', String(res.id), name)

            await navigateTo(`/workspace/${res?.id}`)

            toast.success('Workspace created')
        }
    }).finally(() => processing.value = false)
}
</script>

<template>
    <Dialog :open="open" @update:open="toggleModal">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add a workspace</DialogTitle>
            </DialogHeader>
            <div v-if="error"
                class="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                <Icon name="lucide:triangle-alert" size="16px" class="size-4" />
                <p>{{ error || '123' }}</p>
            </div>
            <form @submit.prevent="handleSubmit">
                <fieldset :disabled="processing" class="space-y-4">
                    <Input name="name" required autofocus minlength="3" maxlength="80"
                        placeholder="Workspace name e.g. 'Personal', 'Work', 'Home'" />
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