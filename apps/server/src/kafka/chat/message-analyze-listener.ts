import { chat_analytics_consumer } from "@/kafka/kafka.instance";

await chat_analytics_consumer.run({
  autoCommit: false,
  eachBatchAutoResolve: false,
  eachBatch: async ({
    batch,
    resolveOffset,
    heartbeat,
    commitOffsetsIfNecessary,
    isRunning,
    isStale,
  }) => {
    for (const message of batch.messages) {
      console.log(batch);

      if (!isRunning() || isStale()) break; // stop cleanly if we were revoked mid-batch

      await new Promise((res) => setTimeout(res, 2000)); // ← process

      resolveOffset(message.offset); // ← mark THIS record done (process-then-resolve = at-least-once)

      await heartbeat(); // ← stay alive during long work (§1.6a fix)
    }
    await commitOffsetsIfNecessary(); // ← the commit boundary is now yours
  },
});
