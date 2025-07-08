<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns';

const {
    replies,
    onClick
} = defineProps<{
    replies: {
        count: number;
        name?: string;
        image?: string;
        timestamp: number;
    },
    onClick?: () => void
}>()
</script>

<template>
    <button @click="onClick"
        class="flex items-center justify-start group/thread-bar max-w-[600px] p-1 rounded-md border border-transparent transition hover:bg-white hover:border-border">
        <span class="flex items-center gap-2 overflow-hidden">
            <Avatar class="size-6 shrink-0">
                <AvatarImage :src="replies.image || ''"></AvatarImage>
                <AvatarFallback class="text-xs">{{ (replies.name || 'Member')[0].toUpperCase() }}</AvatarFallback>
            </Avatar>
            <span class="text-xs text-sky-700 font-bold truncate hover:underline">
                {{ [replies.count, replies.count > 1 ? 'replies' : 'reply'].join(' ') }}
            </span>
            <span class="text-xs text-muted-foreground truncate group-hover/thread-bar:hidden">
                Last reply {{ formatDistanceToNow(replies.timestamp, { addSuffix: true }) }}
            </span>
            <span class="text-xs text-muted-foreground truncate hidden group-hover/thread-bar:block">View thread</span>
        </span>
        <Icon name="lucide:chevron-right" size="16px"
            class="size-4 shrink-0 text-muted-foreground ml-auto transition opacity-0 group-hover/thread-bar:opacity-100" />
    </button>
</template>