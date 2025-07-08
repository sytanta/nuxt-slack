<script setup lang="ts">
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';

const { workspace, channels, members } = injectWorkspaceData()

const searchOpen = ref(false)
const setSearchOpen = (open: boolean) => searchOpen.value = open
</script>

<template>
    <nav class="bg-[#481349] flex items-center justify-between h-10 p-1.5">
        <div class="flex-1"></div>
        <div class="min-w-[280px] max-w-[642px] grow-[2] shrink">
            <Button size="sm" @click="setSearchOpen(true)"
                class="bg-accent/25 hover:bg-accent-25 w-full justify-start h-7 px-2">
                <Icon name="lucide:search" size="16px" class="text-white size-4 mr-2" />
                <span class="text-white text-xs">Search {{ workspace?.workspace?.name }}</span>
            </Button>
        </div>
        <div class="flex-1 flex items-center ml-auto justify-end">
            <Button variant="transparent" size="iconSm">
                <Icon name="lucide:info" size="20px" class="text-white size-5" />
            </Button>
        </div>
    </nav>

    <CommandDialog :open="searchOpen" @update:open="setSearchOpen">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Channels">
                <CommandItem v-for="channel of channels.channels" :key="channel._id" :value="channel._id"
                    :as-child="true" @select="setSearchOpen(false)" class="p-0">
                    <NuxtLink :href="`/workspace/${workspace.workspace._id}/channel/${channel._id}`"
                        class="w-full px-3 py-2 cursor-pointer">
                        {{ channel.name }}
                    </NuxtLink>
                </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Members">
                <CommandItem v-for="member of members.members" :key="member._id" :value="member._id" :as-child="true"
                    @select="setSearchOpen(false)" class="p-0">
                    <NuxtLink :href="`/workspace/${workspace.workspace._id}/member/${member.membership_id}`"
                        class="w-full px-3 py-2 cursor-pointer">
                        {{ member.name }}
                    </NuxtLink>
                </CommandItem>
            </CommandGroup>
        </CommandList>
    </CommandDialog>
</template>