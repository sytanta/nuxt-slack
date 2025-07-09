import { defineStore } from "pinia";

import type { Doc, Id } from "~/convex/_generated/dataModel";

/**
 * useWorkspacesStore - manages user's all workspaces
 * & related states (opening workspace/channel modals, refreshing workspaces,...)
 */
const useWorkspacesStore = defineStore("workspaces", () => {
  let _fetchComposable: ReturnType<typeof useFetch> | null = null;

  const workspaces: Ref<Doc<"workspaces">[]> = ref([]);

  const createWSModalOpen = ref(false);

  const openCreateWorkspaceModal = () => (createWSModalOpen.value = true);
  const closeCreateWorkspaceModal = () => (createWSModalOpen.value = false);

  async function init() {
    // Fetch user's all workspaces
    // should run this on both server and browser so that "_fetchComposable.refresh"
    // be available for refreshing workspaces when a user signs in/signs up
    _fetchComposable = (await useFetch(
      "/api/workspace/all"
    )) as unknown as ReturnType<typeof useFetch>;

    watchEffect(() => {
      workspaces.value =
        (
          _fetchComposable?.data as Ref<{
            workspaces: Doc<"workspaces">[];
          } | null>
        )?.value?.workspaces || ([] as Doc<"workspaces">[]);
    });
  }

  const status = computed(() => _fetchComposable?.status);

  const updateWorkspaceName = (id: Id<"workspaces">, newName: string) => {
    const workspace = workspaces.value.find(({ _id }) => _id === id);
    if (!workspace) return;

    workspace.name = newName;
  };

  const refresh = () => _fetchComposable?.refresh();
  const clear = () => _fetchComposable?.clear();

  return {
    init,
    workspaces,
    status,
    refresh,
    clear,
    createWSModalOpen,
    openCreateWorkspaceModal,
    closeCreateWorkspaceModal,
    updateWorkspaceName,
  };
});

export default useWorkspacesStore;
