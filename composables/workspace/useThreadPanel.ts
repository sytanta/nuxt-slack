import { format } from "date-fns";
import type { Id } from "~/convex/_generated/dataModel";
import groupOrderMessages from "~/lib/groupOrderMessages";
import type {
  InjectedThreadPanelControl,
  Message,
  MessageListGroupedByDate,
} from "~/lib/types";

const SHARED_THREAD_PANEL_KEY: InjectionKey<InjectedThreadPanelControl> =
  Symbol("thread-data");

export async function provideThreadPanel() {
  const { value: parentMessageId, setQueryValue: setParentMessageId } =
    useUrlQuery("parent_message_id");

  const parentMessage = ref<Message | null>(null);
  const orderedMessages = ref<MessageListGroupedByDate | null>(null);

  const loadingMore = ref(false);
  const canLoadMore = ref(false);
  let convexCursor: string | undefined = undefined;

  const {
    data,
    status: loadStatus,
    clear,
    execute,
  } = await useLazyFetch(() => "/api/message/thread/parentMessageId", {
    method: "GET",
    query: {
      parent_message_id: parentMessageId,
      cursor: convexCursor,
    },
    server: !!parentMessageId.value,
    immediate: false,
    watch: false,
  });

  watch(
    parentMessageId,
    (pmi) => {
      if (pmi) execute();
      else clear();
    },
    { immediate: true }
  );

  watch(
    data,
    (data) => {
      if (data) orderedMessages.value = groupOrderMessages(data.messages);

      convexCursor = data?.messages.continueCursor;
      canLoadMore.value = !data?.messages?.isDone;
    },
    { immediate: true }
  );

  const setParentMessage = (message: Message | null) =>
    (parentMessage.value = message);

  const openThreadPanel = (message: Message) => {
    setParentMessageId(message._id);
    setParentMessage(message);
  };

  const closeThreadPanel = () => {
    setParentMessageId(null);
    setParentMessage(null);
  };

  const loadMore = async (options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => {
    if (
      loadingMore.value ||
      loadStatus.value === "pending" ||
      !canLoadMore.value ||
      !parentMessage.value
    )
      return;
    loadingMore.value = true;

    return $fetch("/api/message/thread/parentMessageId", {
      method: "GET",
      query: {
        parent_message_id: parentMessageId.value,
        cursor: convexCursor,
      },
    })
      .then((res) => {
        canLoadMore.value = !res.messages.isDone;
        convexCursor = res.messages.continueCursor;

        if (!res.messages.page.length) return;

        const rawMessageList = unref(orderedMessages);
        if (!rawMessageList) return;

        const newOrderedMessage = groupOrderMessages(res.messages);

        const resLatest = newOrderedMessage[0];
        const currentListSoonest = rawMessageList.at(-1);

        // If current message list and the loaded-more list overlap
        if (currentListSoonest && resLatest[0] === currentListSoonest[0]) {
          currentListSoonest[1] = [...resLatest[1], ...currentListSoonest[1]];
          rawMessageList.push(...newOrderedMessage.slice(1));
        } else {
          rawMessageList.push(...newOrderedMessage);
        }

        options?.onSuccess?.();
      })
      .catch(() => options?.onError?.())
      .finally(() => (loadingMore.value = false));
  };

  const addReply = async (
    message: string,
    image: File | null,
    parent_message_id: Id<"messages">,
    workspace_id: Id<"workspaces">,
    user_id: Id<"users">,
    user_name: string,
    user_workspace_member_id: Id<"members">,
    channel_id?: Id<"channels">,
    conversation_id?: Id<"dm_conversations">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    // Message data
    const messageData: {
      message?: string;
      image?: string;
      channel_id?: Id<"channels">;
      conversation_id?: Id<"dm_conversations">;
      parent_message_id: Id<"messages">;
    } = {
      message,
      channel_id,
      conversation_id,
      parent_message_id,
    };

    const optimisticMessage = {
      ...messageData,
      _id: (user_id + new Date().getTime()) as Id<"messages">,
      _creationTime: new Date().getTime(),
      workspace_id,
      member_id: user_workspace_member_id,
      member_name: user_name,
      image: image ? URL.createObjectURL(image) : undefined,
      replies: { count: 0, name: "", image: undefined, timestamp: 0 },
      reactions: [],
      status: "sending",
    };

    // Optimistically add the new message to UI without waiting for server response
    // TODO - handle add failure
    let rawMessageList = unref(orderedMessages);
    if (!rawMessageList) return;

    const dateCreated = format(
      new Date(optimisticMessage._creationTime),
      "yyyy-MM-dd"
    );
    const lastListedItem = rawMessageList[0];

    // Optimistically add the new message to UI without waiting for server response
    // TODO - handle add failure
    if (lastListedItem?.[0] === dateCreated)
      lastListedItem[1].push(optimisticMessage);
    else rawMessageList.unshift([dateCreated, [optimisticMessage]]); // [[dateCreated, [optimisticMessage]], ...rawMessageList];

    // Upload image to Convex
    if (image) {
      const resUploadUrl = await $fetch("/api/workspace/upload", {
        method: "POST",
      });
      const { uploadUrl } = resUploadUrl as unknown as { uploadUrl: string };
      if (!uploadUrl) throw new Error("Failed to upload image");

      const resUpload = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": image.type,
        },
        body: image,
      });
      if (!resUpload.ok) throw new Error("Failed to upload image");

      const { storageId }: { storageId: string } = await resUpload.json();
      if (storageId) messageData.image = storageId;
    }

    // Add the new message to database
    await $fetch(`/api/workspace/${workspace_id}/message/create`, {
      method: "POST",
      body: messageData,
    })
      .then((res) => {
        optimisticMessage._id = (
          res as unknown as { messageId: Id<"messages"> }
        ).messageId;
        optimisticMessage.status = "sent";

        options?.onSuccess?.();
      })
      .catch(() => {
        optimisticMessage.status = "failed";

        options?.onError?.();
      });
  };

  const updateReply = (
    newContent: string,
    targetMessage: Message,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    const rawMessageList = unref(orderedMessages);
    if (!rawMessageList) return;

    const dateGroup = format(
      new Date(targetMessage._creationTime),
      "yyyy-MM-dd"
    );

    const group = rawMessageList.find(([group]) => group === dateGroup);
    if (!group) return;

    const message = group[1].find(({ _id }) => _id === targetMessage._id);
    if (!message) return;

    // Optimistically update the message data without waiting for server response
    // TODO - handle update failure
    message.message = newContent;
    message.updated_at = new Date().getTime();

    $fetch("/api/message/update", {
      method: "POST",
      body: {
        message_id: message._id,
        message: newContent,
      },
    }).catch(() => options?.onError?.());
  };

  const toggleReaction = (
    value: string,
    targetMessage: Message,
    userWorkspaceMembershipId: Id<"members">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    const rawMessageList = unref(orderedMessages);
    if (!rawMessageList) return;

    const dateGroup = format(
      new Date(targetMessage._creationTime),
      "yyyy-MM-dd"
    );

    const group = rawMessageList.find(([group]) => group === dateGroup);
    if (!group) return;

    const message = group[1].find(({ _id }) => _id === targetMessage._id);
    if (!message) return;

    // Optimistically toggle reaction without waiting for server response
    // TODO - handle toggle failure
    // "message.reactions" has the format of [[':smile', member_id[]], [':clap', member_id[]],...]
    const existingSameReactionIndex = message.reactions.findIndex(
      (reaction) => reaction[0] === value
    );
    const existingSameReaction =
      (message.reactions[existingSameReactionIndex] as [
        string,
        Id<"members">[],
      ]) || undefined;

    if (existingSameReaction) {
      const userReaction = existingSameReaction[1].find(
        (member_id) => member_id === userWorkspaceMembershipId
      );

      if (userReaction) {
        const newMembershipList = existingSameReaction[1].filter(
          (member_id) => member_id !== userWorkspaceMembershipId
        );

        if (newMembershipList.length)
          existingSameReaction[1] = newMembershipList;
        else message.reactions.splice(existingSameReactionIndex, 1);
      } else {
        existingSameReaction[1].push(userWorkspaceMembershipId);
      }
    } else {
      message.reactions.push([value, [userWorkspaceMembershipId]]);
    }

    $fetch("/api/reaction/toggle", {
      method: "POST",
      body: {
        message_id: message._id,
        value,
      },
    }).catch(() => options?.onError?.());
  };

  const deleteReply = (
    message_id: Id<"messages">,
    creationTime: number,
    options?: {
      onBeforeDelete?: () => void;
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    const rawMessageList = unref(orderedMessages);
    if (!rawMessageList) return;

    const dateGroup = format(new Date(creationTime), "yyyy-MM-dd");

    const group = rawMessageList.find(([group]) => group === dateGroup);
    if (!group) return;

    options?.onBeforeDelete?.();

    // Optimistically update message list without waiting for server response
    // TODO - handle delete failure
    group[1] = group[1].filter(({ _id }) => _id !== message_id);

    $fetch("/api/message/delete", {
      method: "DELETE",
      body: {
        message_id,
      },
    })
      .then(() => options?.onSuccess?.())
      .catch(() => options?.onError?.());
  };

  const injectedData = {
    parentMessage,
    parentMessageId,
    setParentMessage,
    data,
    orderedMessages,
    clearData: clear,
    loadStatus,
    canLoadMore,
    loadMore,
    loadingMore,
    addReply,
    updateReply,
    toggleReaction,
    deleteReply,
    openThreadPanel,
    closeThreadPanel,
  } as unknown as InjectedThreadPanelControl;

  return {
    data: injectedData,
    provide: () => provide(SHARED_THREAD_PANEL_KEY, injectedData),
  };
}

export function injectThreadPanelControl() {
  const injectedData = inject(SHARED_THREAD_PANEL_KEY);

  if (!injectedData) {
    throw new Error(
      "No shared thread panel control found. Make sure the parent component has called provideWorkspaceData first"
    );
  }

  return injectedData as InjectedThreadPanelControl;
}
