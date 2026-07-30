import { KAFKA_TOPICS } from "@/kafka/configs/config";
import { producer } from "@/kafka/kafka.instance";

interface IChatProfileMessage {
  name: string;
  status: "online" | "offline";
}

export const sendMessageUseCase = async (input: unknown) => {
  const results = await producer.send({
    topic: KAFKA_TOPICS["chat.profiles-new"],
    messages: [
      // {
      //   key: "babur",
      //   value: JSON.stringify({
      //     name: "Bobur",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "babur",
      //   value: JSON.stringify({
      //     name: "Bobur",
      //     status: "offline",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "muhammadjon",
      //   value: JSON.stringify({
      //     name: "Muhammadjon",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "muhammadjon",
      //   value: JSON.stringify({
      //     name: "Muhammadjon",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "muhammadjon",
      //   value: JSON.stringify({
      //     name: "Muhammadjon",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "babur",
      //   value: JSON.stringify({
      //     name: "Bobur",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "babur",
      //   value: JSON.stringify({
      //     name: "Bobur",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "babur",
      //   value: JSON.stringify({
      //     name: "Bobur",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "babur",
      //   value: JSON.stringify({
      //     name: "Bobur",
      //     status: "offline",
      //   } as IChatProfileMessage),
      // },
      // {
      //   key: "abdullajon",
      //   value: JSON.stringify({
      //     name: "Abdullajan",
      //     status: "online",
      //   } as IChatProfileMessage),
      // },
      {
        key: "abdullajon",
        value: JSON.stringify({
          name: "Test-new",
          status: "online",
        } as IChatProfileMessage),
      },
    ],
    acks: -1,
  });

  results.map((result) => {
    console.log("====================");
    console.log(result);
  });
};
