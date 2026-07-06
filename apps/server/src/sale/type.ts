import type { TSagaBackwardStep, TSagaForwardStep } from "@learn-broker/db/schema/index";

export interface ISagaJob {
  sale_id: string;
  saga_outbox_id: number;
  region: string;
  step: TSagaForwardStep | TSagaBackwardStep;
}
