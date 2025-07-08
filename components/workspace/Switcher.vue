<script setup lang="ts">
import useWorkspacesStore from '~/stores/workspaces';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';

const workspacesStore = useWorkspacesStore()
const workspaceData = injectWorkspaceData()

const filteredWorkspaces = computed(() => (workspacesStore.workspaces || []).filter(({ _id }) => _id !== workspaceData.workspace.value?.workspace?._id))

const isLoading = computed(() =>
    workspaceData.workspaceLoadStatus.value === 'idle'
    || workspaceData.workspaceLoadStatus.value === 'pending'
)

const notFound = computed(() => workspaceData.workspaceLoadStatus.value === 'error' || !workspaceData.workspace?.value)

const openWorkspace = async (id: string | undefined) => {
    if (id) await navigateTo(`/workspace/${id}`)
}
</script>

<template>
    <DropdownMenu id="sidebar-workspaces-switcher">
        <DropdownMenuTrigger id="sidebar-workspaces-switcher-trigger">
            <span
                class="size-9 relative flex items-center justify-center overflow-hidden rounded-sm bg-[#ababad] hover:bg-[#ababad]/80 text-slate-800 font-semibold text-xl">
                <template v-if="isLoading">
                    <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                </template>
                <template v-else-if="notFound">
                    <Icon name="lucide:triangle-alert" size="16px" class="size-4" />
                </template>
                <template v-else>
                    {{ workspaceData.workspace.value?.workspace?.name?.[0].toUpperCase() }}
                </template>
            </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" class="w-64" id="sidebar-workspaces-switcher-content">
            <DropdownMenuItem @select="openWorkspace(workspaceData.workspace.value?.workspace?._id)"
                class="cursor-pointer flex-col gap-0 justify-start items-start capitalize">
                {{ workspaceData.workspace.value?.workspace?.name }}
                <span class="text-xs text-muted-foreground">Active workspace</span>
            </DropdownMenuItem>
            <DropdownMenuItem v-for="ws of filteredWorkspaces" :key="ws._id" :as-child="true"
                class="cursor-pointer capitalize overflow-hidden" :id="`sidebar-workspaces-switcher-item-${ws._id}`">
                <NuxtLink :href="`/workspace/${ws._id}`" class="block cursor-pointer capitalize overflow-hidden">
                    <div
                        class="size-9 shrink-0 relative overflow-hidden bg-[#616061] text-white font-semibold text-lg rounded-md flex items-center justify-center mr-2">
                        {{ ws.name[0].toUpperCase() }}</div>
                    <p class="truncate">{{ ws.name }}</p>
                </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem @select="workspacesStore.openCreateWorkspaceModal" class="cursor-pointer"
                id="sidebar-workspaces-switcher-content-create">
                <div
                    class="size-9 relative overflow-hidden bg-[#f2f2f2] text-slate-800 font-semibold text-lg rounded-md flex items-center justify-center mr-2">
                    <Icon name="lucide:plus" />
                </div>
                Create a new workspace
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>