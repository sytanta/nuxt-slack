<script setup lang="ts">
import { toast } from 'vue-sonner';

import ConfirmModal from '../ConfirmModal.vue';

const { open, initialValue, closeModal } = defineProps<{
    open: boolean,
    initialValue: string;
    closeModal: () => void;
}>()

const emit = defineEmits(['on-rename'])

const route = useRoute();
const { openModal } = useConfirmModal()

// Preferences modal states
const value = computed(() => initialValue)
const editModalOpen = ref(false)
const renaming = ref(false)

const onSubmitRename = (e: Event) => {
    renaming.value = true

    const formElm = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElm)

    const name = formData.get('name')

    $fetch(`/api/workspace/${route.params['workspaceId']}`, { method: 'POST', body: { name } }).then(async () => {
        emit('on-rename', name)
        toast.success('Workspace renamed')
        editModalOpen.value = false
    }).catch(() => {
        toast.error('Failed to rename workspace')
    }).finally(() => renaming.value = false)
}

const deleteWorkspace = async () => $fetch(`/api/workspace/${route.params['workspaceId']}`, { method: 'DELETE' }).then(async () => {
    await navigateTo('/', { replace: true }) // redirect to home and remove history
    // TODO - select other workspaces or display the create workspace modal
    toast.success('Workspace deleted')
}).catch(() => {
    toast.error('Failed to delete workspace')
})

const showConfirmModal = () => openModal(ConfirmModal, {
    onConfirm: deleteWorkspace,
    title: 'Are you sure?',
    message: 'This action is irreversible.'
})
</script>

<template>
    <!-- Preferences modal -->
    <Dialog :open="open" @update:open="closeModal">
        <DialogContent class="p-0 bg-gray-50 overflow-hidden">
            <DialogHeader class="p-4 border-b bg-white">
                <DialogTitle>{{ value }}</DialogTitle>
            </DialogHeader>
            <div class="px-4 pb-4 flex flex-col gap-y-2">
                <button @click="editModalOpen = true"
                    class="block text-left px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-semibold">
                            Workspace name
                        </p>
                        <p class="text-sm text-[#1264a3] font-semibold hover:underline">Edit</p>
                    </div>
                    <p class="text-sm">
                        {{ value }}
                    </p>
                </button>

                <button @click="showConfirmModal"
                    class="flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 text-rose-600">
                    <Icon name="lucide:trash" size="16px" class="size-4" />
                    <p class="text-sm font-semibold">Delete workspace</p>
                </button>
            </div>
        </DialogContent>
    </Dialog>

    <!-- Rename workspace modal -->
    <Dialog :open="editModalOpen" @update:open="editModalOpen = false">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename this workspace</DialogTitle>
            </DialogHeader>
            <form @submit.prevent="onSubmitRename">
                <fieldset :disabled="renaming" class="space-y-4">
                    <Input name="name" :model-value="value" required autofocus minlength="3" maxlength="80"
                        placeholder="Workspace name e.g. 'Personal', 'Work', 'Home'" />
                    <DialogFooter>
                        <DialogClose :as-child="true">
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" class="w-16 h-9">
                            <template v-if="renaming">
                                <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                            </template>
                            <template v-else>Save</template>
                        </Button>
                    </DialogFooter>
                </fieldset>
            </form>
        </DialogContent>
    </Dialog>
</template>