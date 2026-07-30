export const KAFKA_CLIENT_ID = "ol-market";

export const KAFKA_TOPICS = {
  "page.views": "page.views",
  "chat.messages": "chat.messages",
  "chat.processed": "chat.processed",
  "chat.profiles": "chat.profiles",
  "chat.profiles-new": "chat.profiles-new",
} as const;

export const KAFKA_GROUPS = {
  printer: "printer",
  chat: "chat",
  chat_processor: "chat_processor",
  chat_analytics: "chat_analytics",
} as const;
