<script setup lang="ts">
import useAuthStore from '~/stores/auth'
import useWorkspacesStore from '~/stores/workspaces'

const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()
const error = ref('')
const processing = ref(false)

const handleSignIn = (e: Event) => {
    processing.value = true

    const formElm = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElm)

    const email = formData.get('email')
    const password = formData.get('password')

    $fetch('/api/auth/signin', { method: 'POST', body: { email, password } }).then(async (res) => {
        authStore.setUser(res?.user || null)
        await workspacesStore.refresh()
        navigateTo('/')
    }).catch(() => {
        error.value = 'Invalid credentials'
    }).finally(() => processing.value = false)
}

const signInWithGitHub = () => {
    window.location.href = '/api/auth/github'
}
</script>

<template>
    <Card class="size-full p-8">
        <CardHeader class="px-0 pt-0">
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>Use your email or another service to continue</CardDescription>
        </CardHeader>
        <div v-if="error" class="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
            <Icon name="lucide:triangle-alert" size="16px" class="size-4" />
            <p>{{ error }}</p>
        </div>
        <CardContent class="space-y-5 px-0 pb-0">
            <form @submit.prevent="handleSignIn">
                <fieldset disable="processing" class="space-y-2.5">
                    <Input type="email" name="email" placeholder="Email" required />
                    <Input type="password" name="password" min="6" max="255" placeholder="Password" required />
                    <Button type="submit" class="w-full">
                        <template v-if="processing">
                            <Icon name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                        </template>
                        <template v-else>Continue</template>
                    </Button>
                </fieldset>
            </form>
            <Separator />
            <div class="flex flex-col gap-y-2.5">
                <!-- <Button variant="outline" size="lg" class="w-full relative">
                    <Icon name="logos:google-icon" size="20px"
                        class="absolute size-5 left-2.5 top-1/2 -translate-y-1/2" />
                    Continue with Google
                </Button> -->
                <Button variant="outline" size="lg" @click="signInWithGitHub" class="w-full relative">
                    <Icon name="logos:github-icon" size="20px"
                        class="absolute size-5 left-2.5 top-1/2 -translate-y-1/2" />
                    Continue with Github
                </Button>
            </div>
            <p class="text-xs text-muted-foreground">Don't have an account? <button @click="$emit('toggle-auth-card')"
                    class="text-sky-700 hover:underline">Sign up</button></p>
        </CardContent>
    </Card>
</template>