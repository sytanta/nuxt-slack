<script setup lang="ts">
import { format } from 'date-fns';
import { VisuallyHidden } from 'reka-ui';
import { toast } from 'vue-sonner';
import { Picker } from 'emoji-mart'

import type { Id } from '~/convex/_generated/dataModel';
import type { EditorValue, Message, WorkspaceMemberUser } from '~/lib/types';
import formatFullTime from '~/lib/formatFullTime';
import ConfirmModal from './ConfirmModal.vue';

const {
    data,
    compact,
    hideThreadButton,
    authorUser,
    currentUserWorkspaceMembershipId,
    isAuthor,
    isEditing,
    setEditingId,
    updateMessage,
    toggleReaction,
    deleteMessage
} = defineProps<{
    data: Message;
    compact?: boolean;
    hideThreadButton: boolean;
    authorUser: WorkspaceMemberUser | undefined;
    currentUserWorkspaceMembershipId: Id<'members'>;
    isAuthor: boolean;
    isEditing: boolean;
    setEditingId: (id: Id<'messages'> | null) => void;
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
    deleteMessage?: (messageId: Id<'messages'>,
        creationTime?: number) => Promise<void> | void;
}>()

const emit = defineEmits(['on-open-thread-panel', 'on-open-profile-panel'])

// Message content renderer
const Renderer = defineAsyncComponent(() => import('~/components/MessageRenderer.vue'))

// Toolbar & emoji control
const toolbarShow = ref(false)
const emojiDialogAdded = ref(false)
const emojiDialogShow = ref(true)

const showToolbar = () => toolbarShow.value = true
const hideToolbar = () => toolbarShow.value = false

const addEmojiDialog = () => emojiDialogAdded.value = true

const handleToggleEmoji = (value: string) => {
    toggleReaction(value, data, currentUserWorkspaceMembershipId, {
        onError: () => toast.error('Failed to toggle reaction')
    })

    hideEmojiDialog()
}

const showEmojiPicker = (element: Element | ComponentPublicInstance | null) => {
    const picker = new Picker({
        data: async () => {
            const response = await fetch(
                'https://cdn.jsdelivr.net/npm/@emoji-mart/data',
            )

            return response.json()
        },
        navPosition: 'none',
        onEmojiSelect: (emoji: { native: string }) => {
            // Update the shared message data
            handleToggleEmoji(emoji.native)
        }
    })

    element && (element as Element).appendChild(picker as unknown as Node)
}

const hideEmojiDialog = () => {
    emojiDialogShow.value = false
    setTimeout(() => {
        emojiDialogAdded.value = false
        emojiDialogShow.value = true
    }, 250) // wait for dialog animation to finish
}

// Edit message content
const onSubmitEditEditor = (editorData: EditorValue) => {
    // Update the shared message data
    updateMessage(editorData.message, data, { onError: () => toast.error('Failed to edit message') })

    closeEditEditor()
}

const closeEditEditor = () => setEditingId(null)

// Open thread & profile panel
const openThreadPanel = () => emit('on-open-thread-panel', data)
const openProfilePanel = () => emit('on-open-profile-panel', data.member_id)

// Delete message confirm modal
const { openModal } = useConfirmModal()

const dateHint = formatFullTime(new Date(data._creationTime))

const showDeleteMessageModal = () => {
    openModal(ConfirmModal, {
        onConfirm: () => deleteMessage?.(data._id, data._creationTime),
        title: 'Delete message',
        message: 'Are your sure you want to delete this message? This cannot be undone.'
    })
}
</script>

