import { api } from "~/convex/_generated/api";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async () => {
  return await handleServerAction(async () => {
    const uploadUrl = await convexServerClient.mutation(
      api.upload.generateUploadUrl
    );
    return { uploadUrl };
  });
});
