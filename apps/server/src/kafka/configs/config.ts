export const KAFKA_CLIENT_ID = "ol-market";

export const KAFKA_TOPICS = {
  "page.views": "page.views",
  "chat.messages": "chat.messages",
  "chat.processed": "chat.processed",
} as const;

export const KAFKA_GROUPS = {
  printer: "printer",
  chat: "chat",
  chat_processor: "chat_processor",
  chat_analytics: "chat_analytics",
} as const;
