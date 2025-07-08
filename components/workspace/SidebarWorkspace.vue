<script setup lang="ts">
import type { Doc } from '~/convex/_generated/dataModel';
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import Section from './Section.vue';
import UserItem from './UserItem.vue';

const route = useRoute()
const authStore = useAuthStore()
const workspaceData = injectWorkspaceData()

const currentChannelId = computed(() => route.params['channelId'])
const otherMembershipId = computed(() => route.params['memberId'])

const isAdmin = computed(() => {
    const memberShip = workspaceData.members.value.members.find(({ _id }) => _id === authStore.user?.id)
    return memberShip?.is_admin
})

const isLoading = computed(() =>
    workspaceData?.workspaceLoadStatus.value === 'idle'
    || workspaceData?.workspaceLoadStatus.value === 'pending'
    || workspaceData?.membersLoadStatus.value === 'idle'
    || workspaceData?.membersLoadStatus.value === 'pending'
)

const isError = computed(() =>
    workspaceData?.workspaceLoadStatus.value === 'error'
    || workspaceData?.membersLoadStatus.value === 'error'
)

const notFound = computed(() => !workspaceData.workspace.value || !workspaceData.members.value)

const onCreateChannelSucess = (channel: Doc<'channels'>) => {
    workspaceData.onAddNewChannelSuccess(channel)
    navigateTo(`/workspace/${channel.workspace_id}/channel/${channel._id}`) // navigate to the newly created channel
} 
</script>

<template>
    <template v-if="isLoading">
        <div class="flex flex-col bg-[#5e2c5f] h-full items-center justify-center">
            <Icon name="svg-spinners:8-dots-rotate" size="20px" class="size-5 text-white" />
        </div>
    </template>
    <template v-else-if="isError || notFound">
        <div class="flex flex-col gap-1 bg-[#5e2c5f] h-full items-center justify-center">
            <Icon name="lucide:triangle-alert" size="20px" class="size-5 text-white" />
            <p class="text-white text-sm">Workspace not found</p>
        </div>
    </template>
    <template v-else>
        <div class="flex flex-col bg-[#5e2c5f] h-full">
            <WorkspaceHeader />
            <div class="flex flex-col px-2 mt-3">
                <WorkspaceSidebarItem id="threads" label="Threads" icon-name="lucide:message-square-text" />
                <WorkspaceSidebarItem id="drafts" label="Drafts and Sent" icon-name="lucide:send-horizontal" />
            </div>

            <Section label="Channels" hint="New channel" :is-admin="!!isAdmin"
                :handle-new="workspaceData.openCreateChannelModal">
                <WorkspaceSidebarItem v-for="channel of (workspaceData.channels.value?.channels || [])"
                    :key="channel._id" :id="channel._id" :label="channel.name" icon-name="lucide:hash"
                    :variant="currentChannelId === channel._id ? 'active' : 'default'" />
            </Section>

            <Section label="Direct Messages" hint="New direct message" :is-admin="!!isAdmin" :handle-new="() => { }">
                <UserItem v-for="member of workspaceData.members.value?.members || []" :key="member._id"
                    :membership-id="member.membership_id" :label="member.name" :image="member.avatar"
                    :workspace-id="String(workspaceData.workspace.value?.workspace?._id)"
                    :variant="otherMembershipId === member.membership_id ? 'active' : 'default'" />
            </Section>
        </div>
    </template>

    <ChannelCreateChannelModal :open="workspaceData.createCNModalOpen.value"
        @on-close="workspaceData.closeCreateChannelModal" :on-success="onCreateChannelSucess"
        @on-post-success="workspaceData.closeCreateChannelModal" />
</template>