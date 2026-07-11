import z from "zod";

export const ZmessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    value: z.string().min(1).max(500),
  }),
  z.object({
    type: z.enum(["video", "image", "pdf"]),
    srcUrl: z.url(),
    value: z.string().min(1).max(500),
  }),
]);

export type IMessage = z.infer<typeof ZmessageSchema>;

export type TextMessage = Extract<IMessage, { type: "text" }>;

export function isMessageOnly(entity: IMessage): entity is TextMessage {
  return entity.type === "text";
}
