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
    topics: [{ topic: KAFKA_TOPICS["chat.messages"], numPartitions: 3 }],
    waitForLeaders: true,
  });
  await admin.disconnect();
}

await ensureTopics();

export const producer = kafka.producer({});
await producer.connect();

export const chat_consumer = kafka.consumer({ groupId: KAFKA_GROUPS.chat });

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
