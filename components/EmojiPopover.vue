<script setup lang="ts">
import { Picker } from 'emoji-mart'

const { onEmojiSelect, hint = 'Emoji' } = defineProps<{ onEmojiSelect?: (emoji: any) => void, hint?: string }>()

const popoverOpen = ref(false)
const popoverElm = useTemplateRef('picker')

watchEffect(() => {
    if (popoverElm.value) {
        const picker = new Picker({
            data: async () => {
                const response = await fetch(
                    'https://cdn.jsdelivr.net/npm/@emoji-mart/data',
                )

                return response.json()
            },
            navPosition: 'none',
            onEmojiSelect
        })

        popoverElm.value.appendChild(picker as unknown as Node)
    }
})

const openPopover = () => {
    popoverOpen.value = true
}
</script>

<template>
    <TooltipProvider v-if="hint">
        <Tooltip :delay-duration="50">
            <TooltipTrigger :as-child="true">
                <button ref="triggerRef" @click="openPopover">
                    <slot></slot>
                </button>
            </TooltipTrigger>
            <TooltipContent class="bg-black text-white border border-white/5">
                <p class="text-xs font-medium">{{ hint }}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
    <button v-else ref="triggerRef" @click="openPopover">
        <slot></slot>
    </button>

    <Popover :open="popoverOpen" @update:open="popoverOpen = $event">
        <PopoverAnchor :element="triggerRef"></PopoverAnchor>
        <PopoverContent class="p-0 border-none shadow-none z-100">
            <div ref="picker"></div>
        </PopoverContent>
    </Popover>
</template>