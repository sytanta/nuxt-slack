<script setup lang="ts">
import useWorkspacesStore from '~/stores/workspaces'

const workspacesStore = useWorkspacesStore()

setPageSEO(() => 'Nuxt Slack')

watchEffect(() => {
    if (!workspacesStore.workspaces.length && !workspacesStore.createWSModalOpen) {
        // If user has no workspace, display a modal for creating anew
        // user cannot close this modal here
        workspacesStore.openCreateWorkspaceModal?.()
    } else if (!workspacesStore.createWSModalOpen) {
        navigateTo(`/workspace/${workspacesStore.workspaces[0]._id}`) // or redirect to the 1st workspace
    }
})
</script>

<template></template>