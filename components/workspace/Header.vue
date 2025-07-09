<script setup lang="ts">
import useAuthStore from '~/stores/auth'
import useWorkspacesStore from '~/stores/workspaces';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';

const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()
const workspaceData = injectWorkspaceData()

const isAdmin = computed(() => {
    const memberShip = workspaceData.members.value.members?.find(({ _id }) => _id === authStore.user?.id)
    return memberShip?.is_admin
})

// Invite & preferences modals control
const preferencesModalOpen = ref(false)
const inviteModalOpen = ref(false)

const openPreferencesModal = () => preferencesModalOpen.value = true
const closePreferencesModal = () => preferencesModalOpen.value = false

const openInviteModal = () => inviteModalOpen.value = true
const closeInviteModal = () => inviteModalOpen.value = false

const updateWorkspaceName = (newName: string) => {
    workspaceData.updateCurrentWorkspaceName(newName)
    workspacesStore.updateWorkspaceName(workspaceData.workspace.value.workspace._id, newName)
}
</script>

<template>
    <div class="flex items-center justify-between px-4 h-[49px] gap-0.5">
        <DropdownMenu id="dropdown-sidebar-workspace">
            <DropdownMenuTrigger id="dropdown-sidebar-workspace-trigger" :as-child="true">
                <Button variant="transparent" size="sm"
                    class="font-semibold shrink flex items-center gap-1 justify-between text-lg w-auto p-1.5 overflow-hidden">
                    <span class="truncate">{{ workspaceData.workspace.value?.workspace?.name }}</span>
                    <Icon name="lucide:chevron-down" size="16px" class="size-4 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" class="w-64" id="dropdown-sidebar-workspace-content">
                <DropdownMenuItem class="cursor-pointer capitalize" id="dropdown-sidebar-workspace-item-main">
                    <div
                        class="size-9 relative overflow-hidden bg-[#616061] text-white font-semibold text-xl rounded-md flex items-center justify-center mr-2">
                        {{
                            workspaceData.workspace.value?.workspace?.name[0].toUpperCase() }}</div>
                    <div class="flex flex-col items-start">
                        <p class="font-bold">{{
                            workspaceData.workspace.value?.workspace?.name }}</p>
                        <p class="text-xs text-muted-foreground">Active workspace</p>
                    </div>
                </DropdownMenuItem>
                <template v-if="isAdmin">
                    <DropdownMenuSeparator id="dropdown-sidebar-workspace-separator-1" />
                    <DropdownMenuItem @select="openInviteModal" class="cursor-pointer py-2"
                        id="dropdown-sidebar-workspace-item-invite">
                        Invite people to {{ workspaceData.workspace.value?.workspace?.name }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator id="dropdown-sidebar-workspace-separator-2" />
                    <DropdownMenuItem @select="openPreferencesModal" class="cursor-pointer py-2"
                        id="dropdown-sidebar-workspace-item-preferences">
                        Preferences
                    </DropdownMenuItem>
                </template>
            </DropdownMenuContent>
        </DropdownMenu>
        <div class="flex items-center gap-0.5">
            <Hint label="Filter conversations" side="bottom">
                <Button variant="transparent" size="iconSm">
                    <Icon name="lucide:list-filter" size="16px" class="size-4" />
                </Button>
            </Hint>
            <Hint label="New message" side="bottom">
                <Button variant="transparent" size="iconSm">
                    <Icon name="lucide:square-pen" size="16px" class="size-4" />
                </Button>
            </Hint>
        </div>
    </div>

    <WorkspaceInviteModal :open="inviteModalOpen" :close-modal="closeInviteModal"
        :workspace-name="workspaceData.workspace.value.workspace.name"
        :join-code="workspaceData.workspace.value.workspace.join_code" />

    <WorkspacePreferencesModal :open="preferencesModalOpen" :close-modal="closePreferencesModal"
        :initial-value="workspaceData.workspace.value?.workspace?.name" @on-rename="updateWorkspaceName" />
</template>