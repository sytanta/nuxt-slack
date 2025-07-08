<script setup lang="ts">
const { memberName = "Member", memberImage, onClick } = defineProps<{
    memberName?: string;
    memberImage?: string;
    onClick?: () => void
}>()
</script>

<template>
    <div class="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden">
        <Button variant="ghost" size="sm" @click="onClick" class="text-lg font-semibold px-2 overflow-hidden w-auto">
            <Avatar class="size-6 mr-2">
                <AvatarImage :src="memberImage || ''"></AvatarImage>
                <AvatarFallback>
                    {{ memberName[0].toUpperCase() }}
                </AvatarFallback>
            </Avatar>
            <span class="truncate">{{ memberName }}</span>
            <Icon name="lucide:chevron-down" size="16px" class="size-2.5 ml-2 shrink-0" />
        </Button>
    </div>
</template>