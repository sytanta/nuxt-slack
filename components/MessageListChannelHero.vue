<script setup lang="ts">
import { format } from 'date-fns';

const { name, creationTime } = defineProps<{ name: string; creationTime: number }>()
</script>

<template>
    <div class="mt-[88px] mx-5 mb-4">
        <p class="text-2xl font-bold flex items-center mb-2"># {{ name }}</p>
        <p class="font-normal text-slate-800 mb-4">
            This channel was created on {{ format(creationTime, 'MMMM do, yyyy') }}. This is the very beginning of the
            <strong>{{ name }}</strong> channel.
        </p>
    </div>
</template>