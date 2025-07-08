<script setup lang="ts">
import type { AuthFlow } from '~/lib/types';

const authState = ref<AuthFlow>('signIn')

const toggleAuthCard = () => authState.value = authState.value === 'signIn' ? 'signUp' : 'signIn'
</script>

<template>
    <div class="h-full flex items-center justify-center bg-[#5c3b58]">
        <div class="md:h-auto md:w-[420px]">
            <template v-if="authState === 'signIn'">
                <AuthSignInCard @toggle-auth-card="toggleAuthCard" />
            </template>
            <template v-else>
                <AuthSignUpCard @toggle-auth-card="toggleAuthCard" />
            </template>
        </div>
    </div>
</template>