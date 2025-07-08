<script setup lang="ts">
import { toast } from 'vue-sonner';

import type { EditorValue } from '~/lib/types';
import type { Id } from '~/convex/_generated/dataModel';
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import Editor from './Editor.vue';

const { placeholder, channelId, conversationId, onAddMessage } = defineProps<{
    placeholder: string,
    channelId?: string,
    conversationId?: string,
    onAddMessage?: (
        message: string,
        image: File | null,
        user_id: Id<"users">,
        user_name: string,
        user_workspace_member_id: Id<"members">,
        channel_id?: Id<"channels">,
        conversation_id?: Id<'dm_conversations'>,
        options?: {
            onSuccess?: () => void;
            onError?: () => void;
        }) => void;
}>()

// const route = useRoute()
const auth = useAuthStore()
const workspaceData = injectWorkspaceData()

// const channelId = computed(() => route.params['channelId'])

const handleSubmit = async (content: EditorValue) => {
    onAddMessage?.(
        content.message,
        content.image,
        auth.user!.id as Id<"users">,
        auth.user!.name,
        workspaceData.workspace.value.workspace.user_membership_id,
        channelId as Id<'channels'>,
        conversationId as Id<'dm_conversations'>,
        {
            onError: () => toast.error('Failed to send message')
        })
}
</script>

<template>
    <div class="w-full px-5">
        <ClientOnly>
            <Editor :placeholder="placeholder" :onSubmit="handleSubmit" />
        </ClientOnly>
    </div>
</template>