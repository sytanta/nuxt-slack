// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  vite: { plugins: [tailwindcss()] },

  nitro: {
    devProxy: {
      host: "localhost",
    },
  },

  runtimeConfig: {
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,

    public: {
      homepageUrl: process.env.NUXT_PUBLIC_HOMEPAGE_URL,
      authCallbackGitHub: process.env.NUXT_PUBLIC_AUTH_CALLBACK_URL_GITHUB,
      githubClientId: process.env.GITHUB_CLIENT_ID,
      convexUrl: process.env.CONVEX_URL,
      messagesPerPage: process.env.NUXT_PUBLIC_MESSAGE_PER_PAGE,
      timeThreshold: process.env.NUXT_PUBLIC_TIME_THRESHOLD,
    },
  },

  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon.png",
        },
      ],
    },
  },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "shadcn-nuxt",
    "@pinia/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
});
