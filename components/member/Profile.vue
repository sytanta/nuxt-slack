<script setup lang="ts">
import { toast } from 'vue-sonner';

import type { WorkspaceMemberRole } from '~/lib/types';
import useAuthStore from '~/stores/auth';
import { injectWorkspaceData } from '~/composables/workspace/useWorkspaceData';
import { injectMemberProfileControl } from '~/composables/profile/useMemberProfile';
import ConfirmModal from '../ConfirmModal.vue';

const emit = defineEmits(['on-close'])

const authStore = useAuthStore()
const workspaceData = injectWorkspaceData()
const {
    data,
    loadStatus,
    clearMemberData,
    updateMember,
    removeMember,
    updating,
    removing,
    closeProfilePanel
} = injectMemberProfileControl()

const isLoading = computed(() => loadStatus.value === 'idle' || loadStatus.value === 'pending')
const isSuccess = computed(() => loadStatus.value === 'success' && loadStatus.value)

const currentUserMember = computed(() => {
    return workspaceData.members.value.members?.find(({ _id }) => _id === authStore.user?.id)
})

// Workspace owner can do anything to other members
const currentUserIsOwner = computed(() =>
    authStore.user?.id === workspaceData.workspace.value.workspace.user_id
    && authStore.user?.id !== data.value.member?._id)

// Admin user views a member's profile
const adminViewsMemberProfile = computed(() =>
    currentUserMember?.value?.is_admin
    && currentUserMember?.value?._id !== data.value.member?._id
    && !data.value.member?.is_admin)

// Member user views his own profile
const memberViewsHisProfile = computed(() =>
    !currentUserMember?.value?.is_admin && currentUserMember?.value?._id === data.value.member?._id)

const { openModal } = useConfirmModal()

// Update member's role
const handleUpdateMemberRole = (newRole: string) => {
    if (newRole === data.value.member?.role) return

    openModal(ConfirmModal, {
        onConfirm: () => {
            if (!currentUserIsOwner.value) newRole = 'admin' // admin can only upgrade other members' role to "admin"

            return updateMember(newRole, {
                onSuccess: () => {
                    data.value.member!.role = newRole as WorkspaceMemberRole
                    toast.success("Member's role changed")
                },
                onError: () => toast.error("Failed to update member's role")
            })
        },
        title: 'Change role',
        message: "Are your sure you want to update this member's role?"
    })
}

// Remove member
const handleRemoveMember = () => {
    openModal(ConfirmModal, {
        onConfirm: () => removeMember({
            onSuccess: () => {
                closeProfilePanel()
                toast.success('Member removed')
            },
            onError: () => toast.error('Failed to remove member')
        }),
        title: 'Remove member',
        message: 'Are your sure you want to remove this member?'
    })
}

// Leave workspace
const handleLeaveWorkspace = () => {
    openModal(ConfirmModal, {
        onConfirm: () => removeMember({
            onSuccess: () => {
                clearMemberData()
                navigateTo('/')
                toast.success('You left the workspace')
            },
            onError: () => toast.error('Failed to leave workspace')
        }),
        title: 'Leave workspace',
        message: 'Are your sure you want to leave this workspace?'
    })
}
</script>

<template>
    <div class="h-full flex flex-col">
        <div class="flex shrink-0 items-center justify-between h-[49px] px-4 border-b">
            <p class="text-lg font-bold">Profile</p>
            <Button variant="ghost" size="iconSm" @click="emit('on-close')">
                <Icon name="lucide:x" size="20px" class="size-5 stroke-[1.5]" />
            </Button>
        </div>
        <div v-if="isLoading" class="h-full flex items-center justify-center">
            <Icon name="svg-spinners:8-dots-rotate" size="20px" class="size-5 text-muted-foreground" />
        </div>
        <template v-else-if="isSuccess">
            <div class="flex flex-col items-center justify-center p-4">
                <Avatar class="max-w-[256px] max-h-[256px] size-full">
                    <AvatarImage :src="data.member?.avatar || ''"></AvatarImage>
                    <AvatarFallback class="aspect-square text-6xl">
                        {{ data.member?.name?.[0].toUpperCase() }}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div class="flex flex-col p-4">
                <p class="text-xl font-bold">{{ data.member?.name }}</p>
                <!-- Admin user views a member's profile -->
                <div v-if="currentUserIsOwner || adminViewsMemberProfile"
                    class="grid grid-cols-2 items-center gap-2 mt-4">
                    <DropdownMenu id="dropdown-member-profile">
                        <DropdownMenuTrigger id="dropdown-member-profile-trigger" :as-child="true">
                            <Button variant="outline" :disabled="updating || removing" class="w-full capitalize">
                                {{ data.member?.role }}
                                <Icon v-if="updating" name="svg-spinners:8-dots-rotate" size="16px"
                                    class="size-4 ml-1 shrink-0" />
                                <Icon v-else name="lucide:chevron-down" size="16px" class="size-4 ml-1 shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" class="w-full" id="dropdown-member-profile-content">
                            <DropdownMenuRadioGroup :model-value="data.member?.role"
                                @update:model-value="handleUpdateMemberRole">
                                <DropdownMenuRadioItem value="admin" id="dropdown-member-profile-item-1">Admin
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="member" id="dropdown-member-profile-item-2">Member
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" :disabled="updating || removing" @click="handleRemoveMember"
                        class="w-full">
                        <Icon v-if="removing" name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                        <span v-else>Remove</span>
                    </Button>
                </div>
                <!-- Member user views his own profile -->
                <div v-if="memberViewsHisProfile" class="mt-4">
                    <Button variant="outline" :disabled="updating || removing" @click="handleLeaveWorkspace"
                        class="w-full">
                        <Icon v-if="removing" name="svg-spinners:8-dots-rotate" size="16px" class="size-4" />
                        <span v-else>Leave</span>
                    </Button>
                </div>
            </div>
            <Separator />
            <div class="flex flex-col p-4">
                <p class="text-sm font-bold mb-4">Contact information</p>
                <div class="flex items-center gap-2">
                    <div class="size-9 rounded-md bg-muted flex items-center justify-center">
                        <Icon name="lucide:mail" size="16px" class="size-4" />
                    </div>
                    <div class="flex flex-col">
                        <p class="text-[13px] font-semibold text-muted-foreground">Email address</p>
                        <a :href="`mailto:${data.member?.email}`" class="text-sm text-[#1264a3] hover:underline">{{
                            data.member?.email }}</a>
                    </div>
                </div>
            </div>
        </template>
        <div v-else class="h-full flex flex-col gap-y-1 items-center justify-center">
            <Icon name="lucide:triangle-alert" size="20px" class="size-5 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">Member not found</p>
        </div>
    </div>
</template>