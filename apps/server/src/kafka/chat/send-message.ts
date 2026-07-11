import { ZmessageSchema } from "@/kafka/chat/schema/z-message.schema";
import { KAFKA_TOPICS } from "@/kafka/configs/config";
import { producer } from "@/kafka/kafka.instance";
import { randomBytes } from "node:crypto";
import z from "zod";

export const sendMessageUseCase = async (input: unknown) => {
  const message = z.parse(ZmessageSchema, input);

  console.log(randomBytes(2).toString("hex"));

  const results = await producer.send({
    topic: KAFKA_TOPICS["chat.messages"],
    acks: -1,
    messages: [
      { key: "room-45", value: "Hi, team! Glad to join to the team!" },
      { key: "room-45", value: "Hi, Muhammad, glad to see you here too!" },
      { key: "room-45", value: "Same here!" },
      {
        key: "room-45",
        value: "This is our new colleague, Server Infrastructure Engineer, Muhammadjon!",
      },
      { key: "room-45", value: "Wow, happy to see you join our team :)" },
      {
        key: "room-42",
        value:
          "By colleagues, i am joining another team, happy to work with you all here!",
      },
      {
        key: "room-2",
        value: "Is there any progress with Marketing Campaign?",
      },
      {
        key: "room-2",
        value:
          "We are waiting for budget approval from our SEO.. Everything is ready for launch",
      },
      {
        value: "ORDER - 1",
      },
      {
        value: "ORDER - 2",
      },
      {
        value: "ORDER - 3",
      },
      {
        value: "ORDER - 4",
      },
      {
        value: "ORDER - 5",
      },
      {
        value: "ORDER - 6",
      },
    ],
  });

  results.map((result) => {
    console.log("====================");
    console.log(result);
  });
};

/**
 
Mini challenge:
1. With changed partition count, the landed record might change its partition number this breaks ordering. It is the reason, because in some cases it might be uncritical to follow order, but in most cases order does matter
2. We did not learn idempotency and retries here
3. Setting one consumer for all partition or one partition only

 */