<template>
    <div @touchstart="showToolbar" @touchend="hideToolbar" @mouseenter="showToolbar" @mouseleave="hideToolbar"
        :data-editing="isEditing"
        class="flex flex-col gap-2 py-1.5 px-5 group relative hover:bg-gray-100/60 data-[editing=true]:bg-[#f2c74433] data-[editing=true]:hover:bg-[#f2c74433]">
        <div v-if="compact" class="flex items-start gap-2">
            <Hint :label="dateHint">
                <button
                    class="w-10 leading-[22px] text-xs text-muted-foreground text-center opacity-0 group-hover:opacity-100 hover:underline">
                    {{ format(new Date(data._creationTime), 'hh:mm') }}
                </button>
            </Hint>
            <div v-if="isEditing" class="size-full">
                <Editor variant="update" :default-value="JSON.parse(data.message || '')" :onSubmit="onSubmitEditEditor"
                    :onCancel="closeEditEditor" />
            </div>
            <div v-else class="flex flex-col w-full">
                <component :is="Renderer" :data="data" />
                <FileThumnail :url="data.image" />
                <span v-if="data.updated_at" class="text-xs text-muted-foreground">(edited)</span>
                <MessageReactions :workspace-id="data.workspace_id"
                    :user-membership-id="currentUserWorkspaceMembershipId" :reactions="data.reactions"
                    :handle-toggle-emoji="handleToggleEmoji" :open-emoji-dialog="addEmojiDialog" />
                <MessageItemThreadBar v-if="'replies' in data && data.replies.count && data.replies.timestamp"
                    :replies="data.replies" :onClick="openThreadPanel" />
            </div>
        </div>

        <div v-else class="flex items-start gap-2">
            <button @click="openProfilePanel" class="w-10">
                <Avatar>
                    <AvatarImage :src="authorUser?.avatar || ''"></AvatarImage>
                    <AvatarFallback>
                        {{ (authorUser?.name || data.member_name)?.[0].toUpperCase() }}
                    </AvatarFallback>
                </Avatar>
            </button>
            <div v-if="isEditing" class="size-full">
                <Editor variant="update" :default-value="JSON.parse(data.message || '')" :onSubmit="onSubmitEditEditor"
                    :onCancel="closeEditEditor" />
            </div>
            <div v-else class="flex flex-col w-full overflow-hidden">
                <div class="text-sm flex items-center gap-x-3">
                    <button @click="openProfilePanel" class="font-bold text-primary hover:underline">{{ data.member_name
                        }}</button>
                    <Hint :label="dateHint">
                        <button class="text-xs text-muted-foreground hover:underline">
                            {{ format(new Date(data._creationTime), 'h:mm a') }}
                        </button>
                    </Hint>
                </div>
                <component :is="Renderer" :data="data" />
                <FileThumnail :url="data.image" />
                <span v-if="data.updated_at" class="text-xs text-muted-foreground">(edited)</span>
                <MessageReactions :workspace-id="data.workspace_id"
                    :user-membership-id="currentUserWorkspaceMembershipId" :reactions="data.reactions"
                    :handle-toggle-emoji="handleToggleEmoji" :open-emoji-dialog="addEmojiDialog" />
                <MessageItemThreadBar v-if="'replies' in data && data.replies.count && data.replies.timestamp"
                    :replies="data.replies" :onClick="openThreadPanel" />
            </div>
        </div>

        <MessageToolbar v-if="!isEditing && toolbarShow" :is-author="isAuthor" :is-pending="false"
            :hide-thread-button="hideThreadButton" :open-emoji-dialog="addEmojiDialog"
            @on-set-editing="setEditingId(data._id)" @on-open-thread-panel="emit('on-open-thread-panel', data)"
            @on-delete="showDeleteMessageModal" />
    </div>

    <Dialog v-if="emojiDialogAdded" :open="emojiDialogShow">
        <DialogContent :hide-close-button="true" @pointer-down-outside="hideEmojiDialog"
            @escape-key-down="hideEmojiDialog" class="w-fit p-0 border-none shadow-none z-100">
            <VisuallyHidden>
                <DialogTitle>Select emoji</DialogTitle>
                <DialogDescription>Add message reaction</DialogDescription>
            </VisuallyHidden>
            <div :ref="showEmojiPicker"></div>
        </DialogContent>
    </Dialog>
</template>