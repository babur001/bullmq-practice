import { queuesRouter } from "@/dashboard";
import { env } from "@learn-broker/env/server";
import cors from "cors";
import express from "express";

const app = express();

// Bull Board — live queue dashboard at http://localhost:3000/admin/queues
app.use("/admin/queues", queuesRouter);

// app.use(
//   cors({
//     origin: env.CORS_ORIGIN,
//     methods: ["GET", "POST", "OPTIONS"],
//   }),
// );

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
