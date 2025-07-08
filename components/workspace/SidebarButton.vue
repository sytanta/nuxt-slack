<script setup lang="ts">
const { iconName, label, isActive = null } = defineProps<{ iconName: string; label: string; isActive?: boolean }>()
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-y-0.5 cursor-pointer group">
        <Button variant="transparent" :data-active="isActive"
            class="size-9 p-2 group-hover:bg-accent/20 data-[active=true]:bg-accent/20">
            <Icon :name="iconName" size="20px" class="size-5 text-white group-hover:scale-110 transition-all" />
        </Button>
        <span class="text-[11px] text-white group-hover:text-accent">{{ label }}</span>
    </div>
</template>