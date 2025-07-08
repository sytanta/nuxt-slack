<script setup lang="ts">
const route = useRoute()
</script>

<template>
    <aside class="w-[70px] h-full bg-[#481349] flex flex-col gap-y-4 items-center pt-[9px] pb-4">
        <WorkspaceSwitcher />
        <WorkspaceSidebarButton icon-name="lucide:house" label="Home" :is-active="route.path.includes('/workspace')" />
        <WorkspaceSidebarButton icon-name="lucide:messages-square" label="DMs" />
        <WorkspaceSidebarButton icon-name="lucide:bell" label="Activity" />
        <WorkspaceSidebarButton icon-name="lucide:ellipsis" label="More" />

        <div class="flex flex-col items-center justify-center gap-y-1 mt-auto">
            <AuthUserButton />
        </div>
    </aside>
</template>