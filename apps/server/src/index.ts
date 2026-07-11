import express from "express";
import "@/kafka/kafka.instance";
import { sendMessageUseCase } from "@/kafka/chat/send-message";
const app = express();

app.use(express.json());

app.get("/send-message", async (_req, res) => {
  console.log(_req.query);

  await sendMessageUseCase(_req.query);
  res.send("success");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
