<script setup lang="ts">
const { open, title, closeModal, onConfirm, onClose, onCancel, cleanup } = defineProps<{
    open?: Ref<boolean>,
    title?: string;
    message?: string;
    closeModal?: () => void;
    onConfirm: (result?: boolean) => Promise<void>;
    onClose: (result?: boolean) => Promise<void>;
    onCancel: () => Promise<void>;
    cleanup: () => void;
}>()

const processing = ref(false)

const handleCleanup = () => setTimeout(cleanup, 250) // wait for the modal to finish transitioning

const handleConfirm = async () => {
    processing.value = true
    await onConfirm(true)
    closeModal?.()

    handleCleanup()
}

const handleClose = async () => {
    await onClose()
    closeModal?.()

    handleCleanup()
}

const handleCancel = async () => {
    await onCancel()
    closeModal?.()

    handleCleanup()
}
</script>

<template>
    <Dialog id="confirm-modal" :open="open?.value" @update:open="handleClose">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ title }}</DialogTitle>
                <DialogDescription>
                    {{ message }}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="pt-2">
                <Button variant="outline" @click="handleCancel" :disabled="processing">Cancel</Button>
                <Button @click="handleConfirm" :disabled="processing" class="w-20 h-9">
                    <template v-if="processing">
                        <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                    </template>
                    <template v-else>Confirm</template>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>