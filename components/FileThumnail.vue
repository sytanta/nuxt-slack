<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui';

const { url } = defineProps<{ url?: string | null }>()
</script>

<template>
    <Dialog v-if="url">
        <DialogTrigger>
            <div class="relative overflow-hidden max-w-[360px] border rounded-lg my-2 cursor-zoom-in">
                <img :src="url" alt="Message attachment" class="rounded-md object-cover size-full" />
            </div>
        </DialogTrigger>
        <DialogContent class="max-w-[800px] border-none bg-transparent p-0 shadow-none">
            <VisuallyHidden>
                <DialogTitle>Attached image</DialogTitle>
                <DialogDescription>Attached image</DialogDescription>
            </VisuallyHidden>
            <img :src="url" alt="Message attachment" class="rounded-md object-cover size-full" />
        </DialogContent>
    </Dialog>
</template>