<script setup lang="ts">
import { toast } from 'vue-sonner';

import useWorkspacesStore from '~/stores/workspaces';

const route = useRoute();
const workspacesStore = useWorkspacesStore()
const workspaceId = route.params['workspaceId']

const { data } = await useFetch(`/api/workspace/${workspaceId}/info`)
if (data.value?.workspace.isMember) navigateTo("/"); // Redirect if user is already a member

setPageSEO(() => data.value?.workspace.name
    ? `Join ${data.value?.workspace.name} workspace`
    : 'Nuxt Slack')

// Main title & processing state
const title = ['Join', data?.value?.workspace.name, 'workspace'].filter(Boolean).join(' ')
const processing = ref(false)

const submit = (joinCode: string) => {
    if (processing.value) return
    processing.value = true

    $fetch(`/api/workspace/${workspaceId}/join`, { method: 'POST', body: { joinCode } }).then(async () => {
        await workspacesStore.refresh()
        await navigateTo(`/workspace/${workspaceId}`)
        toast.success('Workspace joined')
    }).catch((e) => {
        toast.error(e.message || 'Failed to join workspace')
    }).finally(() => processing.value = false)
}
</script>

<template>
    <div class="h-full flex flex-col items-center justify-center gap-y-8 bg-white p-8 rounded-lg shadow-md">
        <img src="/logo.svg" alt="Logo" width="60" height="60" />
        <div class="flex flex-col items-center justify-center gap-y-4 max-w-md">
            <div class="flex flex-col items-center justify-between gap-y-2">
                <h1 class="text-2xl font-bold">{{ title }}</h1>
                <p class="text-md text-muted-foreground">Enter the workspace code to join</p>
            </div>

            <VerificationInput @on-complete="submit" :disabled="processing" />
        </div>

        <div class="flex gap-x-4">
            <Button variant="outline" size="lg" :as-child="true">
                <NuxtLink href="/" class="w-36 h-10">
                    <template v-if="processing">
                        <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                    </template>
                    <template v-else>Back to home</template>
                </NuxtLink>
            </Button>
        </div>
    </div>
</template>