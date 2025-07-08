<script setup lang="ts">
import { differenceInMinutes } from 'date-fns';
import { toast } from 'vue-sonner';

import type { Id } from '~/convex/_generated/dataModel';
import type { MessageListGroupedByDate, PaginatedMessageList } from '~/lib/types';
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import { injectThreadPanelControl } from '~/composables/workspace/useThreadPanel';
import { injectMemberProfileControl } from '~/composables/profile/useMemberProfile';
import formatDateGroupLabel from '~/lib/formatDateGroupLabel';

const { messages } = defineProps<{
    messages: MessageListGroupedByDate,
}>()

const config = useRuntimeConfig()
const auth = useAuthStore()
const workspaceData = injectWorkspaceData()
const { updateReply, toggleReaction, deleteReply, closeThreadPanel } = injectThreadPanelControl()
const { openProfilePanel } = injectMemberProfileControl()

const rawMessageList = unref(messages)

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

// Edit reply
const editingId = ref<Id<'messages'> | null>(null)
const setEditingId = (id: Id<'messages'> | null) => editingId.value = id

// Delete reply
const handleDeleteReply = (messageId: Id<'messages'>, creationTime?: number) => {
    deleteReply(messageId, creationTime!, {
        onSuccess: () => toast.success('Message deleted'),
        onError: () => toast.error('Failed to delete message')
    })
}

// Profile panel control
const handleOpenProfilePanel = (membershipId: string) => {
    closeThreadPanel()
    openProfilePanel(membershipId as Id<'members'>)
}
</script>

<template>
    <div v-for="item of rawMessageList || []" :key="item[0]">
        <div class="text-center my-2 relative">
            <hr class="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span
                class="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                {{ formatDateGroupLabel(item[0]) }}
            </span>
        </div>
        <MessageItem v-for="(message, index) of item[1]" :key="message._id" :data="message"
            :compact="isCompact(message, item[1][index - 1])" :hide-thread-button="true"
            :author-user="workspaceData.membersObj.value[message.member_id]"
            :current-user-workspace-membership-id="workspaceData.workspace.value?.workspace?.user_membership_id"
            :is-author="workspaceData.membersObj.value[message.member_id]?._id === auth.user?.id"
            :is-editing="editingId === message._id" :set-editing-id="setEditingId" :update-message="updateReply"
            :toggle-reaction="toggleReaction" :delete-message="handleDeleteReply"
            @on-open-profile-panel="handleOpenProfilePanel" />
    </div>
</template>