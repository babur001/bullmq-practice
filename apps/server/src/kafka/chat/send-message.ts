import { KAFKA_TOPICS } from "@/kafka/configs/config";
import { producer } from "@/kafka/kafka.instance";

export const sendMessageUseCase = async (input: unknown) => {
  const results = await producer.send({
    topic: KAFKA_TOPICS["chat.messages"],
    acks: -1,
    messages: [
      {
        value: JSON.stringify({
          is_failed: false,
          value: "Assalomu Alaykum",
        }),
      },
      {
        value: JSON.stringify({
          is_failed: true,
          value: "Vo Alaykum Assalom",
        }),
      },
      {
        value: JSON.stringify({
          is_failed: false,
          value: "Kechagi ishlarimiz bo'ldimi?",
        }),
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
