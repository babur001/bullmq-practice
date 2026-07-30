import { kafka } from "@/kafka/kafka.instance";

const profiles = new Map<string, unknown>();

const consumer = kafka.consumer({ groupId: `profile-cache-${Date.now()}` }); // fresh group → full replay
await consumer.connect();
await consumer.subscribe({ topic: "chat.profiles-new", fromBeginning: true });

await consumer.run({
  eachMessage: async ({ message }) => {
    const key = message.key!.toString();

    console.log(key);

    if (message.value === null) {
      profiles.delete(key); // ← tombstone: the delete notification
    } else {
      profiles.set(key, JSON.parse(message.value.toString())); // ← last-write-wins (§1.5!)
    }
  },
});

setInterval(() => {
  console.log(profiles);
}, 1000);
