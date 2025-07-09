<script setup lang="ts">
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';

definePageMeta({
    layout: 'workspace'
})

const route = useRoute();
const auth = useAuthStore()
const workspaceData = injectWorkspaceData()

setPageSEO(() => workspaceData.workspace.value?.workspace.name)

const isLoading = computed(() => workspaceData.workspaceLoadStatus.value === 'idle'
    || workspaceData.workspaceLoadStatus.value === 'pending'
    || workspaceData.channelsLoadStatus.value === 'idle'
    || workspaceData.channelsLoadStatus.value === 'pending'
    || workspaceData.membersLoadStatus.value === 'idle'
    || workspaceData.membersLoadStatus.value === 'pending')

const isError = computed(() => workspaceData.workspaceLoadStatus.value === 'error'
    || workspaceData.channelsLoadStatus.value === 'error'
    || workspaceData.membersLoadStatus.value === 'error')

const checkWorkspaceChannels = () => {
    if (workspaceData.channels.value?.channels?.length) {
        // Navigate to workspace first channel
        navigateTo(`/workspace/${workspaceData.workspace.value.workspace._id}/channel/${workspaceData.channels.value.channels[0]._id}`)
    } else if (!workspaceData.createCNModalOpen.value) {
        const isAdmin = auth.user?.id && auth.user.id === workspaceData.workspace.value?.workspace?.user_id
        // or open the create channel modal
        // user (admin) cannot close it here
        isAdmin && workspaceData.openCreateChannelModal()
    }
}

// Listen to workspace & loading status changes
watch([
    () => route.params['workspaceId'],
    () => workspaceData.workspaceLoadStatus.value,
    () => workspaceData.channelsLoadStatus.value,
    () => workspaceData.membersLoadStatus.value,
    workspaceData.createCNModalOpen,
], ([workspaceId, workspaceLoadStatus, channelsLoadStatus, membersLoadStatus]) => {
    if (
        // The first line is to fix the issue of all loading statuses are "success"
        // when navigating to a new workspace.
        // Those "success" are of the old workspace.
        // This check won't work when using the second parameter of the callback function
        workspaceData.workspace.value?.workspace?._id && workspaceData.workspace.value?.workspace?._id !== workspaceId
        || workspaceLoadStatus !== 'success'
        || channelsLoadStatus !== 'success'
        || membersLoadStatus !== 'success'
    ) return

    checkWorkspaceChannels()
}, { immediate: true })
</script>

<template>
    <div class="h-full flex flex-col flex-1 items-center justify-center gap-1">
        <template v-if="isLoading">
            <Icon name="svg-spinners:8-dots-rotate" size="24px" class="size-6 text-muted-foreground" />
        </template>
        <template v-else-if="isError || !workspaceData.members.value?.members?.length">
            <Icon name="lucide:triangle-alert" size="24px" class="size-6 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">Workspace not found</span>
        </template>
        <template v-else-if="!workspaceData.channels.value?.channels?.length">
            <Icon name="lucide:triangle-alert" size="24px" class="size-6 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">No channel found</span>
        </template>
        <Icon v-else name="svg-spinners:8-dots-rotate" size="24px" class="size-6 text-muted-foreground" />
    </div>
</template>