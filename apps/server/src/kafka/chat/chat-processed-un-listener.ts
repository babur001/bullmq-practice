import { chat_processor_un } from "@/kafka/kafka.instance";

await chat_processor_un.run({
  eachBatchAutoResolve: true,
  eachBatch: async ({
    batch,
    resolveOffset,
    heartbeat,
    commitOffsetsIfNecessary,
    uncommittedOffsets,
    isRunning,
    isStale,
  }) => {
    if (batch.messages.length === 0) return;

    for (const message of batch.messages) {
      if (!isRunning() || isStale()) {
        break;
      }

      console.log({
        topic: batch.topic,
        partition: batch.partition,
        highWatermark: batch.highWatermark,
        message: {
          offset: message.offset,
          key: message.key?.toString(),
          value: message.value?.toString(),
          headers: message.headers,
        },
      });
    }
  },
});
