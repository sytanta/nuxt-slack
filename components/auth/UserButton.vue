<script setup lang="ts">
import useAuthStore from '~/stores/auth';
import useWorkspacesStore from '~/stores/workspaces';

const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()
const { user, isLoading } = storeToRefs(authStore)

const signOut = () => {
    $fetch('/api/auth/signout', { method: 'POST' })
        .then(workspacesStore.clear) // clear user's workspace data
        .then(() => { navigateTo('/auth') })
}
</script>

<template>
    <template v-if="isLoading">
        <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4 text-muted-foreground" />
    </template>
    <template v-else-if="user">
        <DropdownMenu id="sidebar-user-button" :modal="false">
            <DropdownMenuTrigger class="outline-none relative" id="sidebar-user-button-trigger">
                <Avatar class="size-10 transition hover:opacity-75">
                    <AvatarImage :src="user.avatar || ''" :alt="user.name" />
                    <AvatarFallback class="text-lg">
                        {{ user.name[0].toUpperCase() }}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="right" class="w-60" id="sidebar-user-button-content">
                <DropdownMenuItem @select="signOut" class="h-10" id="sidebar-user-button-item">
                    <Icon name="flowbite:arrow-right-to-bracket-solid" size="16px" class="size-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </template>
</template>