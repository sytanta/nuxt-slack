<script setup lang="ts">
import 'vue-sonner/style.css';

import useAuthStore from '~/stores/auth';

callOnce('auth-init', () => useAuthStore().init());
</script>

<template>
    <NuxtLayout name="workspaces">
        <slot></slot>
    </NuxtLayout>
</template>