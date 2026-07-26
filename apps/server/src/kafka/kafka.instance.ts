import { Kafka } from "kafkajs";
import { env } from "@learn-broker/env/server";
import { KAFKA_CLIENT_ID, KAFKA_GROUPS, KAFKA_TOPICS } from "@/kafka/configs/config";

export const kafka = new Kafka({
  brokers: env.KAFKA_BROKERS.split(","),
  clientId: KAFKA_CLIENT_ID,
});

async function ensureTopics() {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: [
      { topic: KAFKA_TOPICS["chat.messages"], numPartitions: 3 },
      { topic: KAFKA_TOPICS["chat.processed"], numPartitions: 3 },
    ],
    waitForLeaders: true,
  });
  await admin.disconnect();
}

await ensureTopics();

export const producer = kafka.producer({ idempotent: true, transactionalId: "chats_tx" });
await producer.connect();

export const chat_consumer = kafka.consumer({ groupId: KAFKA_GROUPS.chat });
export const chat_processor = kafka.consumer({ groupId: KAFKA_GROUPS.chat_processor });
export const chat_processor_un = kafka.consumer({
  groupId: KAFKA_GROUPS.chat_processor,
  readUncommitted: true,
});

chat_consumer.on(chat_consumer.events.GROUP_JOIN, ({ payload, id, type }) => {
  console.log(payload);
  console.log(id);
  console.log(type);
});
chat_consumer.on(chat_consumer.events.REBALANCING, ({ payload, id, type }) => {
  console.log("=============REBALANCING===============");
  console.log(payload);
  console.log(id);
  console.log(type);
});

export const chat_analytics_consumer = kafka.consumer({
  groupId: KAFKA_GROUPS.chat_analytics,
});
await chat_analytics_consumer.connect();
await chat_analytics_consumer.subscribe({
  topic: KAFKA_TOPICS["chat.messages"],
  fromBeginning: true,
});

await chat_consumer.connect();
await chat_consumer.subscribe({
  topic: KAFKA_TOPICS["chat.messages"],
  fromBeginning: true,
});

await chat_processor.connect();
await chat_processor.subscribe({
  topic: KAFKA_TOPICS["chat.processed"],
  fromBeginning: true,
});

await chat_processor_un.connect();
await chat_processor_un.subscribe({
  topic: KAFKA_TOPICS["chat.processed"],
  fromBeginning: true,
});
