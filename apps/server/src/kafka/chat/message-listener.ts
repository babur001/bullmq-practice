import { KAFKA_GROUPS, KAFKA_TOPICS } from "@/kafka/configs/config";
import { chat_consumer, producer } from "@/kafka/kafka.instance";

await chat_consumer.run({
  autoCommit: false,
  eachBatchAutoResolve: false,
  eachBatch: async ({
    batch,
    resolveOffset,
    heartbeat,
    commitOffsetsIfNecessary,
    uncommittedOffsets,
    isRunning,
    isStale,
  }) => {
    const tx = await producer.transaction();

    try {
      if (batch.messages.length === 0) return;

      for (const message of batch.messages) {
        if (!isRunning() || isStale()) {
          tx.abort();
          break;
        }

        // @ts-ignore
        const data: { is_failed: boolean; value: string } = JSON.parse(message.value);

        const transformed = data.value.toUpperCase();

        await tx.send({
          topic: KAFKA_TOPICS["chat.processed"],
          messages: [{ key: message.key, value: transformed }],
        });

        resolveOffset(message.offset);
        await heartbeat();

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

      // Here why we cant call commitOffsetsIfNecessary(uncommittedOffsets), since we break the atomicity
      // Then why we call resolveOffset(message.offset) then?? If we are doing the commits ourselves
      await tx.sendOffsets({
        consumerGroupId: KAFKA_GROUPS.chat,
        topics: [
          {
            topic: batch.topic,
            partitions: [
              {
                offset: String(Number(batch.lastOffset()) + 1),
                partition: batch.partition,
              },
            ],
          },
        ],
      });

      // throw new Error("CRASHED");

      await tx.commit();
    } catch (err) {
      await tx.abort(); // ── neither B nor the offset lands
      throw err;
    }
  },
});

/*

4. Exercise

1. Cause there is a sequence number for each producer PID, so getting duplicate sequence in next retry does not cause harm and drops the copy
2. Interesting thin, dead records still shows up in kafka, like in postgresql the dead tuples is not shown. And also i noted that the order is reversed from chat, 1,2,3 in chat processor -> 3,2,1 messages arrive
3. Done 2nd message
4. It happends, the lost date and no atomicity might happen. Either we should write only to db then with outbox pattern process the job, or vice versa directly using kafka tx work inside out
Also with uncommitted consumer, some of the messages are not being shown, like 87th message, then i noticed, that this message was in another partition, in partition that the readUncommitted:false consumer was listening to!
It means readUncommitted: Does not separate consumer groups! Same group id rebalance happens together regardless of readUncommitted differs!

**/
