<script setup lang="ts">
const { label, side, align } = defineProps<{
    label: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end'
}>()

const open = ref(false)

const openTooltip = () => open.value = true
const closeTooltip = () => open.value = false

defineExpose({ openTooltip, closeTooltip })
</script>

<template>
    <TooltipProvider>
        <Tooltip :open="open" @update:open="open = $event" :delay-duration="50">
            <TooltipTrigger :as-child="true">
                <slot></slot>
            </TooltipTrigger>
            <TooltipContent :side="side" :align="align" class="bg-black text-white border border-white/5">
                <p class="font-medium text-xs">{{ label }}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>