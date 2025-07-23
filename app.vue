<script setup lang="ts">
import 'vue-sonner/style.css';

import useAuthStore from '~/stores/auth';

callOnce('auth-init', () => useAuthStore().init(), { mode: 'navigation' });
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>