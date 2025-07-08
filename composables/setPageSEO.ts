export default function setPageSEO(
  dataSource: () => string | null | undefined
) {
  watch(
    dataSource,
    (data) => {
      const title = data || "Nuxt Slack";
      const description = "Nuxt Slack, a Slack clone done in Nuxt 3";

      useSeoMeta({
        title: title,
        ogTitle: title,
        description: description,
        ogDescription: description,
      });
    },
    { immediate: true }
  );
}
