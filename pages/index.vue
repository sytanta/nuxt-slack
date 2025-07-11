<script setup lang="ts">
import useWorkspacesStore from '~/stores/workspaces'

const workspacesStore = useWorkspacesStore()

setPageSEO(() => 'Nuxt Slack')

watchEffect(() => {
    if (
        workspacesStore.status?.value === 'idle'
        || workspacesStore.status?.value === 'pending'
    ) return

    if (!workspacesStore.workspaces.length && !workspacesStore.createWSModalOpen) {
        // If user has no workspace, display a modal for creating anew
        // user cannot close this modal here
        workspacesStore.openCreateWorkspaceModal?.()
    } else if (!workspacesStore.createWSModalOpen) {
        navigateTo(`/workspace/${workspacesStore.workspaces[0]._id}`) // or redirect to the 1st workspace
    }
})
</script>

<template>
    <div class="h-full flex flex-col flex-1 items-center justify-center">
        <Icon name="svg-spinners:8-dots-rotate" size="24px" class="size-6 text-muted-foreground" />
    </div>
</template>