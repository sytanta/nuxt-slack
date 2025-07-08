<script setup lang="ts">
import type { Id } from '~/convex/_generated/dataModel';

const {
    workspaceId,
    userMembershipId,
    reactions,
    handleToggleEmoji,
    openEmojiDialog
} = defineProps<{
    workspaceId: Id<'workspaces'>;
    userMembershipId: Id<'members'>;
    reactions: [string, Id<'members'>[]][],
    handleToggleEmoji: (value: string) => void;
    openEmojiDialog: () => void
}>()
</script>

<template>
    <div v-if="reactions.length" class="flex flex-wrap items-center gap-1 my-1">
        <button v-for="[emoji, memberList] of reactions" :key="emoji"
            :data-active="memberList.includes(userMembershipId)" @click="handleToggleEmoji(emoji)"
            class="h-6 px-2 rounded-full bg-slate-200/70 border border-transparent text-muted-foreground flex items-center gap-x-1 data-[active=true]:bg-blue-100/70 data-[active=true]:border-blue-500 data-[active=true]:text-blue-500">
            {{ emoji }}
            <span class="text-xs font-semibold">{{ memberList.length }}</span>
        </button>
        <button @click="openEmojiDialog"
            class="h-6 px-3 rounded-full bg-slate-200/70 border border-transparent hover:border-slate-500 text-slate-800 flex items-center gap-x-1">
            <Icon name="lucide:smile-plus" size="16px" class="size-4" />
        </button>
    </div>
</template>