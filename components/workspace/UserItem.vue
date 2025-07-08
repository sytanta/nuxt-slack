<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';

const userItemVariants = cva(
    'flex item-center justify-start gap-1.5 font-normal h-7 px-4 text-sm overflow-hidden',
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

const { workspaceId, membershipId, label = 'Member', variant } = defineProps<{
    workspaceId: string;
    membershipId: string;
    label?: string;
    image?: string;
    variant?: VariantProps<typeof userItemVariants>['variant'];
}>()
</script>

<template>
    <Button variant="transparent" size="sm" :as-child="true" :class="cn(userItemVariants({ variant }))">
        <NuxtLink :href="`/workspace/${workspaceId}/member/${membershipId}`">
            <Avatar class="size-5 mr-1">
                <AvatarImage :src="image || ''"></AvatarImage>
                <AvatarFallback class="text-xs">{{ label?.[0].toUpperCase() }}
                </AvatarFallback>
            </Avatar>
            <span class="text-sm truncate">{{ label }}</span>
        </NuxtLink>
    </Button>
</template>