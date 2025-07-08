<script setup lang="ts">
import useWorkspacesStore from '~/stores/workspaces';

const workspacesStore = useWorkspacesStore()

await workspacesStore.init()

const onCreateWorkspace = async () => {
    await workspacesStore.refresh()
    workspacesStore.closeCreateWorkspaceModal()
}
</script>

<template>
    <slot></slot>
    <!-- Create workspace modal is used in workspace detail and home pages -->
    <WorkspaceCreateWorkspaceModal :open="workspacesStore.createWSModalOpen"
        @on-close="workspacesStore.closeCreateWorkspaceModal" @on-create="onCreateWorkspace" />
    <!-- Toaster container -->
    <Toaster />
</template>