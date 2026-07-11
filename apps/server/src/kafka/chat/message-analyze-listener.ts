import { chat_analytics_consumer } from "@/kafka/kafka.instance";

await chat_analytics_consumer.run({
  eachMessage: async ({ partition, message, topic }) => {
    console.log("=========ANALYZE==========");
    console.log("Parition", partition);
    console.log("Offset", message.offset);
    console.log("Value", message.value?.toString("utf-8"));
    console.log("=========ANALYZE==========");
  },
});
