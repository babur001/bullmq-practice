import type { TSagaStep } from "@learn-broker/db/schema/index";

export interface ISagaJob {
  sale_id: string;
  step: TSagaStep;
}
