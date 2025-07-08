import { format } from "date-fns";

import type { Id } from "~/convex/_generated/dataModel";
import groupOrderMessages from "~/lib/groupOrderMessages";

import type {
  InjectedConversationData,
  Message,
  MessageListGroupedByDate,
} from "~/lib/types";

const SHARED_DM_CONVERSATION_DATA_KEY: InjectionKey<InjectedConversationData> =
  Symbol("conversation-data");

/**
 * Prepares channel data and related message list logic: add/remove messages, add reactions,...
 * @param
 * @returns () => void - function to provide channel data via "provide()"
 */
export async function provideConversationData(
  workspaceId: ComputedRef<string>
) {
  const otherMemberId: Ref<Id<"members"> | null> = ref(null);
  let convexCursor: string | undefined = undefined;

  const {
    data,
    status,
    execute,
    clear: clearApiData,
  } = await useLazyFetch(
    `/api/workspace/${workspaceId.value}/conversation/getOrCreate`,
    {
      method: "POST",
      body: {
        other_member_id: otherMemberId,
      },
      server: false,
      immediate: false,
      watch: false,
    }
  );

  const isLoading = computed(
    () => status.value === "idle" || status.value === "pending"
  );
  const isSuccess = computed(
    () =>
      status.value === "success" &&
      !!data.value?.conversationId &&
      !!data.value.otherUser &&
      !!data.value.messages
  );

  const orderedMessages = ref<MessageListGroupedByDate>([]);
  const loadingMore = ref(false);
  const canLoadMore = ref(false);

  watch(otherMemberId, (val) => {
    if (val) execute();
    else clearApiData();
  });

  watch(
    data,
    (val) => {
      if (val) orderedMessages.value = groupOrderMessages(val.messages);

      canLoadMore.value = !val?.messages?.isDone;
      convexCursor = val?.messages?.continueCursor;
    },
    { immediate: true }
  );

  const setOtherMemberId = (id: Id<"members"> | null) =>
    (otherMemberId.value = id);

  const loadMore = async (options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => {
    if (loadingMore.value || !canLoadMore.value || !data.value?.conversationId)
      return;
    loadingMore.value = true;

    return $fetch(`/api/conversation/${data.value.conversationId}/loadMore`, {
      method: "GET",
      query: { cursor: convexCursor },
    })
      .then((res) => {
        canLoadMore.value = !res.messages.isDone;
        convexCursor = res.messages.continueCursor;

        if (!res.messages.page.length) return;

        const rawMessageList = unref(orderedMessages);
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

  const addMessage = async (
    message: string,
    image: File | null,
    user_id: Id<"users">,
    user_name: string,
    user_workspace_member_id: Id<"members">,
    _channel_id?: Id<"channels">,
    conversation_id?: Id<"dm_conversations">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    let rawMessageList = unref(orderedMessages);

    // Message data
    const messageData: {
      message?: string;
      image?: string;
      conversation_id?: Id<"dm_conversations">;
    } = {
      message,
      conversation_id,
    };

    const optimisticMessage = {
      ...messageData,
      _id: (user_id + new Date().getTime()) as Id<"messages">,
      _creationTime: new Date().getTime(),
      workspace_id: workspaceId.value as Id<"workspaces">,
      member_id: user_workspace_member_id,
      member_name: user_name,
      image: image ? URL.createObjectURL(image) : undefined,
      replies: { count: 0, name: "", image: undefined, timestamp: 0 },
      reactions: [],
      status: "sending",
    };

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
      const { uploadUrl } = resUploadUrl as { uploadUrl: string };
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
    await $fetch(`/api/workspace/${workspaceId.value}/message/create`, {
      method: "POST",
      body: messageData,
    })
      .then((res) => {
        optimisticMessage._id = (
          res as { messageId: Id<"messages"> }
        ).messageId;
        optimisticMessage.status = "sent";

        options?.onSuccess?.();
      })
      .catch(() => {
        optimisticMessage.status = "failed";

        options?.onError?.();
      });
  };

  const updateMessage = (
    newContent: string,
    targetMessage: Message,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    const rawMessageList = unref(orderedMessages);
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

  const deleteMessage = (
    message_id: Id<"messages">,
    creationTime: number,
    options?: {
      onBeforeDelete?: () => void;
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    const rawMessageList = unref(orderedMessages);
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
    data,
    loadStatus: status,
    orderedMessages,
    isLoading,
    isSuccess,
    canLoadMore,
    loadMore,
    loadingMore,
    setOtherMemberId,
    addMessage,
    updateMessage,
    toggleReaction,
    deleteMessage,
    clearData: () => {
      setOtherMemberId(null);
      clearApiData();
    },
  } as unknown as InjectedConversationData;

  return {
    data: injectedData,
    provide: () => provide(SHARED_DM_CONVERSATION_DATA_KEY, injectedData),
  };
}

export function injectConversationData() {
  const injectedData = inject(SHARED_DM_CONVERSATION_DATA_KEY);

  if (!injectedData) {
    throw new Error(
      "No shared conversation data found. Make sure the parent component has called provideChannelData first"
    );
  }

  return injectedData as InjectedConversationData;
}
