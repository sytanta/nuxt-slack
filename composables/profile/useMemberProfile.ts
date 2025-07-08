import type { Id } from "~/convex/_generated/dataModel";
import type { InjectedMemberProfileControl } from "~/lib/types";

const SHARED_MEMBER_PROFILE_KEY: InjectionKey<InjectedMemberProfileControl> =
  Symbol("thread-data");

export async function provideMemberProfileControl() {
  const { value: profileMembershipId, setQueryValue: setProfileMembershipId } =
    useUrlQuery("profile_member_id");

  const {
    data,
    status: loadMemberStatus,
    clear: clearMemberData,
    execute: runLoadMember,
  } = await useLazyFetch(() => "/api/member/getByMembershipId", {
    method: "GET",
    query: {
      profile_member_id: profileMembershipId,
    },
    server: !!profileMembershipId.value,
    immediate: false,
    watch: false,
  });

  watch(
    profileMembershipId,
    (memberId) => {
      if (memberId) runLoadMember();
      else clearMemberData();
    },
    { immediate: true }
  );

  const openProfilePanel = (memberId: Id<"members">) => {
    setProfileMembershipId(memberId);
  };

  const closeProfilePanel = () => {
    setProfileMembershipId(null);
  };

  const updating = ref(false);
  const updateMember = async (
    newRole: string,
    option: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    updating.value = true;
    return $fetch("/api/member/update", {
      method: "PATCH",
      body: {
        membership_id: profileMembershipId.value,
        role: newRole,
      },
    })
      .then(() => option.onSuccess?.())
      .catch(() => option.onError?.())
      .finally(() => (updating.value = false));
  };

  const removing = ref(false);
  const removeMember = async (option: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => {
    removing.value = true;
    return $fetch("/api/member/remove", {
      method: "DELETE",
      body: {
        membership_id: profileMembershipId.value,
      },
    })
      .then(() => option.onSuccess?.())
      .catch(() => option.onError?.())
      .finally(() => (removing.value = false));
  };

  const injectedData = {
    profileMembershipId,
    data,
    loadStatus: loadMemberStatus,
    clearMemberData,
    updateMember,
    removeMember,
    updating,
    removing,
    openProfilePanel,
    closeProfilePanel,
  } as unknown as InjectedMemberProfileControl;

  return {
    data: injectedData,
    provide: () => provide(SHARED_MEMBER_PROFILE_KEY, injectedData),
  };
}

export function injectMemberProfileControl() {
  const injectedData = inject(SHARED_MEMBER_PROFILE_KEY);

  if (!injectedData) {
    throw new Error(
      "No shared member profile control found. Make sure the parent component has called provideWorkspaceData first"
    );
  }

  return injectedData as InjectedMemberProfileControl;
}
