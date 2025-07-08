import { format } from "date-fns";

import type { MessageListGroupedByDate, PaginatedMessageList } from "./types";

const groupOrderMessages: (
  messages: PaginatedMessageList | null
) => MessageListGroupedByDate = (messages: PaginatedMessageList | null) => {
  let messagesMap = new Map();
  messages?.page.forEach((message) => {
    const dateCreated = format(new Date(message._creationTime), "yyyy-MM-dd");

    // Group & order messages so that they work with "flex-col-reverse" tailwindcss class name
    if (messagesMap.has(dateCreated)) {
      const messageList = messagesMap.get(dateCreated);
      const newMessageList = [message, ...messageList];
      messagesMap.set(dateCreated, newMessageList);
    } else {
      messagesMap.set(dateCreated, [message]);
    }
  });

  return Array.from(messagesMap.entries());
};

export default groupOrderMessages;
