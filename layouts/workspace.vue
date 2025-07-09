<script setup lang="ts">
import { provideWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import { provideChannelData } from '~/composables/channel/useChannelData';
import { provideConversationData } from '~/composables/conversation/useConversationData';
import { provideThreadPanel } from '~/composables/workspace/useThreadPanel';
import SidebarWorkspace from '~/components/workspace/SidebarWorkspace.vue';
import { provideMemberProfileControl } from '~/composables/profile/useMemberProfile';
import Profile from '~/components/member/Profile.vue';

const route = useRoute();

// Workspace data
const workspaceId = computed(() => String(route.params['workspaceId']))

const workspaceData = await provideWorkspaceData(workspaceId)
workspaceData.provide()

// Channel data (initially empty)
const channelData = provideChannelData(workspaceId)
channelData.provide()

// Conversation data (initially empty)
const conversationData = await provideConversationData(workspaceId)
conversationData.provide()

// Thread panel
const threadControl = await provideThreadPanel()
threadControl.provide()

// Member profile control
const memberProfile = await provideMemberProfileControl()
memberProfile.provide()

const isLoading = computed(() => {
    if (!import.meta.browser) return true

    const currentRouteName = route.name

    if (currentRouteName === 'workspace-workspaceId')
        return false

    if (currentRouteName === 'workspace-workspaceId-channel-channelId') {
        return workspaceData.data.workspace.value == null
            && channelData.data.data.value == null
    }

    if (currentRouteName === 'workspace-workspaceId-member-memberId') {
        return workspaceData.data.workspace.value == null
            && conversationData.data.data.value == null
    }

    return true
})

const panelOpen = computed(() => !!threadControl.data.parentMessageId?.value || !!memberProfile.data.profileMembershipId?.value)
</script>

<template>
    <NuxtLayout name="default">
        <div v-show="!isLoading" class="h-full transition-opacity duration-300 data-[ready=true]:opacity-100">
            <WorkspaceToolbar />
            <div class="flex h-[calc(100vh-40px)]">
                <WorkspaceSidebar />
                <ResizablePanelGroup id="workspace-resizable-group" direction="horizontal"
                    auto-save-id="__nuxt_slack_resizable_size">
                    <!-- Workspace sidebar -->
                    <ResizablePanel id="workspace-resizable-panel-1" :default-size="20" :min-size="11"
                        class="bg-[#5e2c5f]">
                        <SidebarWorkspace />
                    </ResizablePanel>

                    <!-- Message list & chat input -->
                    <ResizableHandle id="workspace-resizable-handle" :with-handle="true" :default-size="80" />
                    <ResizablePanel id="workspace-resizable-panel-2" :min-size="20">
                        <slot></slot>
                    </ResizablePanel>

                    <!-- Thread & profile panel -->
                    <template v-if="panelOpen">
                        <ResizableHandle :with-handle="true" id="workspace-thread-panel-handle" />
                        <ResizablePanel :min-size="20" :default-size="29" id="workspace-thread-panel-panel">
                            <Thread v-if="!!threadControl.data.parentMessageId?.value"
                                @on-close="threadControl.data.closeThreadPanel()" />
                            <Profile v-else @on-close="memberProfile.data.closeProfilePanel()" />
                        </ResizablePanel>
                    </template>
                </ResizablePanelGroup>
            </div>
        </div>

        <div v-if="isLoading" class="fixed top-0 left-0 size-full bg-white flex items-center justify-center z-10">
            <Icon name="svg-spinners:8-dots-rotate" size="24px" class="size-6" />
        </div>
    </NuxtLayout>
</template>