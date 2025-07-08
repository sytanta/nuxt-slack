import type { LocationQueryValue } from "vue-router";

import type { Doc, Id } from "~/convex/_generated/dataModel";
import { api } from "~/convex/_generated/api";
import type { serializeUser } from "./auth/credential";
import type { AsyncDataRequestStatus } from "#app";

export type AuthFlow = "signIn" | "signUp";

export type User = ReturnType<typeof serializeUser>;

export type WorkspaceMemberRole = "admin" | "member";

export type WorkspaceProvide = {
  data: Ref<{ workspace: Doc<"workspaces"> }> | null;
  status: Ref<AsyncDataRequestStatus, AsyncDataRequestStatus>;
  updateCurrentWorkspaceName: (name: string) => void;
};

export type WorkspaceMembersProvide = {
  data: Ref<{
    members: (Doc<"users"> & {
      membership_id: Id<"members">;
      role: "admin" | "member";
      is_admin: boolean;
    })[];
  }> | null;
  status: Ref<AsyncDataRequestStatus, AsyncDataRequestStatus>;
};

export type WorkspaceMemberUser = Doc<"users"> & {
  membership_id: Id<"members">;
  role: "admin" | "member";
  is_admin: boolean;
};

export interface InjectedWorkspaceData {
  workspace: Ref<{
    workspace: Doc<"workspaces"> & { user_membership_id: Id<"members"> };
  }>;
  members: Ref<{
    members: WorkspaceMemberUser[];
  }>;
  membersObj: ComputedRef<Record<string, WorkspaceMemberUser>>;
  channels: Ref<{ channels: Doc<"channels">[] }>;

  workspaceLoadStatus: Ref<AsyncDataRequestStatus, AsyncDataRequestStatus>;
  membersLoadStatus: Ref<AsyncDataRequestStatus, AsyncDataRequestStatus>;
  channelsLoadStatus: Ref<AsyncDataRequestStatus, AsyncDataRequestStatus>;

  refreshWorkspace: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshChannels: () => Promise<void>;

  updateCurrentWorkspaceName: (newName: string) => void;
  updateChannelName: (id: Id<"channels">, newName: string) => void;

  createCNModalOpen: Ref<boolean>;
  openCreateChannelModal: () => void;
  closeCreateChannelModal: () => void;
  onAddNewChannelSuccess: (newChannel: Doc<"channels">) => void;
}

export interface InjectedChannelData {
  data: Ref<ChannelData>;
  messages: Ref<MessagesData>;
  orderedMessages: Ref<any>;
  canLoadMore: Ref<boolean>;
  loadMore: (options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => void;
  loadingMore: Ref<boolean>;
  setPaginatedMessagesData: (data: any) => void;
  setChannelData: (data: ChannelData | null) => void;
  setMessages: (messages: MessagesData) => void;
  addMessage: (
    message: string,
    image: File | null,
    user_id: Id<"users">,
    user_name: string,
    user_workspace_member_id: Id<"members">,
    channel_id?: Id<"channels">,
    conversation_id?: Id<"dm_conversations">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  updateMessage: (
    newContent: string,
    targetMessage: Message,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  deleteMessage: (
    message_id: Id<"messages">,
    creationTime: number,
    options?: {
      onBeforeDelete?: () => void;
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  toggleReaction: (
    value: string,
    targetMessage: Message,
    userWorkspaceMembershipId: Id<"members">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
}

export interface InjectedConversationData {
  data: Ref<ConversationData | null>;
  loadStatus: Ref<AsyncDataRequestStatus>;
  conversationId: ComputedRef<Id<"dm_conversations">>;
  orderedMessages: Ref<MessageListGroupedByDate>;
  isLoading: ComputedRef<boolean>;
  isSuccess: ComputedRef<boolean>;
  canLoadMore: Ref<boolean>;
  loadMore: (options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => void;
  loadingMore: Ref<boolean>;
  setOtherMemberId: (id: Id<"members"> | null) => Id<"members"> | null;
  addMessage: (
    message: string,
    image: File | null,
    user_id: Id<"users">,
    user_name: string,
    user_workspace_member_id: Id<"members">,
    channel_id?: Id<"channels">,
    conversation_id?: Id<"dm_conversations">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  updateMessage: (
    newContent: string,
    targetMessage: Message,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  deleteMessage: (
    message_id: Id<"messages">,
    creationTime: number,
    options?: {
      onBeforeDelete?: () => void;
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  toggleReaction: (
    value: string,
    targetMessage: Message,
    userWorkspaceMembershipId: Id<"members">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  clearData: () => void;
}

export interface InjectedThreadPanelControl {
  parentMessage: Ref<Message>;
  parentMessageId: Readonly<Ref<LocationQueryValue>>;
  profileMembershipId: Readonly<Ref<LocationQueryValue>>;
  setParentMessage: (message: Message) => void;
  data: Ref<{
    messages: typeof api.messages.getThreadByParentMessageId._returnType;
  }>;
  memberData: Ref<{
    member: typeof api.users.getByMembershipId._returnType;
  }>;
  orderedMessages: Ref<MessageListGroupedByDate>;
  clearData: () => void;
  loadStatus: Ref<AsyncDataRequestStatus>;
  refresh: () => Promise<void>;
  canLoadMore: Ref<boolean>;
  loadMore: (options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => Promise<void>;
  loadingMore: Ref<boolean>;
  loadMemberStatus: Ref<AsyncDataRequestStatus>;
  addReply: (
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
  ) => Promise<void>;
  updateReply: (
    newContent: string,
    targetMessage: Message,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  toggleReaction: (
    value: string,
    targetMessage: Message,
    userWorkspaceMembershipId: Id<"members">,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  deleteReply: (
    message_id: Id<"messages">,
    creationTime: number,
    options?: {
      onBeforeDelete?: () => void;
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => void;
  openThreadPanel: (message: Message) => void;
  openProfilePanel: (memberId: Id<"members">) => void;
  closeThreadPanel: () => Promise<void>;
}

export interface InjectedMemberProfileControl {
  profileMembershipId: Readonly<Ref<LocationQueryValue>>;
  data: Ref<{
    member: typeof api.users.getByMembershipId._returnType;
  }>;
  loadStatus: Ref<AsyncDataRequestStatus>;
  clearMemberData: () => void;
  openProfilePanel: (memberId: Id<"members">) => void;
  closeProfilePanel: () => void;
  updating: Ref<boolean>;
  removing: Ref<boolean>;
  updateMember: (
    newRole: string,
    option?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => Promise<void>;
  removeMember: (option?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => Promise<void>;
}

export interface EditorValue {
  message: string;
  image: File | null;
}

export type PaginatedMessageList =
  | typeof api.messages.get._returnType
  | typeof api.messages.getThreadByParentMessageId._returnType; // & { status: "sending" | "failed" | "sent" };

export type ConversationData = {
  conversationId: Id<"dm_conversations">;
  otherUser: Doc<"users">;
  messages: typeof api.messages.get._returnType;
};

export type Message = PaginatedMessageList["page"][number];

export type ChannelData = typeof api.channels.getById._returnType;
export type MessagesData = typeof api.messages.get._returnType;
export type MessageListGroupedByDate = [string, PaginatedMessageList["page"]][];
