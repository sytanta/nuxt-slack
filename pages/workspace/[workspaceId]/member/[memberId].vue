<script setup lang="ts">
import type { Id } from '~/convex/_generated/dataModel'
import { injectConversationData } from '~/composables/conversation/useConversationData'
import { injectMemberProfileControl } from '~/composables/profile/useMemberProfile'

definePageMeta({
    layout: 'workspace'
})

const route = useRoute()
const otherMemberId = computed(() => String(route.params['memberId']))

const {
    data,
    orderedMessages,
    isLoading,
    isSuccess,
    canLoadMore,
    loadMore,
    loadingMore,
    setOtherMemberId,
    addMessage,
    updateMessage,
    toggleReaction,
    deleteMessage,
    clearData
} = injectConversationData()
const { openProfilePanel } = injectMemberProfileControl()

setPageSEO(() => data.value?.otherUser.name ? `# ${data.value?.otherUser.name}` : 'Nuxt Slack')

watch(otherMemberId, (id) => {
    if (id) setOtherMemberId(id as Id<'members'>)
}, { immediate: true })

// Watch & clean up
onBeforeRouteUpdate((to) => {
    // Clear conversation data right before navigating to another conversation
    if (to.params['memberId'] !== otherMemberId.value) clearData()
})

onBeforeRouteLeave(() => clearData()) // also clean up when user goes to a different route

// Profile panel control
const handleOpenProfilePanel = () => openProfilePanel(otherMemberId.value as Id<'members'>)
</script>

<template>
    <div v-if="isLoading" class="h-full flex flex-1 items-center justify-center">
        <Icon name="svg-spinners:8-dots-rotate" size="24px" class="size-6 text-muted-foreground" />
    </div>
    <div v-else-if="isSuccess" class="flex flex-col h-full">
        <MemberHeader :member-name="data?.otherUser.name" :member-image="data?.otherUser.avatar"
            :on-click="handleOpenProfilePanel" />

        <MessageList :data="orderedMessages" variant="conversation" :other-member-name="data?.otherUser.name"
            :other-member-image="data?.otherUser.avatar" :canLoadMore="canLoadMore" :loadMore="loadMore"
            :loadingMore="loadingMore" :updateMessage="updateMessage" :toggleReaction="toggleReaction"
            :deleteMessage="deleteMessage" />

        <ChatInput :placeholder="`Message # ${data?.otherUser.name}`" :conversation-id="data?.conversationId"
            :onAddMessage="addMessage" />
    </div>
    <div v-else class="h-full flex flex-col flex-1 items-center justify-center gap-1">
        <Icon name="lucide:triangle-alert" size="24px" class="size-6 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">Conversation not found</span>
    </div>
</template>