import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  console.log("Save to DynamoDB event:", event);

  await client.send(
    new PutItemCommand({
      TableName: process.env.TABLE_NAME!,
      Item: {
        orderId: { S: event.orderId },
        amount: { N: String(event.amount) },
        status: { S: event.status },
        processedAt: { S: event.processedAt },
      },
    })
  );

  return {
    ...event,
    saved: true,
  };
};
