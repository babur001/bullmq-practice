import { chat_consumer } from "@/kafka/kafka.instance";

await chat_consumer.run({
  eachMessage: async ({ partition, message, topic }) => {
    console.log("=========CHAT==========");
    console.log("Parition", partition);
    console.log("Offset", message.offset);
    console.log("Offset", message.key?.toString());
    console.log("Value", message.value?.toString());
    console.log("=========CHAT==========");''
  },
});
