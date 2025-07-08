<script setup lang="ts">
import { toast } from 'vue-sonner';
import { differenceInMinutes } from 'date-fns';

import type { Id } from '~/convex/_generated/dataModel';
import type { Message, MessageListGroupedByDate, PaginatedMessageList } from '~/lib/types';
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import { injectThreadPanelControl } from '~/composables/workspace/useThreadPanel';
import { injectMemberProfileControl } from '~/composables/profile/useMemberProfile';
import formatDateGroupLabel from '~/lib/formatDateGroupLabel';
import MessageItem from './MessageItem.vue';

const {
    data,
    channelName,
    channelCreationTime,
    variant,
    otherMemberName,
    otherMemberImage,
    canLoadMore,
    loadMore,
    loadingMore,
    updateMessage,
    toggleReaction,
    deleteMessage
} = defineProps<{
    data: MessageListGroupedByDate,
    channelName?: string;
    channelCreationTime?: number;
    variant?: "channel" | "thread" | "conversation";
    otherMemberName?: string;
    otherMemberImage?: string;
    canLoadMore: boolean;
    loadMore: (options?: {
        onSuccess?: () => void;
        onError?: () => void;
    }) => void;
    loadingMore: boolean;
    updateMessage: (
        newContent: string,
        targetMessage: Message,
        options?: {
            onSuccess?: () => void;
            onError?: () => void;
        }
    ) => void;
    toggleReaction: (
        value: string,
        targetMessage: Message,
        userWorkspaceMembershipId: Id<"members">,
        options?: {
            onSuccess?: () => void;
            onError?: () => void;
        }
    ) => void;
    deleteMessage: (
        message_id: Id<"messages">,
        creationTime: number,
        options?: {
            onBeforeDelete?: () => void;
            onSuccess?: () => void;
            onError?: () => void;
        }
    ) => void;
}>()

const config = useRuntimeConfig()
const auth = useAuthStore()
const workspaceData = injectWorkspaceData()
const {
    parentMessageId,
    setParentMessage,
    clearData,
    openThreadPanel,
    closeThreadPanel
} = injectThreadPanelControl()
const { openProfilePanel, closeProfilePanel } = injectMemberProfileControl()

// Work with the raw message list to prevent unneccessary re-rendering of current items
// when adding new messages
let rawMessageList = unref(data)

watch(parentMessageId, (messageId) => {
    if (!messageId) return

    let foundMessage: Message | null = null
    for (const [_, messages] of rawMessageList) {
        const found = messages.find(({ _id }) => _id === parentMessageId.value)
        if (found) {
            foundMessage = found
            break
        }
    }

    if (foundMessage) {
        setParentMessage(foundMessage)
    }
}, { immediate: true })

// Thread/profile panel control
const handleOpenThreadPanel = (message: Message) => {
    if (message._id !== parentMessageId.value) clearData()
    openThreadPanel(message)
    closeProfilePanel()
}

const handleOpenProfilePanel = (membershipId: string) => {
    closeThreadPanel()
    openProfilePanel(membershipId as Id<'members'>)
}

// Load more control
const handleLoadMore = () => {
    loadMore?.({ onError: () => toast.error('Failed to load more messages') })
}

let observer: IntersectionObserver | null = null
const defineObserver = (e: Element | globalThis.ComponentPublicInstance | null) => {
    if (!e) return

    observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && canLoadMore) handleLoadMore()
            if (!canLoadMore) observer?.disconnect()
        },
        { threshold: 1.0 }
    )

    observer.observe(e as Element)
}

onUnmounted(() => observer?.disconnect())

// Message's variant
const isCompact = (
    currentMessage: PaginatedMessageList["page"][number],
    previousMessage: PaginatedMessageList["page"][number] | undefined
) => {
    return previousMessage?._id
        && previousMessage.member_id === currentMessage.member_id
        && differenceInMinutes(
            new Date(currentMessage._creationTime),
            new Date(previousMessage._creationTime)
        ) < Number(config.public.timeThreshold)
}

// Message id selected for editing
const editingId = ref<Id<'messages'> | null>(null)
const setEditingId = (id: Id<'messages'> | null) => editingId.value = id

// Delete message
const handleDeleteMessage = (messageId: Id<'messages'>, creationTime?: number) => {
    deleteMessage(messageId, creationTime!, {
        onBeforeDelete: () => {
            // Close thread panel
            if (!parentMessageId) closeThreadPanel
        },
        onSuccess: () => toast.success('Message deleted'),
        onError: () => toast.error('Failed to delete message')
    })
}
</script>

<template>
    <ClientOnly>
        <div class="messages-scollbar flex-1 flex flex-col-reverse pb-4 overflow-y-auto">
            <div v-for="item of rawMessageList || []" :key="item[0]">
                <div class="text-center my-2 relative">
                    <hr class="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                    <span
                        class="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                        {{ formatDateGroupLabel(item[0]) }}
                    </span>
                </div>
                <MessageItem v-for="(message, index) of item[1]" :key="message._id" :data="message"
                    :compact="isCompact(message, item[1][index - 1])" :hide-thread-button="variant === 'thread'"
                    :author-user="workspaceData.membersObj.value[message.member_id]"
                    :current-user-workspace-membership-id="workspaceData.workspace.value?.workspace?.user_membership_id"
                    :is-author="workspaceData.membersObj.value[message.member_id]?._id === auth.user?.id"
                    :is-editing="editingId === message._id" :set-editing-id="setEditingId"
                    :update-message="updateMessage" :toggle-reaction="toggleReaction"
                    :delete-message="handleDeleteMessage" @on-open-thread-panel="handleOpenThreadPanel"
                    @on-open-profile-panel="handleOpenProfilePanel" />
            </div>

            <div class="h-1" :ref="defineObserver"></div>
            <div v-if="loadingMore" class="text-center my-2 relative">
                <hr class="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                <span
                    class="relative inline-flex items-center justify-center bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                    <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                </span>
            </div>

            <MessageListChannelHero v-if="variant === 'channel' && channelName && channelCreationTime"
                :name="channelName" :creation-time="channelCreationTime" />

            <MemberConversationHero v-if="variant === 'conversation' && (otherMemberName || otherMemberImage)"
                :name="otherMemberName" :image="otherMemberImage" />
        </div>
    </ClientOnly>
</template>