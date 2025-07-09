<script setup lang="ts">
import { toast } from 'vue-sonner';

import type { Id } from '~/convex/_generated/dataModel';
import slugify from '~/lib/slugify';
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import ConfirmModal from '../ConfirmModal.vue';

const { title } = defineProps<{ title: string }>()
const emit = defineEmits(['on-rename'])

const route = useRoute()
const auth = useAuthStore()
const { openModal } = useConfirmModal()
const { members, refreshChannels, updateChannelName } = injectWorkspaceData()

const isAdmin = !!members.value?.members.find(({ _id, is_admin }) => is_admin && _id === auth.user?.id)

// Main modal states
const displayedTitle = ref(title)
const open = ref(false)

const openMainModal = () => open.value = true
const closeMainModal = () => open.value = false

// Rename modal states
const editModalOpen = ref(false)
const renaming = ref(false)

const openEditModal = () => {
    if (isAdmin) editModalOpen.value = true
}
const closeEditModal = () => editModalOpen.value = false

// Slugify channel name on blur
const slugifyInput = (e: Event) => {
    const elm = e.currentTarget as HTMLInputElement
    elm.value = slugify(elm.value)
}

const onSubmitRename = (e: Event) => {
    renaming.value = true

    const formElm = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElm)

    const channelId = route.params['channelId']
    const name = String(formData.get('name'))

    $fetch(`/api/channel/${channelId}`, { method: 'PATCH', body: { name } })
        .then(async () => {
            updateChannelName(channelId as Id<'channels'>, name)
            displayedTitle.value = name

            emit('on-rename', name)
            toast.success('Channel renamed')
            closeEditModal()
        }).catch(() => {
            toast.error('Failed to rename channel')
        }).finally(() => renaming.value = false)
}

const deleteChannel = async () => {
    const workspaceId = route.params['workspaceId']
    const channelId = route.params['channelId']

    await $fetch(`/api/channel/${channelId}`, { method: 'DELETE' }).then(() => {
        // Redirect to parent workspace and remove history
        navigateTo(`/workspace/${workspaceId}`, { replace: true })

        // Refresh channels data
        refreshChannels()

        closeMainModal()

        // TODO - select other channels or display the create channel modal
        toast.success('Channel deleted')
    }).catch(() => {
        toast.error('Failed to delete channel')
    })
}

const showConfirmModal = () => {
    if (isAdmin) openModal(ConfirmModal, {
        onConfirm: deleteChannel,
        title: 'Delete the channel?',
        message: 'This action is irreversible.'
    })
}
</script>

<template>
    <div class="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden">
        <Dialog :open="open" @update:open="closeMainModal" id="channel-header-dialog">
            <DialogTrigger :as-child="true" id="channel-header-dialog-trigger">
                <Button variant="ghost" size="sm" @click="openMainModal"
                    class="text-lg font-semibold w-auto px-2 overflow-hidden">
                    <span class="truncate"># {{ displayedTitle }}</span>
                    <Icon name="lucide:chevron-down" size="16px" class="size-4 ml-1 shrink-0" />
                </Button>
            </DialogTrigger>
            <DialogContent class="p-0 bg-gray-50 overflow-hidden">
                <DialogHeader class="p-4 border-b bg-white" id="channel-header-dialog-header">
                    <DialogTitle id="channel-header-dialog-title" @click="open = false">
                        # {{ displayedTitle }}
                    </DialogTitle>
                </DialogHeader>
                <div class="px-4 pb-4 flex flex-col gap-y-2">
                    <button @click="openEditModal"
                        class="px-5 py-4 bg-white text-left rounded-lg border cursor-pointer hover:bg-gray-50">
                        <div class="flex items-center justify-between">
                            <p class="text-sm font-semibold">Channel name</p>
                            <p v-if="isAdmin" class="text-sm text-[#1264a3] font-semibold hover:underline">Edit</p>
                        </div>
                        <p class="text-sm"># {{ displayedTitle }}</p>
                    </button>
                    <button v-if="isAdmin" @click="showConfirmModal"
                        class="flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg cursor-pointer border hover:bg-gray-50 text-rose-600">
                        <Icon name="lucide:trash" size="16px" class="size-4" />
                        <p class="text-sm font-semibold">Delete channel</p>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    </div>

    <Dialog :open="editModalOpen" @update:open="closeEditModal" id="channel-header-dialog-edit">
        <DialogContent>
            <DialogHeader id="channel-header-dialog-edit-header">
                <DialogTitle id="channel-header-dialog-edit-title">
                    Rename channel
                </DialogTitle>
            </DialogHeader>
            <form @submit.prevent="onSubmitRename">
                <fieldset :disabled="renaming" class="space-y-4">
                    <Input name="name" :model-value="displayedTitle" autofocus minlength="3" maxlength="80" required
                        @blur="slugifyInput" placeholder="e.g plan-budget" />
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