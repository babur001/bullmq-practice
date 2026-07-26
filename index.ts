import z from "zod";

const parseMessage = z.object({
  is_failed: z.boolean(),
  value: z.string(),
});
