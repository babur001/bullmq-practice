import { env } from "@learn-broker/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import * as p from "drizzle-orm/pg-core";
import * as d from "drizzle-orm";

import * as schema from "./schema";

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();
export { p, d };
