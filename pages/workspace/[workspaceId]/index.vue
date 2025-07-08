<script setup lang="ts">
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';

definePageMeta({
    layout: 'workspace'
})

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
        // Navigate to workspace first channel's page
        navigateTo(`/workspace/${workspaceData.workspace.value.workspace._id}/channel/${workspaceData.channels.value.channels[0]._id}`)
    } else if (!workspaceData.createCNModalOpen.value) {
        const isAdmin = auth.user?.id && auth.user.id === workspaceData.workspace.value?.workspace?.user_id
        // or open the create channel modal
        // user (admin) cannot close it here
        isAdmin && workspaceData.openCreateChannelModal()
    }
}

onMounted(() => {
    // Run this check when user accesses directly from browser url bar
    if (!window.history.state.back) checkWorkspaceChannels()
})

watch([
    workspaceData.workspace,
    workspaceData.channels,
    workspaceData.workspaceLoadStatus,
    workspaceData.channelsLoadStatus,
    workspaceData.membersLoadStatus,
    workspaceData.createCNModalOpen,
], () => {
    if (workspaceData.workspaceLoadStatus.value !== 'success'
        || workspaceData.channelsLoadStatus.value !== 'success'
        || workspaceData.membersLoadStatus.value !== 'success') return

    // This will run when user navigates from other pages
    checkWorkspaceChannels()
})
</script>

<template>
    <div class="h-full flex flex-col flex-1 items-center justify-center gap-1">
        <template v-if="isLoading">
            <Icon name="svg-spinners:8-dots-rotate" size="20px" class="size-5 text-muted-foreground" />
        </template>
        <template v-else-if="isError || !workspaceData.members.value?.members?.length">
            <Icon name="lucide:triangle-alert" size="20px" class="size-5 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">Workspace not found</span>
        </template>
        <template v-else-if="!workspaceData.channels.value?.channels?.length">
            <Icon name="lucide:triangle-alert" size="20px" class="size-5 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">No channel found</span>
        </template>
    </div>
</template>