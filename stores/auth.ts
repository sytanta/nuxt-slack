import { defineStore } from "pinia";

import type { User } from "~/lib/types";

const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(true);

  function init() {
    useFetch("/api/auth/me", {
      server: true, // Ensure it runs on server
      default: () => ({ user: null }),
    })
      .then((res) => (user.value = res.data.value.user))
      .finally(() => (isLoading.value = false));
  }

  function setUser(newUser: User | null) {
    user.value = newUser;
  }

  return { init, user, setUser, isLoading };
});

export default useAuthStore;
