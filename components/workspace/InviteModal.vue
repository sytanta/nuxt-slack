<script setup lang="ts">
import { toast } from 'vue-sonner';

import ConfirmModal from '../ConfirmModal.vue';

const { open, workspaceName, joinCode, closeModal } = defineProps<{
    open: boolean,
    workspaceName: string;
    joinCode: string;
    closeModal: () => void;
}>()

const route = useRoute();
const { openModal } = useConfirmModal()

// Invite modal states 
const processing = ref(false)
const displayedJoinCode = ref(joinCode)

const handleCopy = () => {
    const inviteLink = `${window.location.origin}/join/${route.params['workspaceId']}`
    navigator.clipboard.writeText(inviteLink).then(() => toast.success('Invite link copied'))
}

const generateNewJoinCode = async () => {
    processing.value = true

    return $fetch(
        `/api/workspace/${route.params['workspaceId']}`,
        { method: 'POST', body: { join_code: true } })
        .then(async (res) => {
            if ((res as { data: string })?.data) displayedJoinCode.value = (res as { data: string }).data
            toast.success('Invite code regenerated')
        })
        .catch(() => {
            toast.error('Failed to generate new invite code')
        })
        .finally(() => processing.value = false)
}

const showConfirmModal = () => openModal(ConfirmModal, {
    onConfirm: generateNewJoinCode,
    title: 'Are you sure?',
    message: 'This will deactivate the current invite code and generate a new one.'
})
</script>

<template>
    <Dialog :open="open" @update:open="closeModal">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Invite member to {{ workspaceName }} workspace</DialogTitle>
                <DialogDescription>Use the code below to invite member to your workspace</DialogDescription>
            </DialogHeader>
            <div class="flex flex-col items-center justify-center py-10 gap-y-4">
                <p class="text-4xl font-bold tracking-widest uppercase">{{ displayedJoinCode }}</p>
                <Button variant="ghost" size="sm" @click="handleCopy">
                    Copy link
                    <Icon name="lucide:copy" size="16px" class="size-4 ml-1" />
                </Button>
            </div>

            <div class="flex items-center justify-between">
                <Button variant="outline" @click="showConfirmModal" :disabled="processing">
                    New code
                    <Icon name="lucide:refresh-ccw" size="16px" :data-spin="processing"
                        class="size-4 ml-2 data-[spin=true]:animate-spin" />
                </Button>
                <DialogClose :as-child="true" :disabled="processing">
                    <Button>Close</Button>
                </DialogClose>
            </div>
        </DialogContent>
    </Dialog>
</template>