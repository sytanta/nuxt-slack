<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';

const { id, label, iconName, variant } = defineProps<{
    id: string;
    label: string;
    iconName: string,
    variant?: VariantProps<typeof sidebarItemVariants>['variant']
}>()

const workspaceData = injectWorkspaceData()

const sidebarItemVariants = cva(
    'flex item-center justify-start gap-1.5 font-normal h-7 px-[18px] text-sm overflow-hidden',
    {
        variants: {
            variant: {
                default: 'text-[#f9edffcc]',
                active: 'text-[#481349] bg-white/90 hover:bg-white/90'
            }
        },
        defaultVariants: {
            variant: 'default'
        }
    }
)
</script>

<template>
    <Button variant="transparent" size="sm" :as-child="true" :class="cn(sidebarItemVariants({ variant }))">
        <NuxtLink :href="`/workspace/${workspaceData.workspace.value?.workspace?._id}/channel/${id}`">
            <Icon :name="iconName" size="14px" class="size-3.5 shrink-0 mr-1" />
            <span class="text-sm truncate">{{ label }}</span>
        </NuxtLink>
    </Button>
</template>