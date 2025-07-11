import type { WatchHandle } from "vue";
import { defineStore } from "pinia";

import type { User } from "~/lib/types";

const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(true);

  async function init() {
    const { data, status } = await useFetch("/api/auth/me", {
      server: true, // Ensure it runs on server
      default: () => ({ user: null }),
    });

    let stopWatcher: WatchHandle | null = null; // the callback may call stopWatcher before watchEffect returns the watch handler
    stopWatcher = watchEffect(() => {
      isLoading.value = status.value === "pending";

      if (status.value === "success" || status.value === "error") {
        user.value = data.value?.user ?? null;
        stopWatcher?.();
      }
    });
  }

  function setUser(newUser: User | null) {
    user.value = newUser;
  }

  function clear() {
    user.value = null;
  }

  return { init, user, setUser, isLoading, clear };
});

export default useAuthStore;
