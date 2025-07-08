import type { Doc, Id } from "~/convex/_generated/dataModel";
import type { InjectedWorkspaceData } from "~/lib/types";

const SHARED_WORKSPACE_DATA_KEY: InjectionKey<InjectedWorkspaceData> =
  Symbol("workspace-data");

/**
 * Prepares workspace data and related members & channels
 * the fetch functions will auto re-run when "workspaceId" changes
 * @param
 * @returns () => void - function to provide workspace data via "provide()"
 */
export async function provideWorkspaceData(workspaceId: ComputedRef<string>) {
  const [
    { data: workspace, status: workspaceLoadStatus, refresh: refreshWorkspace },
    { data: members, status: membersLoadStatus, refresh: refreshMembers },
    { data: channels, status: channelsLoadStatus, refresh: refreshChannels },
  ] = await Promise.all([
    useLazyFetch(() => `/api/workspace/${workspaceId.value}`),
    useLazyFetch(() => `/api/workspace/${workspaceId.value}/member/all`), // TODO - reload members on joining or leaving
    useLazyFetch(() => `/api/workspace/${workspaceId.value}/channel/all`),
  ]);

  const createCNModalOpen = ref(false);
  const membersObj = computed(
    () =>
      members.value?.members.reduce(
        (acc, mem) => {
          acc[mem.membership_id] = mem;
          return acc;
        },
        {} as Record<
          string,
          Awaited<
            ReturnType<
              typeof useLazyFetch<{
                members: (Doc<"users"> & {
                  membership_id: Id<"members">;
                  is_admin: boolean;
                })[];
              }>
            >["data"]["value"]["members"][number]
          >
        >
      ) ?? {}
  );

  const openCreateChannelModal = () => (createCNModalOpen.value = true);
  const closeCreateChannelModal = () => (createCNModalOpen.value = false);

  const updateCurrentWorkspaceName = (newName: string) => {
    if (workspace.value)
      (
        workspace as Ref<{ workspace: Doc<"workspaces"> }>
      ).value.workspace.name = newName;
  };

  const updateChannelName = (id: Id<"channels">, newName: string) => {
    const channel = channels.value?.channels.find(({ _id }) => _id === id);
    if (channel) channel.name = newName;
  };

  const onAddNewChannelSuccess = (newChannel: Doc<"channels">) => {
    channels.value?.channels.push(newChannel);
  };

  const injectedData = {
    workspace,
    members,
    membersObj,
    channels,

    workspaceLoadStatus,
    membersLoadStatus,
    channelsLoadStatus,

    refreshWorkspace,
    refreshMembers,
    refreshChannels,
    updateCurrentWorkspaceName,
    updateChannelName,

    createCNModalOpen,
    openCreateChannelModal,
    closeCreateChannelModal,
    onAddNewChannelSuccess,
  } as unknown as InjectedWorkspaceData;

  return {
    data: injectedData,
    provide: () => provide(SHARED_WORKSPACE_DATA_KEY, injectedData),
  };
}

export function injectWorkspaceData() {
  const injectedData = inject(SHARED_WORKSPACE_DATA_KEY);

  if (!injectedData) {
    throw new Error(
      "No shared workspace data found. Make sure the parent component has called provideWorkspaceData first"
    );
  }

  return injectedData as InjectedWorkspaceData;
}
