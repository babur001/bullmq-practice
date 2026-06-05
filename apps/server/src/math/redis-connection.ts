import { env } from "@learn-broker/env/server";
import Redis from "ioredis";

export const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
