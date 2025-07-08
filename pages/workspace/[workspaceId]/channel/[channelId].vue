<script setup lang="ts">
import type { ChannelData, MessagesData } from '~/lib/types'
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData'
import { injectChannelData } from '~/composables/channel/useChannelData'
import type { AsyncDataRequestStatus } from '#app'

definePageMeta({
    layout: 'workspace'
})

const route = useRoute()
const channelId = computed(() => String(route.params['channelId']))

const workspaceData = injectWorkspaceData()
const {
    orderedMessages,
    setChannelData,
    setPaginatedMessagesData,
    addMessage,
    canLoadMore,
    loadMore,
    loadingMore,
    updateMessage,
    toggleReaction,
    deleteMessage
} = injectChannelData()

const { data, status }: {
    data: Ref<{
        channel: ChannelData,
        messages: MessagesData
    }>;
    status: Ref<AsyncDataRequestStatus, AsyncDataRequestStatus>
} = await useLazyFetch(() =>
    `/api/channel/${channelId.value}`)

setPageSEO(() => data.value?.channel.name ? `# ${data.value?.channel.name}` : 'Nuxt Slack')

// Watch & clean up
watch(data, (data) => {
    if (data) {
        setChannelData(data.channel)
        setPaginatedMessagesData(data)
    }
}, { immediate: true })

onBeforeRouteUpdate((to) => {
    // Clear channel data right before navigating to another channel to prevent the above "useLazyFetch"
    // to use the previous "channelId" value
    if (to.params['channelId'] !== channelId.value) setChannelData(null)
})

onBeforeRouteLeave(() => setChannelData(null)) // also clean up when user goes to a different route

// Loading states
const isLoading = computed(() => workspaceData.membersLoadStatus.value === 'idle'
    || workspaceData.membersLoadStatus.value === 'pending'
    || status.value === 'idle'
    || status.value === 'pending')

const isError = computed(() => workspaceData.membersLoadStatus.value === 'error'
    || status.value === 'error'
    || !data?.value?.channel)
</script>

<template>
    <div v-if="isLoading" class="h-full flex flex-1 items-center justify-center">
        <Icon name="svg-spinners:8-dots-rotate" size="24px" class="size-6 text-muted-foreground" />
    </div>
    <div v-if="isError" class="h-full flex flex-col flex-1 items-center justify-center gap-1">
        <Icon name="lucide:triangle-alert" size="24px" class="size-6 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">Channel not found</span>
    </div>
    <template v-else>
        <div class="h-full flex flex-col">
            <ChannelHeader :title="data!.channel.name" />

            <MessageList :data="orderedMessages" variant="channel" :channelName="data.channel.name"
                :channelCreationTime="data.channel._creationTime" :canLoadMore="canLoadMore" :loadMore="loadMore"
                :loadingMore="loadingMore" :updateMessage="updateMessage" :toggleReaction="toggleReaction"
                :deleteMessage="deleteMessage" />

            <ChatInput :placeholder="`Message # ${data!.channel.name}`" :channelId="channelId"
                :onAddMessage="addMessage" />
        </div>
    </template>
</template>