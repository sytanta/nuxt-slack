<script setup lang="ts">
import { toast } from 'vue-sonner';

import type { Id } from '~/convex/_generated/dataModel';
import type { EditorValue, Message } from '~/lib/types';
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import { injectChannelData } from '~/composables/channel/useChannelData';
import { injectConversationData } from '~/composables/conversation/useConversationData';
import { injectThreadPanelControl } from '~/composables/workspace/useThreadPanel';
import { injectMemberProfileControl } from '~/composables/profile/useMemberProfile';

const emit = defineEmits(['on-close'])

const auth = useAuthStore()
const workspaceData = injectWorkspaceData()
const channel = injectChannelData()
const conversation = injectConversationData()

const {
    parentMessage,
    parentMessageId,
    data,
    orderedMessages,
    loadStatus,
    canLoadMore,
    loadMore,
    loadingMore,
    addReply,
    closeThreadPanel
} = injectThreadPanelControl()
const { openProfilePanel } = injectMemberProfileControl()

// Loading messages & related data
const isLoading = computed(() =>
    !parentMessage.value
    || !orderedMessages
    || loadStatus.value === 'idle'
    || loadStatus.value === 'pending')

const isError = computed(() => loadStatus.value === 'error' || !data.value)

// Load more control
const handleLoadMore = () => {
    loadMore?.({ onError: () => toast.error('Failed to load more messages') })
}

let observer: IntersectionObserver | null = null
const defineObserver = (e: Element | globalThis.ComponentPublicInstance | null) => {
    if (!e) return

    observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && canLoadMore.value) handleLoadMore()
            if (!canLoadMore.value) observer?.disconnect()
        },
        { threshold: 1.0 }
    )

    observer.observe(e as Element)
}

onUnmounted(() => observer?.disconnect())

// Add a reply
const handleSubmit = async (content: EditorValue) => {
    addReply(
        content.message,
        content.image,
        parentMessageId.value! as Id<'messages'>,
        workspaceData.workspace.value.workspace._id,
        auth.user!.id as Id<"users">,
        auth.user!.name,
        workspaceData.workspace.value.workspace.user_membership_id,
        channel.data.value?._id,
        conversation.conversationId?.value,
        {
            onError: () => toast.error('Failed to send message')
        }
    )
}

// Editing parent message
const editingParentMessageId = ref<Id<'messages'> | null>(null)
const setEditingParentMessageId = (id: Id<'messages'> | null) => editingParentMessageId.value = id

const handleUpdateParentMessage = (
    newContent: string,
    targetMessage: Message,
    options?: {
        onSuccess?: () => void;
        onError?: () => void;
    }) => {

    if (channel.data.value) channel.updateMessage(newContent, targetMessage, options)
    else if (conversation.data.value?.conversationId) conversation.updateMessage(newContent, targetMessage, options)
}

// Toggle reactions to parent message
const handleToggleReaction = (
    value: string,
    targetMessage: Message,
    userWorkspaceMembershipId: Id<"members">,
    options?: {
        onSuccess?: () => void;
        onError?: () => void;
    }
) => {
    if (channel.data.value) channel.toggleReaction(value, targetMessage, userWorkspaceMembershipId, options)
    else if (conversation.data.value?.conversationId) conversation.toggleReaction(value, targetMessage, userWorkspaceMembershipId, options)
}

// Delete parent message
const handleDeleteParentMessage = (messageId: Id<'messages'>, creationTime?: number) => {
    const options = {
        onBeforeDelete: () => {
            // Close thread panel
            if (parentMessageId.value) closeThreadPanel()
        },
        onSuccess: () => toast.success('Message deleted'),
        onError: () => toast.error('Failed to delete message')
    }

    if (channel.data.value) channel.deleteMessage(messageId, creationTime!, options)
    else if (conversation.data.value?.conversationId) conversation.deleteMessage(messageId, creationTime!, options)
}

// Profile panel control
const handleOpenProfilePanel = (membershipId: string) => {
    closeThreadPanel()
    openProfilePanel(membershipId as Id<'members'>)
}
</script>

<template>
    <div class="h-full flex flex-col">
        <div class="flex shrink-0 items-center justify-between h-[49px] px-4 border-b">
            <p class="text-lg font-bold">Thread</p>
            <Button variant="ghost" size="iconSm" @click="emit('on-close')">
                <Icon name="lucide:x" size="20px" class="size-5 stroke-[1.5]" />
            </Button>
        </div>
        <div v-if="isLoading" class="h-full flex items-center justify-center">
            <Icon name="svg-spinners:8-dots-rotate" size="20px" class="size-5 text-muted-foreground" />
        </div>
        <div v-else-if="isError" class="h-full flex flex-col gap-y-1 items-center justify-center">
            <Icon name="lucide:triangle-alert" size="20px" class="size-5 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">Thread not found</p>
        </div>
        <template v-else>
            <ClientOnly>
                <div class="messages-scollbar flex-1 flex flex-col-reverse pb-4 overflow-y-auto">
                    <ThreadMessageList :messages="orderedMessages" />

                    <div class="h-1" :ref="defineObserver"></div>
                    <div v-if="loadingMore" class="text-center my-2 relative">
                        <hr class="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                        <span
                            class="relative inline-flex items-center justify-center bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                            <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                        </span>
                    </div>

                    <MessageItem :data="parentMessage" :hide-thread-button="true"
                        :author-user="workspaceData.membersObj.value[parentMessage.member_id]"
                        :current-user-workspace-membership-id="workspaceData.workspace.value?.workspace?.user_membership_id"
                        :is-author="workspaceData.membersObj.value[parentMessage.member_id]?._id === auth.user?.id"
                        :is-editing="!!editingParentMessageId" :set-editing-id="setEditingParentMessageId"
                        :toggle-reaction="handleToggleReaction" :update-message="handleUpdateParentMessage"
                        :delete-message="handleDeleteParentMessage" @on-open-profile-panel="handleOpenProfilePanel" />
                </div>

                <div class="px-4">
                    <Editor placeholder="Reply..." :onSubmit="handleSubmit" />
                </div>
            </ClientOnly>
        </template>
    </div>
</template>