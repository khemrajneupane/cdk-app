import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id;
    const body = JSON.parse(event.body || "{}");

    if (!id) {
      return { statusCode: 400, body: "Missing id" };
    }
    if (!body.name) {
      return { statusCode: 400, body: "name is required" };
    }

    await client.send(
      new UpdateItemCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { id: { S: id } },
        UpdateExpression: "SET #n = :name",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: { ":name": { S: body.name } },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ id, name: body.name }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: err.message };
  }
};
