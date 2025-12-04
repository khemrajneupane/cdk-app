import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  const body = JSON.parse(event.body || "{}");
  const id = randomUUID();

  await client.send(
    new PutItemCommand({
      TableName: process.env.TABLE_NAME!,
      Item: {
        id: { S: id },
        name: { S: body.name },
      },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ id, name: body.name }),
  };
};
