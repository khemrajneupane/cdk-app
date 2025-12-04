import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({});

export const handler = async () => {
  const message = {
    id: Date.now(),
    text: "Hello from Sender Lambda",
  };

  await client.send(
    new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL!,
      MessageBody: JSON.stringify(message),
    })
  );

  return {
    statusCode: 200,
    body: "Message sent to SQS",
  };
};
